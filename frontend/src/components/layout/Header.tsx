"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearUser();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  return (
    <header className="bg-[var(--pixel-dark)] border-b-4 border-[var(--pixel-gray)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[var(--pixel-blue)] flex items-center justify-center">
              <span className="font-['Press_Start_2P'] text-xs text-white">
                CQ
              </span>
            </div>
            <div>
              <span className="font-['Press_Start_2P'] text-sm">
                <span className="text-[var(--pixel-blue)]">Code</span>
                <span className="text-[var(--pixel-purple)]">Quest</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-[var(--pixel-white)] hover:text-[var(--pixel-blue)] transition-colors tracking-wide text-sm"
            >
              Home
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="text-[var(--pixel-white)] hover:text-[var(--pixel-green)] transition-colors tracking-wide text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  href="/game"
                  className="text-[var(--pixel-white)] hover:text-[var(--pixel-yellow)] transition-colors tracking-wide text-sm"
                >
                  Play Game
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="pixel-button bg-[var(--pixel-red)]"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[var(--pixel-white)] hover:text-[var(--pixel-blue)] px-4 py-2"
                >
                  Login
                </Link>
                <Link href="/register" className="pixel-button">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[var(--pixel-white)] hover:text-[var(--pixel-blue)] px-2 py-2 text-2xl border-2 border-[var(--pixel-gray)]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? "×" : "≡"}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t-2 border-[var(--pixel-gray)]">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-[var(--pixel-white)] hover:text-[var(--pixel-blue)] py-2 px-4 border-l-2 border-[var(--pixel-blue)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-[var(--pixel-white)] hover:text-[var(--pixel-green)] py-2 px-4 border-l-2 border-[var(--pixel-green)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/game"
                    className="text-[var(--pixel-white)] hover:text-[var(--pixel-yellow)] py-2 px-4 border-l-2 border-[var(--pixel-yellow)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Play Game
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-[var(--pixel-red)] py-2 px-4 text-left border-l-2 border-[var(--pixel-red)]"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[var(--pixel-white)] hover:text-[var(--pixel-blue)] py-2 px-4 border-l-2 border-[var(--pixel-blue)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-[var(--pixel-white)] hover:text-[var(--pixel-green)] py-2 px-4 border-l-2 border-[var(--pixel-green)]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
