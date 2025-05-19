"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password) {
      setError("Please fill out all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          },
        },
      });

      if (error) throw error;

      // Show success and redirect
      router.push("/login?registered=true");
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to register");
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
                linear-gradient(to right, var(--neon-pink) 1px, transparent 1px),
                linear-gradient(to bottom, var(--neon-pink) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              opacity: 0.1,
              transform: "perspective(500px) rotateX(60deg)",
              transformOrigin: "center bottom",
            }}
          />
        </div>
      </div>

      {/* Register container */}
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

        {/* Register form */}
        <div className="bg-[var(--dark-surface)] border border-[var(--neon-pink)] p-8 rounded-md pixel-corners">
          <h1 className="text-2xl font-bold mb-6 text-center neon-text-pink">
            CREATE ACCOUNT
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-300 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-[family-name:var(--font-geist-mono)] text-gray-300">
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--darker-bg)] border border-[var(--light-surface)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--neon-pink)] focus:border-transparent text-white"
                placeholder="codehacker42"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-[family-name:var(--font-geist-mono)] text-gray-300">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--darker-bg)] border border-[var(--light-surface)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--neon-pink)] focus:border-transparent text-white"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-[family-name:var(--font-geist-mono)] text-gray-300">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--darker-bg)] border border-[var(--light-surface)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--neon-pink)] focus:border-transparent text-white"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500">
                Must be at least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-[family-name:var(--font-geist-mono)] text-gray-300">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--darker-bg)] border border-[var(--light-surface)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--neon-pink)] focus:border-transparent text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="cyber-button w-full py-2 text-center relative overflow-hidden group bg-[var(--neon-pink)] border-[var(--neon-pink)] text-white hover:bg-[var(--neon-pink)]/80"
              >
                {isLoading ? (
                  <div className="loading-pixels">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                ) : (
                  "CREATE DIGITAL IDENTITY"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">Already have an account?</span>{" "}
            <Link
              href="/login"
              className="text-[var(--neon-blue)] hover:text-[var(--neon-purple)]"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 flex justify-center items-center">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[var(--neon-pink)] to-transparent"></div>
          <div className="mx-4 text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
            JOIN THE NETWORK
          </div>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[var(--neon-pink)] to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
