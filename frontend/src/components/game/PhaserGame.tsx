import { useEffect, useRef } from "react";
import Phaser from "phaser";

// Game scenes (will be created in separate files)
import BootScene from "@/game/scenes/BootScene";
import MainMenuScene from "@/game/scenes/MainMenuScene";
import GameScene from "@/game/scenes/GameScene";

type PhaserGameProps = {
  userId: string;
  username: string;
};

export default function PhaserGame({ userId, username }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current || !parentRef.current) return;

    // Game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: parseInt(process.env.NEXT_PUBLIC_GAME_WIDTH || "800"),
      height: parseInt(process.env.NEXT_PUBLIC_GAME_HEIGHT || "600"),
      parent: parentRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: process.env.NEXT_PUBLIC_ENV === "development",
        },
      },
      scene: [BootScene, MainMenuScene, GameScene],
      pixelArt: true,
      backgroundColor: "#000000",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    // Create the game instance
    gameRef.current = new Phaser.Game(config);

    // Pass user data to the game
    gameRef.current.registry.set("userId", userId);
    gameRef.current.registry.set("username", username);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [userId, username]);

  return (
    <div className="w-full h-full relative">
      <div ref={parentRef} className="w-full h-full" />
    </div>
  );
}
