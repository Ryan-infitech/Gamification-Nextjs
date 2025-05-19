"use client";

import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import gameConfig from "@/game/config";
import { useAuth } from "@/hooks/useAuth";

interface GameCanvasProps {
  onGameReady?: () => void;
  className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameReady, className }) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Don't initialize the game until the user is authenticated
    if (!isAuthenticated) {
      return;
    }

    // Initialize the game only if it hasn't been initialized yet
    if (!gameInstanceRef.current && gameContainerRef.current) {
      const gameConfig = {
        ...gameConfig,
        // We can pass user data to the game here
        callbacks: {
          preBoot: (game: Phaser.Game) => {
            // Add game-wide data
            game.registry.set("userData", {
              id: user?.id,
              username: user?.user_metadata?.username || "Player",
              displayName:
                user?.user_metadata?.display_name ||
                user?.user_metadata?.username ||
                "Player",
              avatarUrl: user?.user_metadata?.avatar_url,
            });
          },
        },
      };

      // Create the game
      gameInstanceRef.current = new Phaser.Game({
        ...gameConfig,
        parent: gameContainerRef.current,
      });

      // Set loading state to false when game is ready
      gameInstanceRef.current.events.once("ready", () => {
        setIsLoading(false);
        if (onGameReady) {
          onGameReady();
        }
      });

      // Set up cleanup function
      return () => {
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        }
      };
    }
  }, [isAuthenticated, onGameReady, user]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--dark-bg)] bg-opacity-80 z-10">
          <div className="loading-pixels">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="ml-3 text-[var(--neon-blue)] font-mono">
            Loading Cyberpunk World...
          </p>
        </div>
      )}
      <div
        id="game-container"
        ref={gameContainerRef}
        className={`w-full h-full ${className || ""}`}
        style={{
          imageRendering: "pixelated", // Keep pixel art crisp
        }}
      />
    </div>
  );
};

export default GameCanvas;
