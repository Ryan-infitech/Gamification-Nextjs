import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--pixel-dark)] border-t-4 border-[var(--pixel-gray)] text-[var(--pixel-white)]">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 bg-[var(--pixel-blue)] flex items-center justify-center">
                <span className="font-['Press_Start_2P'] text-[8px] text-white">
                  CQ
                </span>
              </div>
              <span className="font-['Press_Start_2P'] text-xs">
                <span className="text-[var(--pixel-blue)]">Code</span>
                <span className="text-[var(--pixel-purple)]">Quest</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Learn coding through interactive pixel adventures in a retro-style
              world.
            </p>
          </div>

          <div>
            <h4 className="font-['Press_Start_2P'] text-xs mb-4 text-[var(--pixel-blue)]">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li className="hover:translate-x-1 transition-transform">
                <Link
                  href="/"
                  className="hover:text-[var(--pixel-blue)] transition-colors inline-flex items-center"
                >
                  <span className="text-[var(--pixel-blue)] mr-2">▶</span> Home
                </Link>
              </li>
              <li className="hover:translate-x-1 transition-transform">
                <Link
                  href="/game"
                  className="hover:text-[var(--pixel-blue)] transition-colors inline-flex items-center"
                >
                  <span className="text-[var(--pixel-blue)] mr-2">▶</span> Play
                  Game
                </Link>
              </li>
              <li className="hover:translate-x-1 transition-transform">
                <Link
                  href="/dashboard"
                  className="hover:text-[var(--pixel-blue)] transition-colors inline-flex items-center"
                >
                  <span className="text-[var(--pixel-blue)] mr-2">▶</span>{" "}
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-['Press_Start_2P'] text-xs mb-4 text-[var(--pixel-green)]">
              Resources
            </h4>
            <ul className="space-y-3">
              <li className="hover:translate-x-1 transition-transform">
                <Link
                  href="#"
                  className="hover:text-[var(--pixel-green)] transition-colors inline-flex items-center"
                >
                  <span className="text-[var(--pixel-green)] mr-2">▶</span> Help
                  & Support
                </Link>
              </li>
              <li className="hover:translate-x-1 transition-transform">
                <Link
                  href="#"
                  className="hover:text-[var(--pixel-green)] transition-colors inline-flex items-center"
                >
                  <span className="text-[var(--pixel-green)] mr-2">▶</span>{" "}
                  Privacy Policy
                </Link>
              </li>
              <li className="hover:translate-x-1 transition-transform">
                <Link
                  href="#"
                  className="hover:text-[var(--pixel-green)] transition-colors inline-flex items-center"
                >
                  <span className="text-[var(--pixel-green)] mr-2">▶</span>{" "}
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <div className="inline-block px-4 py-2 border-2 border-[var(--pixel-gray)] bg-gray-900 mb-2">
            <span className="text-[var(--pixel-yellow)]">©</span> {currentYear}{" "}
            <span className="text-[var(--pixel-blue)]">CodeQuest</span>{" "}
            <span className="text-[var(--pixel-green)]">Pixels</span>
          </div>
          <p className="text-xs text-gray-500">
            All rights reserved. Built with pixel perfection.
          </p>
        </div>
      </div>
    </footer>
  );
}
