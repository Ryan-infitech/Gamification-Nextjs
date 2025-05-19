import React from "react";

const GameLoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-[var(--dark-bg)]">
      <div className="text-center">
        <div className="loading-pixels scale-150 mb-8">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <h2 className="text-2xl font-bold text-[var(--neon-blue)] mb-4 font-mono">
          INITIALIZING CYBERPUNK WORLD
        </h2>
        <p className="text-gray-400">Hacking into the mainframe...</p>
      </div>
    </div>
  );
};

export default GameLoadingScreen;
