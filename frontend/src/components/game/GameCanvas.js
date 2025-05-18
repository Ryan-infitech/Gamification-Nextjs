import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "@/game/config";

/**
 * GameCanvas component for initializing and managing the Phaser game instance
 *
 * @param {Object} props - Component props
 * @param {Object} props.config - Custom Phaser configuration to override defaults
 * @param {Function} props.onGameReady - Callback when game has initialized
 * @param {Function} props.onGameDestroy - Callback when game is destroyed
 * @param {Object} props.gameData - Game data to pass to the scenes
 * @param {string} props.className - Additional CSS classes for the container
 */
const GameCanvas = ({
  config = {},
  onGameReady,
  onGameDestroy,
  gameData = {},
  className = "",
}) => {
  // Ref to the container div
  const gameContainerRef = useRef(null);

  // Ref to store the game instance
  const gameInstanceRef = useRef(null);

  // Create and initialize the game on mount
  useEffect(() => {
    // Make sure the required scenes are imported
    if (!window.Phaser) {
      console.error("Phaser is not loaded");
      return;
    }

    // Don't create a new game instance if one already exists
    if (gameInstanceRef.current) {
      return;
    }

    // Create a new game instance
    const gameConfig = createGameConfig({
      ...config,
      // Make sure to use the container ref as the parent
      scale: {
        ...config.scale,
        parent: gameContainerRef.current,
      },
    });

    // Create the game instance
    const game = new Phaser.Game(gameConfig);

    // Store game data in a global registry that scenes can access
    game.registry.set("gameData", gameData);

    // Store the game instance in the ref
    gameInstanceRef.current = game;

    // Call the onGameReady callback if provided
    if (onGameReady && typeof onGameReady === "function") {
      onGameReady(game);
    }

    // Clean up the game instance when the component unmounts
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;

        // Call the onGameDestroy callback if provided
        if (onGameDestroy && typeof onGameDestroy === "function") {
          onGameDestroy();
        }
      }
    };
  }, [config, onGameReady, onGameDestroy, gameData]);

  // Update game data when it changes
  useEffect(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.registry.set("gameData", gameData);
    }
  }, [gameData]);

  return (
    <div
      id="game-container"
      ref={gameContainerRef}
      className={`game-canvas-container w-full h-full ${className}`}
      aria-label="Game canvas"
      role="application"
    />
  );
};

export default GameCanvas;
