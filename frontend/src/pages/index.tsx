import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // If user is logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>CodeQuest Pixels | Gamified Coding Adventure</title>
        <meta
          name="description"
          content="Embark on a coding adventure with CodeQuest Pixels. Learn programming concepts through fun, interactive challenges."
        />
      </Head>

      <MainLayout>
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-indigo-900 to-purple-900">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/images/hero-pattern.png"
              alt="Background pattern"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Learn to <span className="text-green-400">Code</span> through{" "}
                  <span className="text-yellow-400">Adventure</span>
                </h1>
                <p className="text-xl text-gray-200 mb-8">
                  Embark on an epic journey through Algorithm Forest, Data
                  Structure Mountains, and other exciting realms while mastering
                  programming concepts.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link
                    href="/register"
                    className="btn-primary text-center py-3 px-6 rounded-lg font-medium"
                  >
                    Start Your Journey
                  </Link>
                  <Link
                    href="/about"
                    className="btn-secondary text-center py-3 px-6 rounded-lg font-medium"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="relative h-80 w-full">
                  <Image
                    src="/images/game-preview.png"
                    alt="CodeQuest Pixels Game Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              Why CodeQuest Pixels?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Learn by Doing
                </h3>
                <p className="text-gray-400">
                  Master programming concepts through interactive challenges and
                  practical problem-solving in an immersive game world.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Instant Feedback
                </h3>
                <p className="text-gray-400">
                  Get immediate feedback on your code solutions with our
                  real-time evaluation system and progress tracking.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Community Learning
                </h3>
                <p className="text-gray-400">
                  Join a community of learners, collaborate on challenges, and
                  compete on leaderboards for extra motivation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-indigo-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Ready to Begin Your Coding Adventure?
            </h2>
            <Link
              href="/register"
              className="inline-block btn-primary py-3 px-8 rounded-lg text-lg font-medium"
            >
              Start Now
            </Link>
          </div>
        </section>
      </MainLayout>
    </>
  );
}
