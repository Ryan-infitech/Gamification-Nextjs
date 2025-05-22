import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { QuizAnswer } from '@/types/quiz';

/**
 * Interface untuk body request quiz submission
 */
interface SubmitQuizRequest {
  /**
   * ID of the quiz
   */
  quizId: string;
  
  /**
   * Array of user answers
   */
  answers: QuizAnswer[];
}

/**
 * Handler untuk POST request quiz submission
 */
export async function POST(request: NextRequest) {
  try {
    // Cek autentikasi
    const session = await auth();
    
    // Jika tidak ada sesi, kembalikan unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit a quiz.' },
        { status: 401 }
      );
    }
    
    // Parse payload dari body
    const payload: SubmitQuizRequest = await request.json();
    
    // Validasi payload
    if (!payload.quizId || !Array.isArray(payload.answers)) {
      return NextResponse.json(
        { error: 'Missing required fields: quizId, answers' },
        { status: 400 }
      );
    }
    
    // Dapatkan userId dari session
    const userId = session.user.id;
    
    // Inisialisasi Supabase client
    const supabase = createClient();
    
    // Ambil informasi quiz dan question dari database
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer')
      .eq('quiz_id', payload.quizId);
    
    if (quizError) {
      console.error('Error fetching quiz questions:', quizError);
      return NextResponse.json(
        { error: 'Failed to validate quiz answers' },
        { status: 500 }
      );
    }
    
    // Validasi dan hitung score
    let correctCount = 0;
    
    // Map jawaban user untuk menyimpan ID dan opsi yang dipilih
    const userAnswers = payload.answers.reduce((acc, answer) => {
      acc[answer.questionId] = answer.selectedOptionId;
      return acc;
    }, {} as Record<string, string>);
    
    // Cek jawaban yang benar
    for (const question of quizData) {
      const userAnswer = userAnswers[question.id];
      if (userAnswer && userAnswer === question.correct_answer) {
        correctCount++;
      }
    }
    
    // Hitung score (presentase jawaban benar)
    const totalQuestions = quizData.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    
    // Dapatkan info quiz untuk XP reward
    const { data: quiz, error: quizInfoError } = await supabase
      .from('quizzes')
      .select('title, xp_reward, category')
      .eq('id', payload.quizId)
      .single();
    
    if (quizInfoError) {
      console.error('Error fetching quiz info:', quizInfoError);
      // Continue anyway, we'll just not give XP
    }
    
    // Determine XP reward based on score
    const baseXp = quiz?.xp_reward || 50; // Default to 50 if not set
    const xpMultiplier = score / 100; // 0 to 1 based on score
    const xpEarned = Math.round(baseXp * xpMultiplier);
    
    // Cek apakah user sudah pernah submit quiz ini
    const { data: existingAttempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('id, score')
      .eq('user_id', userId)
      .eq('quiz_id', payload.quizId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let isNewBest = false;
    
    // Simpan attempt ke database
    const timestamp = new Date().toISOString();
    
    const { data: attemptData, error: insertError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id: payload.quizId,
        score,
        answers: payload.answers,
        completed_at: timestamp,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error saving quiz attempt:', insertError);
      return NextResponse.json(
        { error: 'Failed to save quiz attempt' },
        { status: 500 }
      );
    }
    
    // Jika ini score terbaik, berikan XP
    if (!existingAttempt || score > existingAttempt.score) {
      isNewBest = true;
      
      // Update stats player dengan XP baru jika score lebih baik dari sebelumnya
      if (xpEarned > 0) {
        // Jika tidak ada previous attempt atau score lebih baik, berikan full XP
        await supabase.rpc('increment_player_xp', { 
          p_user_id: userId,
          p_xp_amount: xpEarned
        });
      }
      
      // Update completed_challenges table untuk track progress
      const { data: challengeData, error: challengeError } = await supabase
        .from('completed_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', `quiz_${payload.quizId}`)
        .single();
        
      if (challengeData) {
        // Update jika sudah ada
        await supabase
          .from('completed_challenges')
          .update({
            score,
            completed_at: timestamp
          })
          .eq('id', challengeData.id);
      } else {
        // Insert baru jika belum ada
        await supabase
          .from('completed_challenges')
          .insert({
            user_id: userId,
            challenge_id: `quiz_${payload.quizId}`,
            score,
            completed_at: timestamp
          });
      }
    }
    
    // Kirim notifikasi jika score perfect (100%)
    if (score === 100) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'achievement',
          title: 'Perfect Score!',
          message: `You got a perfect score on the quiz: ${quiz?.title || 'Quiz'}`,
          data: { 
            quizId: payload.quizId,
            score,
            xpEarned
          }
        });
    }
    
    // Return result dengan data yang diperlukan
    return NextResponse.json({
      quizId: payload.quizId,
      attemptId: attemptData.id,
      score,
      correctCount,
      totalQuestions,
      answers: payload.answers,
      xpEarned: isNewBest ? xpEarned : 0,
      isNewBest,
      timestamp
    });
    
  } catch (error) {
    console.error('Unhandled error in quiz submission:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while submitting your quiz',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk GET method (untuk mengambil submission terakhir)
 */
export async function GET(request: NextRequest) {
  try {
    // Cek autentikasi
    const session = await auth();
    
    // Jika tidak ada sesi, kembalikan unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view submissions.' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const quizId = searchParams.get('quizId');
    const attemptId = searchParams.get('attemptId');
    
    if (!quizId && !attemptId) {
      return NextResponse.json(
        { error: 'Either quizId or attemptId is required' },
        { status: 400 }
      );
    }
    
    // Dapatkan userId dari session
    const userId = session.user.id;
    
    // Inisialisasi Supabase client
    const supabase = createClient();
    
    let query = supabase
      .from('quiz_attempts')
      .select('*');
    
    // Filter berdasarkan params yang diberikan
    if (attemptId) {
      // Jika attemptId diberikan, cari berdasarkan ID submission
      query = query.eq('id', attemptId);
    } else {
      // Jika tidak, cari berdasarkan quizId dan user saat ini
      query = query
        .eq('quiz_id', quizId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
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
      
      console.error('Error fetching quiz submission:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz submission' },
        { status: 500 }
      );
    }
    
    // Format response
    return NextResponse.json({
      attemptId: data.id,
      quizId: data.quiz_id,
      score: data.score,
      answers: data.answers,
      completedAt: data.completed_at,
    });
    
  } catch (error) {
    console.error('Unhandled error in fetching quiz submission:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
