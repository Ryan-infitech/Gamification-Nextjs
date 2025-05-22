import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';

// Secret key untuk JWT signing
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-minimum-32-chars-long'
);

/**
 * GET handler untuk mengambil session user
 */
export async function GET(request: NextRequest) {
  try {
    // Parse cookie untuk mendapatkan token
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    // Verify JWT token
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (!payload.sub) {
        return NextResponse.json({ user: null }, { status: 401 });
      }
      
      // Get user data from Supabase
      const supabase = createRouteHandlerClient({ cookies });
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.sub)
        .single();
      
      if (error || !userData) {
        return NextResponse.json({ user: null }, { status: 401 });
      }
      
      // Return user data without sensitive information
      const { password_hash, reset_password_token, verification_token, ...safeUserData } = userData;
      
      return NextResponse.json({ user: safeUserData });
    } catch (err) {
      console.error('JWT verification error:', err);
      return NextResponse.json({ user: null }, { status: 401 });
    }
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler untuk login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate with Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      return NextResponse.json(
        { message: authError.message },
        { status: 401 }
      );
    }
    
    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user?.id)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json(
        { message: 'User data not found' },
        { status: 404 }
      );
    }
    
    // Update login streak
    await supabase
      .from('users')
      .update({ login_streak: userData.login_streak + 1 })
      .eq('id', userData.id);
    
    // Create JWT token
    const token = await new SignJWT({ role: userData.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userData.id)
      .setIssuedAt()
      .setExpirationTime('8h') // Token expiry
      .sign(JWT_SECRET);
    
    // Set HTTP-only cookie
    const response = NextResponse.json(
      { user: { ...userData, password_hash: undefined } },
      { status: 200 }
    );
    
    // Set auth cookie
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });
    
    // Set refresh token cookie
    const refreshToken = uuidv4();
    response.cookies.set({
      name: 'refresh-token',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    // Store refresh token in database for validation
    await supabase
      .from('user_refresh_tokens')
      .insert({
        user_id: userData.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    
    // Log login action
    await supabase
      .from('session_logs')
      .insert({
        user_id: userData.id,
        action: 'login',
        ip_address: request.headers.get('x-forwarded-for') || request.ip,
        user_agent: request.headers.get('user-agent'),
        status: 'success'
      });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Register handler
 * Use a separate route file for clarity - this is just for demonstration
 */
export async function register(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();
    
    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Username, email, and password are required' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or username already exists' },
        { status: 409 }
      );
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      );
    }
    
    // Create verification token
    const verificationToken = uuidv4();
    
    // Insert user in our users table
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user?.id,
        username,
        email,
        password_hash: 'hashed_in_supabase_auth', // We don't store actual password hash in our table
        role: 'student', // Default role
        verification_token: verificationToken,
        verified: false
      })
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json(
        { message: insertError.message },
        { status: 400 }
      );
    }
    
    // Initialize player stats
    await supabase
      .from('player_stats')
      .insert({
        user_id: userData.id
      });
    
    // Initialize game progress
    await supabase
      .from('game_progress')
      .insert({
        user_id: userData.id
      });
    
    // Initialize user preferences
    await supabase
      .from('user_preferences')
      .insert({
        user_id: userData.id
      });
    
    // Send verification email (implementation depends on your email service)
    // Implementation omitted for brevity
    
    return NextResponse.json({
      success: true,
      verificationRequired: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Logout handler
 */
export async function logout(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user ID from token for logging
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    let userId = null;
    
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.sub;
      } catch (err) {
        console.error('JWT verification error during logout:', err);
      }
    }
    
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    
    // Remove refresh token from database
    const refreshToken = cookieStore.get('refresh-token')?.value;
    if (refreshToken) {
      await supabase
        .from('user_refresh_tokens')
        .delete()
        .eq('token', refreshToken);
    }
    
    // Log logout action
    if (userId) {
      await supabase
        .from('session_logs')
        .insert({
          user_id: userId,
          action: 'logout',
          ip_address: request.headers.get('x-forwarded-for') || request.ip,
          user_agent: request.headers.get('user-agent'),
          status: 'success'
        });
    }
    
    // Clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
    response.cookies.set({
      name: 'refresh-token',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Route handler for dynamic Supabase auth routes
 */
export async function GET(request: NextRequest, { params }: { params: { supabase: string[] } }) {
  const authAction = params.supabase[0];
  
  switch (authAction) {
    case 'session':
      return GET(request);
    default:
      return NextResponse.json(
        { message: 'Route not found' },
        { status: 404 }
      );
  }
}

export async function POST(request: NextRequest, { params }: { params: { supabase: string[] } }) {
  const authAction = params.supabase[0];
  
  switch (authAction) {
    case 'login':
      return POST(request);
    case 'register':
      return register(request);
    case 'logout':
      return logout(request);
    // Implement other routes (reset-password, verify-email, etc.) as needed
    default:
      return NextResponse.json(
        { message: 'Route not found' },
        { status: 404 }
      );
  }
}
