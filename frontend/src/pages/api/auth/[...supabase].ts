import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { cookies } from "next/headers";

/**
 * API route handler for Supabase Auth
 *
 * This route handles Supabase auth redirects and callbacks
 * Route pattern: /api/auth/{any supabase auth path}
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const path = req.query["supabase"] as string[];

  // Create Supabase client using cookies
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // Handle authentication callbacks
    if (path.includes("callback")) {
      const { code } = req.query;

      if (code) {
        // Exchange auth code for session
        await supabase.auth.exchangeCodeForSession(String(code));
        return res.redirect(302, "/dashboard");
      }

      return res.status(400).json({ error: "No code provided" });
    }

    // Handle sign out
    if (path.includes("signout")) {
      await supabase.auth.signOut();
      return res.redirect(302, "/");
    }

    // Handle refresh token
    if (path.includes("refresh")) {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // Handle user data
    if (path.includes("user")) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return res
          .status(401)
          .json({ error: error?.message || "User not found" });
      }

      // Get additional user data from our custom users table
      const { data, error: profileError } = await supabase
        .from("users")
        .select("*, player_stats(*)")
        .eq("id", user.id)
        .single();

      if (profileError) {
        return res.status(500).json({ error: profileError.message });
      }

      return res.status(200).json({
        user: {
          ...user,
          profile: data,
        },
      });
    }

    // Default fallback
    return res.status(404).json({ error: "Auth endpoint not found" });
  } catch (error: any) {
    console.error("Auth API error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// We need to disable body parsing for Supabase auth callbacks to work
export const config = {
  api: {
    bodyParser: false,
  },
};
