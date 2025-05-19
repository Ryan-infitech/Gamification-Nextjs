import React from "react";

interface GameOverlayProps {
  playerName: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  credits: number;
  onInventoryToggle: () => void;
  onQuestsToggle: () => void;
  onChatToggle: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  playerName,
  level,
  experience,
  health,
  maxHealth,
  energy,
  maxEnergy,
  credits,
  onInventoryToggle,
  onQuestsToggle,
  onChatToggle,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top bar with player info */}
      <div className="absolute top-0 left-0 right-0 p-2 bg-[var(--dark-bg)] bg-opacity-60 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[var(--neon-pink)] flex items-center justify-center text-black font-bold">
            {playerName.charAt(0)}
          </div>
          <div className="ml-2">
            <div className="text-sm font-mono text-[var(--neon-blue)]">
              {playerName}
            </div>
            <div className="text-xs">Level {level}</div>
          </div>
        </div>

        <div className="flex-1 mx-4">
          <div className="flex justify-between text-xs mb-1">
            <span>HP</span>
            <span>
              {health}/{maxHealth}
            </span>
          </div>
          <div className="h-2 bg-[var(--dark-surface)] rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-xs mb-1 mt-1">
            <span>EXP</span>
            <span>{experience}/100</span>
          </div>
          <div className="h-2 bg-[var(--dark-surface)] rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)]"
              style={{ width: `${experience}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-[var(--neon-pink)] font-mono">₡ {credits}</div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-[var(--dark-bg)] bg-opacity-60">
        <div className="flex items-center justify-center space-x-4">
          <button
            className="pointer-events-auto cyber-button px-4 py-2 text-sm"
            onClick={onInventoryToggle}
          >
            INVENTORY
          </button>

          <button
            className="pointer-events-auto cyber-button px-4 py-2 text-sm"
            onClick={onQuestsToggle}
          >
            QUESTS
          </button>

          <button
            className="pointer-events-auto cyber-button px-4 py-2 text-sm"
            onClick={onChatToggle}
          >
            CHAT
          </button>
        </div>
      </div>

      {/* Right side energy meter */}
      <div className="absolute top-1/2 right-2 transform -translate-y-1/2 w-4">
        <div className="h-40 bg-[var(--dark-surface)] rounded overflow-hidden flex flex-col-reverse">
          <div
            className="bg-gradient-to-t from-yellow-400 to-yellow-200"
            style={{ height: `${(energy / maxEnergy) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-center font-mono">EN</div>
      </div>
    </div>
  );
};

export default GameOverlay;
