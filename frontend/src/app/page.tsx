"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import MainLayout from "@/components/layout/MainLayout";
import { motion } from "framer-motion";

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <MainLayout>
      {/* Hero Section with cyberpunk pixel theme */}
      <section className="py-12 md:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 to-purple-950/70 z-0"></div>
        <div className="absolute inset-0 bg-[url('/pixel-grid.png')] bg-repeat opacity-10 z-0"></div>

        {/* Animated particles */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-none animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 7}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-1"
            >
              <h1 className="text-3xl md:text-4xl mb-6 font-pixel text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 leading-relaxed pb-2">
                Gamified Coding Adventure
              </h1>
              <div className="bg-indigo-950/60 backdrop-blur-sm border-2 border-purple-700/50 p-5 mb-8 relative">
                {/* Pixel corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>

                <p className="text-lg text-gray-300 leading-relaxed">
                  Join <span className="text-purple-400">CodeQuest Pixels</span>{" "}
                  and improve your programming skills while playing an exciting{" "}
                  <span className="text-cyan-400">
                    retro-style adventure game
                  </span>
                  .
                </p>
              </div>

              <div className="flex space-x-4 mt-8">
                {isAuthenticated ? (
                  <Link
                    href="/game"
                    className="relative inline-block px-6 py-3 overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-indigo-800 transition-all duration-200 ease-out opacity-70 group-hover:opacity-100"></span>
                    <span className="relative font-pixel text-sm tracking-widest text-white uppercase">
                      Start Playing
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-1 bg-cyan-400 transition-all duration-200 ease-out group-hover:w-full"></span>
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="relative inline-block px-6 py-3 overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-purple-700 transition-all duration-200 ease-out opacity-70 group-hover:opacity-100"></span>
                    <span className="relative font-pixel text-sm tracking-widest text-white uppercase">
                      Get Started
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-1 bg-cyan-400 transition-all duration-200 ease-out group-hover:w-full"></span>
                  </Link>
                )}
                <Link
                  href="/about"
                  className="relative inline-block px-6 py-3 overflow-hidden border-2 border-indigo-700 group"
                >
                  <span className="relative font-pixel text-sm tracking-widest text-gray-300 uppercase group-hover:text-cyan-400 transition-colors">
                    Learn More
                  </span>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 md:order-2 flex justify-center"
            >
              <div className="w-full max-w-md h-64 md:h-80 relative bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 border-indigo-700/50">
                {/* Pixel corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400"></div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {/* Replace with your actual game image later */}
                    <div className="text-6xl mb-4 text-purple-400 animate-pulse">
                      🎮
                    </div>
                    <p className="text-cyan-300 font-pixel">Game preview</p>
                  </div>
                </div>

                {/* Scanlines effect */}
                <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-10"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-indigo-950/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pixel-grid.png')] bg-repeat opacity-5 z-0"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="inline-block text-2xl font-pixel mb-4 relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                Why CodeQuest Pixels?
              </span>
              <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-cyan-400 mt-1"></div>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Engaging features that make coding fun and exciting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 border-indigo-700/50 p-6 relative"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400"></div>

              <div className="text-5xl mb-4 text-cyan-400">🎮</div>
              <h3 className="font-pixel text-sm mb-3 text-purple-400">
                Learn by Playing
              </h3>
              <p className="text-gray-300">
                Tackle coding challenges embedded in an exciting adventure game
                with pixel-perfect design.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 border-indigo-700/50 p-6 relative"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>

              <div className="text-5xl mb-4 text-purple-400">📈</div>
              <h3 className="font-pixel text-sm mb-3 text-cyan-400">
                Track Progress
              </h3>
              <p className="text-gray-300">
                Watch your skills improve with detailed statistics and unlock
                achievements as you advance.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 border-indigo-700/50 p-6 relative"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400"></div>

              <div className="text-5xl mb-4 text-cyan-400">🌐</div>
              <h3 className="font-pixel text-sm mb-3 text-purple-400">
                Join Community
              </h3>
              <p className="text-gray-300">
                Connect with other learners and share your coding journey in our
                vibrant community.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game World Preview */}
      <section className="py-16 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/70 to-indigo-950/70 z-0"></div>
        <div className="absolute inset-0 bg-[url('/pixel-grid.png')] bg-repeat opacity-5 z-0"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="inline-block text-2xl font-pixel mb-4 relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Game World Preview
              </span>
              <div className="h-1 w-full bg-gradient-to-r from-cyan-400 to-purple-400 mt-1"></div>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-40 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-2 border-indigo-700/50 relative"
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-cyan-400 font-pixel text-sm">
                    World {index}
                  </p>
                </div>

                {/* Scanlines effect */}
                <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-10"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-indigo-950/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pixel-grid.png')] bg-repeat opacity-5 z-0"></div>

        {/* Animated glowing particles for futuristic effect */}
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-none animate-glow"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                backgroundColor: i % 2 === 0 ? "#a78bfa" : "#22d3ee",
                animationDuration: `${3 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="container mx-auto text-center relative z-10">
          <h2 className="font-pixel text-2xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Ready to Begin Your Coding Adventure?
          </h2>

          <Link
            href={isAuthenticated ? "/game" : "/register"}
            className="relative inline-block px-8 py-4 overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-200 ease-out opacity-80 group-hover:opacity-100"></span>
            <span className="relative font-pixel text-base tracking-widest text-white uppercase">
              {isAuthenticated ? "Enter Game World" : "Join The Quest"}
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-1 bg-cyan-400 transition-all duration-300 ease-out group-hover:w-full"></span>
          </Link>

          <div className="mt-8 max-w-md mx-auto">
            <p className="text-gray-400 text-sm">
              <span className="text-purple-400">*</span> No prior coding
              experience required. Begin your journey into the world of
              programming with our interactive pixel adventures.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
