"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to game after successful login
      router.push("/game");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--dark-bg)] p-4">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[var(--darker-bg)]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--neon-blue) 1px, transparent 1px),
                linear-gradient(to bottom, var(--neon-blue) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              opacity: 0.1,
              transform: "perspective(500px) rotateX(60deg)",
              transformOrigin: "center bottom",
            }}
          />
        </div>
      </div>

      {/* Login container */}
      <div className="w-full max-w-md z-10 relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-12 h-12 overflow-hidden">
              <div className="glitch-wrapper">
                <div className="glitch">
                  <Image
                    src="/pixel-logo.png"
                    alt="CodeQuest Pixels Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <span className="font-bold text-2xl tracking-tight font-[family-name:var(--font-geist-mono)] neon-text">
              CodeQuest<span className="text-[var(--neon-pink)]">Pixels</span>
            </span>
          </Link>
        </div>

        {/* Login form */}
        <div className="bg-[var(--dark-surface)] border border-[var(--neon-blue)] p-8 rounded-md pixel-corners">
          <h1 className="text-2xl font-bold mb-6 text-center neon-text">
            LOGIN
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-300 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-[family-name:var(--font-geist-mono)] text-gray-300">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--darker-bg)] border border-[var(--light-surface)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] focus:border-transparent text-white"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-[family-name:var(--font-geist-mono)] text-gray-300">
                  PASSWORD
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[var(--neon-blue)] hover:text-[var(--neon-purple)]"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--darker-bg)] border border-[var(--light-surface)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] focus:border-transparent text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="cyber-button-alt w-full py-2 text-center relative overflow-hidden group"
            >
              {isLoading ? (
                <div className="loading-pixels">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              ) : (
                "ENTER THE GRID"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">New to the system?</span>{" "}
            <Link
              href="/register"
              className="text-[var(--neon-pink)] hover:text-[var(--neon-purple)]"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 flex justify-center items-center">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent"></div>
          <div className="mx-4 text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
            SECURE LOGIN
          </div>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
