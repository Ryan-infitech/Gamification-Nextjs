"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import GameControls from "@/components/game/GameControls";
import GameOverlay from "@/components/game/GameOverlay";
import GameChat from "@/components/game/GameChat";
import GameInventory from "@/components/game/GameInventory";
import GameQuests from "@/components/game/GameQuests";
import GameLoadingScreen from "@/components/game/GameLoadingScreen";
import useGameSocket from "@/hooks/useGameSocket";

// Dynamically import the GameCanvas component with no SSR
const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
  loading: () => <GameLoadingScreen />,
});

export default function GamePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Initialize game socket connection
  const { connected, players, messages, sendMessage, emitMovement } =
    useGameSocket();

  // Handle game ready event
  const handleGameReady = () => {
    setGameStarted(true);
  };

  // If still loading auth state or not authenticated, show loading screen
  if (isLoading) {
    return <GameLoadingScreen />;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--dark-bg)] text-white">
      {/* Main game canvas */}
      <div className="absolute inset-0">
        <GameCanvas onGameReady={handleGameReady} className="w-full h-full" />
      </div>

      {/* Game UI overlays */}
      {gameStarted && (
        <>
          <GameOverlay
            playerName={user?.user_metadata?.username || "Player"}
            level={1}
            experience={50}
            health={100}
            maxHealth={100}
            energy={80}
            maxEnergy={100}
            credits={500}
            onInventoryToggle={() => setShowInventory(!showInventory)}
            onQuestsToggle={() => setShowQuests(!showQuests)}
            onChatToggle={() => setShowChat(!showChat)}
          />

          <GameControls onEmitMovement={emitMovement} />

          {showInventory && (
            <GameInventory onClose={() => setShowInventory(false)} />
          )}

          {showQuests && <GameQuests onClose={() => setShowQuests(false)} />}

          {showChat && (
            <GameChat
              messages={messages}
              sendMessage={sendMessage}
              onClose={() => setShowChat(false)}
              playerName={user?.user_metadata?.username || "Player"}
            />
          )}
        </>
      )}
    </div>
  );
}
