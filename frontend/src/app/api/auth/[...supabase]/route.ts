import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const path = requestUrl.pathname.split("/").pop();

  // Create Supabase client using cookies
  const supabase = createRouteHandlerClient({ cookies });

  // Handle authentication callbacks
  if (path === "callback" && code) {
    // Exchange auth code for session
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  // Handle sign out
  if (path === "signout") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  // Handle user data
  if (path === "user") {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message || "User not found" },
        { status: 401 }
      );
    }

    // Get additional user data from our custom users table
    const { data, error: profileError } = await supabase
      .from("users")
      .select("*, player_stats(*)")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        ...user,
        profile: data,
      },
    });
  }

  // Default fallback
  return NextResponse.json(
    { error: "Auth endpoint not found" },
    { status: 404 }
  );
}
