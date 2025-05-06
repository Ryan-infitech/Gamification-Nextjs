import { useState } from "react";
import { Toaster } from "sonner";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  // Create a Supabase client for authentication
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <AuthProvider>
        <Toaster position="top-right" />
        <Component {...pageProps} />
      </AuthProvider>
    </SessionContextProvider>
  );
}
