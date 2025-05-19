import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center">
          {/* Animated background grid */}
          <div className="absolute inset-0 bg-[var(--darker-bg)] z-0">
            <div className="relative h-full w-full">
              {/* Grid lines */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, var(--neon-blue) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--neon-blue) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                  opacity: 0.15,
                  transform: "perspective(500px) rotateX(60deg)",
                  transformOrigin: "center bottom",
                }}
              />

              {/* Moving light */}
              <div
                className="absolute top-1/2 left-1/2 w-[40vw] h-[40vh] rounded-full bg-gradient-radial from-[var(--neon-blue)] to-transparent opacity-5 blur-3xl"
                style={{
                  animation: "move 8s infinite alternate ease-in-out",
                }}
              />

              {/* Animated lines */}
              <style jsx>{`
                @keyframes move {
                  0% {
                    transform: translate(-30%, -30%);
                  }
                  100% {
                    transform: translate(30%, 30%);
                  }
                }
              `}</style>
            </div>
          </div>

          <div className="container-cyber relative z-10 px-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Text content */}
            <div className="flex-1 text-center lg:text-left pt-12 lg:pt-0">
              <h1 className="font-bold text-5xl lg:text-6xl mb-6 tracking-tight">
                <span className="block">Master Coding Through</span>
                <span className="relative inline-block text-[var(--neon-blue)] neon-text">
                  Pixel Adventures
                </span>
              </h1>

              <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto lg:mx-0">
                Learn algorithms, data structures, and computer science concepts
                in a gamified cyberpunk pixel world. Solve puzzles, defeat
                bosses, level up your skills.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/game"
                  className="cyber-button-alt text-base py-3 px-8"
                >
                  Start Playing
                </Link>
                <Link
                  href="/learn"
                  className="cyber-button text-base py-3 px-8"
                >
                  Explore Concepts
                </Link>
              </div>

              <div className="mt-8 font-[family-name:var(--font-geist-mono)] text-sm text-gray-400 flex items-center justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-[var(--neon-green)] rounded-full"></span>
                  <span>40+ Challenges</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-[var(--neon-pink)] rounded-full"></span>
                  <span>Real-time Multiplayer</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-[var(--neon-blue)] rounded-full"></span>
                  <span>5 Themed Worlds</span>
                </div>
              </div>
            </div>

            {/* Game screenshot/preview */}
            <div className="flex-1 w-full max-w-lg">
              <div className="pixel-corners relative">
                <div className="glitch-wrapper">
                  <div className="glitch">
                    <Image
                      src="/game-preview.png"
                      alt="Game Preview"
                      width={600}
                      height={400}
                      className="rounded"
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-3 -right-3 w-12 h-12 border-t-2 border-r-2 border-[var(--neon-pink)]"></div>
                <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-2 border-l-2 border-[var(--neon-pink)]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-[var(--dark-bg)]">
          <div className="container-cyber px-4">
            <h2 className="text-center text-4xl font-bold mb-16 neon-text-purple">
              Learn Programming Through{" "}
              <span className="text-[var(--neon-pink)]">Adventure</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="feature-card bg-[var(--dark-surface)] p-6 rounded relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,240,255,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 mb-4 flex items-center justify-center bg-[var(--darker-bg)] rounded text-[var(--neon-blue)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Interactive Coding</h3>
                <p className="text-gray-400">
                  Solve programming challenges with real-time feedback in an
                  immersive environment.
                </p>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)]"></div>
              </div>

              {/* Feature 2 */}
              <div className="feature-card bg-[var(--dark-surface)] p-6 rounded relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(123,97,255,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 mb-4 flex items-center justify-center bg-[var(--darker-bg)] rounded text-[var(--neon-purple)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Game-Based Learning</h3>
                <p className="text-gray-400">
                  Master CS concepts through boss battles, puzzles, and
                  adventure-style quests.
                </p>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)]"></div>
              </div>

              {/* Feature 3 */}
              <div className="feature-card bg-[var(--dark-surface)] p-6 rounded relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,0,255,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 mb-4 flex items-center justify-center bg-[var(--darker-bg)] rounded text-[var(--neon-pink)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Community Challenges</h3>
                <p className="text-gray-400">
                  Compete with friends, join leaderboards, and collaborate on
                  multiplayer puzzles.
                </p>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-blue)]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-[var(--darker-bg)] relative">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f0ff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          <div className="container-cyber relative z-10 px-4 text-center">
            <h2 className="text-4xl font-bold mb-6 neon-text">
              Ready to Begin Your Coding Journey?
            </h2>
            <p className="text-gray-300 text-xl mb-12 max-w-3xl mx-auto">
              Join thousands of players who are learning computer science while
              having fun in our cyberpunk pixel universe.
            </p>
            <Link
              href="/register"
              className="cyber-button-alt text-base py-3 px-10"
            >
              Create Free Account
            </Link>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="stat-box">
                <div className="text-4xl font-bold text-[var(--neon-blue)]">
                  40+
                </div>
                <div className="text-gray-400">Learning Challenges</div>
              </div>
              <div className="stat-box">
                <div className="text-4xl font-bold text-[var(--neon-pink)]">
                  5K+
                </div>
                <div className="text-gray-400">Active Players</div>
              </div>
              <div className="stat-box">
                <div className="text-4xl font-bold text-[var(--neon-purple)]">
                  300+
                </div>
                <div className="text-gray-400">Coding Problems</div>
              </div>
              <div className="stat-box">
                <div className="text-4xl font-bold text-[var(--neon-green)]">
                  50K+
                </div>
                <div className="text-gray-400">Lines Coded</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
