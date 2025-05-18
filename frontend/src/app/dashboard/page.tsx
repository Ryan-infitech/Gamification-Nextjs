"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import MainLayout from "@/components/layout/MainLayout";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Welcome, {user?.displayName || user?.username}!
        </h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Progress</h2>
          {/* Progress content here */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Completed Challenges</h3>
              <p className="text-3xl font-bold text-indigo-400">
                {user?.playerStats?.completed_challenges || 0}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">XP Points</h3>
              <p className="text-3xl font-bold text-green-400">
                {user?.playerStats?.xp_points || 0}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Current Level</h3>
              <p className="text-3xl font-bold text-yellow-400">
                {user?.playerStats?.current_level || 1}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Continue Your Journey</h2>
          {/* Challenge cards would go here */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="h-40 bg-indigo-900 flex items-center justify-center">
                  <span className="text-xl font-bold">Challenge {i}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-2">
                    Algorithm Challenge {i}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Master the basics of sorting algorithms in this interactive
                    challenge.
                  </p>
                  <button className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    Start Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
