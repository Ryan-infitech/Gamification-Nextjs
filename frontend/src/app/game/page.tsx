"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Dynamically import the GameCanvas component
// This ensures Phaser is only loaded client-side
const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
  loading: () => <LoadingSpinner size="large" />,
});

/**
 * Game page component
 * Renders the game and handles game-related state
 */
export default function GamePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [gameReady, setGameReady] = useState(false);
  const [gameData, setGameData] = useState(null);

  // Check authentication status
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please log in to play the game");
      router.push("/login?redirect=/game");
    }
  }, [isAuthenticated, router]);

  // Initialize game data based on user
  useEffect(() => {
    if (user) {
      setGameData({
        user: {
          id: user.id,
          username: user.username,
          level: user.playerStats?.current_level || 1,
          xp: user.playerStats?.xp_points || 0,
          coins: user.playerStats?.coins || 0,
          skills: {
            coding: user.playerStats?.coding_skill || 1,
            problemSolving: user.playerStats?.problem_solving || 1,
            powerLevel: user.playerStats?.power_level || 1,
          },
        },
        settings: {
          soundEnabled: true,
          musicEnabled: true,
          difficulty: "normal",
        },
        savedGame: null, // Could load from localStorage or backend
      });
    }
  }, [user]);

  // Handle game ready event
  const handleGameReady = (game) => {
    setGameReady(true);
    console.log("Game is ready!", game);
  };

  // Handle game destroy event
  const handleGameDestroy = () => {
    setGameReady(false);
    console.log("Game destroyed");
  };

  // Render loading state
  if (!gameData) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <main className="flex flex-col w-full">
      {/* Game header */}
      <div className="bg-gray-800 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">CodeQuest Pixels</h1>

          {gameReady && (
            <div className="flex items-center space-x-4">
              <div className="bg-gray-700 px-3 py-1 rounded-full flex items-center">
                <span className="text-yellow-400 font-semibold">
                  {gameData.user.coins}
                </span>
                <span className="ml-1">Coins</span>
              </div>

              <div className="bg-gray-700 px-3 py-1 rounded-full flex items-center">
                <span className="text-blue-400 font-semibold">
                  Level {gameData.user.level}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game canvas */}
      <div className="w-full flex-grow flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-4xl h-[600px] shadow-lg rounded-lg overflow-hidden">
          <GameCanvas
            gameData={gameData}
            onGameReady={handleGameReady}
            onGameDestroy={handleGameDestroy}
            className="rounded-lg"
          />
        </div>

        {/* Game controls info */}
        <div className="mt-4 bg-gray-800 p-4 rounded-lg text-white max-w-4xl">
          <h2 className="font-bold mb-2">Controls</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="font-semibold">Move:</span> Arrow keys or WASD
              </p>
              <p>
                <span className="font-semibold">Interact:</span> E or Space
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Menu:</span> Escape
              </p>
              <p>
                <span className="font-semibold">Special Action:</span> Shift
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
