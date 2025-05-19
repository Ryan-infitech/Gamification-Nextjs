import React, { useEffect } from "react";

interface GameControlsProps {
  onEmitMovement?: (
    direction: "up" | "down" | "left" | "right",
    pressed: boolean
  ) => void;
}

const GameControls: React.FC<GameControlsProps> = ({ onEmitMovement }) => {
  // Hook for keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!onEmitMovement) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
          onEmitMovement("up", true);
          break;
        case "ArrowDown":
        case "s":
          onEmitMovement("down", true);
          break;
        case "ArrowLeft":
        case "a":
          onEmitMovement("left", true);
          break;
        case "ArrowRight":
        case "d":
          onEmitMovement("right", true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!onEmitMovement) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
          onEmitMovement("up", false);
          break;
        case "ArrowDown":
        case "s":
          onEmitMovement("down", false);
          break;
        case "ArrowLeft":
        case "a":
          onEmitMovement("left", false);
          break;
        case "ArrowRight":
        case "d":
          onEmitMovement("right", false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onEmitMovement]);

  // For mobile, render touch controls
  return (
    <div className="fixed bottom-4 left-4 z-50 lg:hidden">
      <div className="grid grid-cols-3 gap-2 w-36 h-36">
        <div className="col-start-2">
          <button
            className="w-12 h-12 rounded-full bg-gray-800 bg-opacity-50 border border-[var(--neon-blue)] text-[var(--neon-blue)] flex items-center justify-center"
            onTouchStart={() => onEmitMovement?.("up", true)}
            onTouchEnd={() => onEmitMovement?.("up", false)}
          >
            ↑
          </button>
        </div>
        <div className="col-start-1 row-start-2">
          <button
            className="w-12 h-12 rounded-full bg-gray-800 bg-opacity-50 border border-[var(--neon-blue)] text-[var(--neon-blue)] flex items-center justify-center"
            onTouchStart={() => onEmitMovement?.("left", true)}
            onTouchEnd={() => onEmitMovement?.("left", false)}
          >
            ←
          </button>
        </div>
        <div className="col-start-3 row-start-2">
          <button
            className="w-12 h-12 rounded-full bg-gray-800 bg-opacity-50 border border-[var(--neon-blue)] text-[var(--neon-blue)] flex items-center justify-center"
            onTouchStart={() => onEmitMovement?.("right", true)}
            onTouchEnd={() => onEmitMovement?.("right", false)}
          >
            →
          </button>
        </div>
        <div className="col-start-2 row-start-3">
          <button
            className="w-12 h-12 rounded-full bg-gray-800 bg-opacity-50 border border-[var(--neon-blue)] text-[var(--neon-blue)] flex items-center justify-center"
            onTouchStart={() => onEmitMovement?.("down", true)}
            onTouchEnd={() => onEmitMovement?.("down", false)}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
