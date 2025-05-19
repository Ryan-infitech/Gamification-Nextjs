import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Placeholder for authenticated state - will be replaced with actual auth logic
  const isAuthenticated = false;

  return (
    <header className="sticky top-0 z-50 bg-[var(--darker-bg)] backdrop-blur-md border-b border-[var(--neon-blue)] h-[var(--header-height)]">
      <div className="container-cyber h-full mx-auto px-4 flex items-center justify-between">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-10 h-10 overflow-hidden">
            <div className="glitch-wrapper">
              <div className="glitch">
                <Image
                  src="/pixel-logo.png"
                  alt="CodeQuest Pixels Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight font-[family-name:var(--font-geist-mono)] neon-text">
            CodeQuest<span className="text-[var(--neon-pink)]">Pixels</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/game" className="nav-link">
            Play
          </Link>
          <Link href="/learn" className="nav-link">
            Learn
          </Link>
          <Link href="/leaderboard" className="nav-link">
            Leaderboard
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
        </nav>

        {/* Auth Buttons or User Menu */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="pixel-border px-2 py-1 text-xs font-[family-name:var(--font-geist-mono)] bg-[var(--light-surface)]">
                <span className="text-[var(--neon-green)]">LVL 5</span> |{" "}
                <span className="text-[var(--neon-yellow)]">230 XP</span>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[var(--neon-blue)] overflow-hidden">
                <Image
                  src="/avatar-placeholder.png"
                  alt="User Avatar"
                  width={32}
                  height={32}
                />
              </div>
              <button className="cyber-button text-xs py-1 px-3">
                Profile
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="cyber-button text-sm py-1.5">
                Login
              </Link>
              <Link
                href="/register"
                className="cyber-button-alt text-sm py-1.5"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <span className="text-2xl">×</span>
          ) : (
            <div className="space-y-1.5">
              <span className="block w-6 h-0.5 bg-[var(--neon-blue)]"></span>
              <span className="block w-6 h-0.5 bg-[var(--neon-pink)]"></span>
              <span className="block w-6 h-0.5 bg-[var(--neon-blue)]"></span>
            </div>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-[var(--header-height)] left-0 right-0 bg-[var(--darker-bg)] border-b border-[var(--neon-blue)] p-4">
          <nav className="flex flex-col gap-4">
            <Link
              href="/game"
              className="py-2 px-4 border-l-2 border-[var(--neon-blue)] hover:bg-[var(--dark-surface)]"
              onClick={() => setIsMenuOpen(false)}
            >
              Play
            </Link>
            <Link
              href="/learn"
              className="py-2 px-4 border-l-2 border-[var(--neon-blue)] hover:bg-[var(--dark-surface)]"
              onClick={() => setIsMenuOpen(false)}
            >
              Learn
            </Link>
            <Link
              href="/leaderboard"
              className="py-2 px-4 border-l-2 border-[var(--neon-blue)] hover:bg-[var(--dark-surface)]"
              onClick={() => setIsMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/about"
              className="py-2 px-4 border-l-2 border-[var(--neon-blue)] hover:bg-[var(--dark-surface)]"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>

            <div className="border-t border-[var(--light-surface)] my-2"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--neon-blue)] overflow-hidden">
                  <Image
                    src="/avatar-placeholder.png"
                    alt="User Avatar"
                    width={32}
                    height={32}
                  />
                </div>
                <Link
                  href="/profile"
                  className="cyber-button text-xs py-1 px-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="cyber-button text-center text-sm py-1.5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="cyber-button-alt text-center text-sm py-1.5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Decorative Header Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent"></div>
    </header>
  );
};

export default Header;
