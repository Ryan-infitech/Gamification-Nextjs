import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  ProgrammingLanguage, 
  ChallengeSubmission, 
  TestCaseResult 
} from '@/types/challenges';
import { auth } from '@/lib/auth';

/**
 * Tipe untuk payload request evaluasi kode
 */
export interface CodeEvaluationPayload {
  /**
   * ID tantangan yang ingin dievaluasi
   */
  challengeId: string;
  
  /**
   * Kode yang disubmit
   */
  code: string;
  
  /**
   * Bahasa pemrograman yang digunakan
   */
  language: ProgrammingLanguage;
  
  /**
   * ID user (opsional, akan diambil dari session jika tidak disediakan)
   */
  userId?: string;
}

/**
 * Variabel untuk throttling user agar tidak melakukan terlalu banyak request
 */
const evaluationThrottleMap = new Map<string, number>();
const THROTTLE_LIMIT_MS = 2000; // 2 detik antar request

/**
 * Handler untuk POST request evaluasi kode
 */
export async function POST(request: NextRequest) {
  try {
    // Cek autentikasi
    const session = await auth();
    
    // Jika tidak ada sesi, kembalikan unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to evaluate code.' },
        { status: 401 }
      );
    }
    
    // Parse payload dari body
    const payload: CodeEvaluationPayload = await request.json();
    
    // Validasi payload
    if (!payload.challengeId || !payload.code || !payload.language) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, code, or language' },
        { status: 400 }
      );
    }
    
    // Gunakan user ID dari payload atau dari sesi
    const userId = payload.userId || session.user.id;
    
    // Cek rate limiting untuk user
    const lastEvaluationTime = evaluationThrottleMap.get(userId);
    const now = Date.now();
    
    if (lastEvaluationTime && now - lastEvaluationTime < THROTTLE_LIMIT_MS) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait before submitting again.',
          retryAfter: THROTTLE_LIMIT_MS - (now - lastEvaluationTime)
        },
        { status: 429 }
      );
    }
    
    // Update throttle map
    evaluationThrottleMap.set(userId, now);
    
    // Inisialisasi Supabase client
    const supabase = createClient();
    
    // Log submission ke database
    const { data: submissionData, error: submissionError } = await supabase
      .from('challenge_submissions')
      .insert({
        user_id: userId,
        challenge_id: payload.challengeId,
        code: payload.code,
        language: payload.language,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (submissionError) {
      console.error('Error saving submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }
    
    const submissionId = submissionData.id;
    
    // Kirim kode ke backend untuk evaluasi
    // Ini bisa berupa panggilan ke API backend atau service backend-for-frontend
    const evaluationResponse = await fetch(`${process.env.BACKEND_URL}/api/challenges/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      },
      body: JSON.stringify({
        submissionId,
        challengeId: payload.challengeId,
        code: payload.code,
        language: payload.language,
        userId
      })
    });
    
    // Tangani respons error dari backend
    if (!evaluationResponse.ok) {
      // Update status submission menjadi error
      await supabase
        .from('challenge_submissions')
        .update({
          status: 'error',
          error_message: 'Failed to evaluate code',
          processed_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      // Log error dan kembalikan respons
      const errorData = await evaluationResponse.json();
      console.error('Backend evaluation error:', errorData);
      
      return NextResponse.json(
        { error: errorData.message || 'Failed to evaluate code' },
        { status: evaluationResponse.status }
      );
    }
    
    // Parsing hasil evaluasi dari backend
    const evaluationResult = await evaluationResponse.json();
    
    // Siapkan test results dari response backend
    const testResults: TestCaseResult[] = evaluationResult.testResults || [];
    
    // Hitung jumlah test yang lulus
    const passedTestCount = testResults.filter(test => test.passed).length;
    const totalTestCount = testResults.length;
    
    // Hitung score berdasarkan jumlah test yang lulus (0-100)
    const score = totalTestCount > 0 ? Math.round((passedTestCount / totalTestCount) * 100) : 0;
    
    // Status submission (success jika semua test lulus)
    const status = passedTestCount === totalTestCount ? 'success' : 'failed';
    
    // Update submission di database dengan hasil evaluasi
    const { error: updateError } = await supabase
      .from('challenge_submissions')
      .update({
        status,
        test_results: testResults,
        passed_test_count: passedTestCount,
        score,
        execution_time: evaluationResult.executionTime,
        processed_at: new Date().toISOString()
      })
      .eq('id', submissionId);
    
    if (updateError) {
      console.error('Error updating submission with results:', updateError);
    }
    
    // Jika semua test lulus, update completed_challenges
    if (status === 'success') {
      // Cek apakah tantangan sudah selesai sebelumnya
      const { data: existingCompletion } = await supabase
        .from('completed_challenges')
        .select('id, score')
        .eq('user_id', userId)
        .eq('challenge_id', payload.challengeId)
        .single();
      
      if (existingCompletion) {
        // Update jika score baru lebih tinggi
        if (score > (existingCompletion.score || 0)) {
          await supabase
            .from('completed_challenges')
            .update({
              score,
              solution_code: payload.code,
              completed_at: new Date().toISOString()
            })
            .eq('id', existingCompletion.id);
        }
      } else {
        // Buat entry baru di completed_challenges
        await supabase
          .from('completed_challenges')
          .insert({
            user_id: userId,
            challenge_id: payload.challengeId,
            score,
            solution_code: payload.code,
            completed_at: new Date().toISOString()
          });
        
        // Tambahkan XP ke user
        // Dapatkan XP reward dari challenge
        const { data: challengeData } = await supabase
          .from('challenges')
          .select('xp_reward')
          .eq('id', payload.challengeId)
          .single();
        
        const xpReward = challengeData?.xp_reward || 100;
        
        // Update stats player dengan XP baru
        await supabase.rpc('increment_player_xp', { 
          p_user_id: userId,
          p_xp_amount: xpReward
        });
      }
    }
    
    // Kembalikan hasil evaluasi ke client
    return NextResponse.json({
      submissionId,
      challengeId: payload.challengeId,
      status,
      testResults,
      passedTestCount,
      totalTestCount,
      score,
      executionTime: evaluationResult.executionTime,
      success: status === 'success'
    });
    
  } catch (error) {
    console.error('Unhandled error in code evaluation:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while evaluating your code',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk GET request (mendapatkan hasil evaluasi sebelumnya)
 */
export async function GET(request: NextRequest) {
  try {
    // Cek autentikasi
    const session = await auth();
    
    // Jika tidak ada sesi, kembalikan unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view evaluation results.' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const challengeId = searchParams.get('challengeId');
    const submissionId = searchParams.get('submissionId');
    
    if (!challengeId && !submissionId) {
      return NextResponse.json(
        { error: 'Either challengeId or submissionId is required' },
        { status: 400 }
      );
    }
    
    // Inisialisasi Supabase client
    const supabase = createClient();
    
    let query = supabase
      .from('challenge_submissions')
      .select('*');
    
    // Filter berdasarkan params yang diberikan
    if (submissionId) {
      // Jika submissionId diberikan, cari berdasarkan ID submission
      query = query.eq('id', submissionId);
    } else {
      // Jika tidak, cari berdasarkan challengeId dan user saat ini
      query = query
        .eq('challenge_id', challengeId)
        .eq('user_id', session.user.id)
        .order('submitted_at', { ascending: false })
        .limit(1);
    }
    
    // Jalankan query
    const { data, error } = await query.single();
    
    if (error) {
      // Jika "No rows found" error, itu berarti tidak ada submission sebelumnya
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'No previous submissions found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching submission:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submission results' },
        { status: 500 }
      );
    }
    
    // Format response
    return NextResponse.json({
      submissionId: data.id,
      challengeId: data.challenge_id,
      status: data.status,
      testResults: data.test_results,
      passedTestCount: data.passed_test_count,
      totalTestCount: data.test_results?.length || 0,
      score: data.score,
      executionTime: data.execution_time,
      code: data.code,
      language: data.language,
      submittedAt: data.submitted_at,
      processedAt: data.processed_at,
      success: data.status === 'success'
    });
    
  } catch (error) {
    console.error('Unhandled error in fetching evaluation results:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
