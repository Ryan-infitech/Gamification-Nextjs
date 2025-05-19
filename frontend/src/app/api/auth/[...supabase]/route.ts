import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Create a Supabase client for server-side auth
    const supabase = createRouteHandlerClient({ cookies });

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);

    // Redirect to the appropriate page after authentication
    const redirectTo = requestUrl.searchParams.get("redirect_to") || "/game";
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  }

  // If no code is present, redirect to the login page
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}

export async function POST(request: NextRequest) {
  // Handle POST requests for auth operations
  const supabase = createRouteHandlerClient({ cookies });
  const requestData = await request.json();
  const { action, ...data } = requestData;

  switch (action) {
    case "sign-in":
      const { email, password } = data;
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return NextResponse.json(signInResult);

    case "sign-up":
      const {
        email: signUpEmail,
        password: signUpPassword,
        username,
        displayName,
      } = data;
      const signUpResult = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            username,
            display_name: displayName || username,
          },
        },
      });
      return NextResponse.json(signUpResult);

    case "sign-out":
      const signOutResult = await supabase.auth.signOut();
      return NextResponse.json(signOutResult);

    case "reset-password":
      const { email: resetEmail } = data;
      const resetResult = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        {
          redirectTo: `${requestData.origin}/reset-password`,
        }
      );
      return NextResponse.json(resetResult);

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
