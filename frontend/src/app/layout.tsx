import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SupabaseProvider } from "@/lib/supabase-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeQuest Pixels | Gamified Coding Adventure",
  description: "Learn programming through interactive, gamified challenges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col bg-gray-900 text-white`}
      >
        <SupabaseProvider>
          <Toaster position="top-right" richColors />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
