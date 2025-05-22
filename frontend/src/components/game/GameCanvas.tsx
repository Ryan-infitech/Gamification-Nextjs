'use client';

import React, { useEffect, useRef, useState } from 'react';
import { initGame } from '@/game/config';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface GameCanvasProps {
  width?: number;
  height?: number;
  debug?: boolean;
}

/**
 * Komponen React untuk menampilkan game canvas Phaser
 */
const GameCanvas: React.FC<GameCanvasProps> = ({
  width = 960,
  height = 540,
  debug = false,
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Inisialisasi game saat komponen dimount
  useEffect(() => {
    // Safety check untuk browser environment (SSR compatibility)
    if (typeof window === 'undefined') return;

    // Pastikan user sudah terautentikasi
    if (!isAuthenticated || !user) {
      setError('Anda harus login untuk memainkan game.');
      setIsLoading(false);
      return;
    }

    // Function untuk initialize game
    const initializeGame = async () => {
      try {
        // Cleanup jika ada instance game sebelumnya
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        }

        setIsLoading(true);
        setError(null);

        // Tunggu sebentar untuk memastikan DOM sudah siap
        await new Promise(resolve => setTimeout(resolve, 100));

        // Generate random ID untuk game container
        const gameContainerId = `game-container-${Math.random().toString(36).substring(2, 9)}`;

        // Set ID pada ref element
        if (gameContainerRef.current) {
          gameContainerRef.current.id = gameContainerId;

          // Inisialisasi game
          const gameInstance = initGame(gameContainerId, width, height, debug);
          
          if (!gameInstance) {
            throw new Error('Tidak dapat menginisialisasi game engine.');
          }

          // Simpan instance game di ref
          gameInstanceRef.current = gameInstance;

          // Setup event listener untuk game events
          setupGameEventListeners(gameInstance);

          // Kirim data player ke game
          injectPlayerData(gameInstance, user);

          setIsLoading(false);
        } else {
          throw new Error('Game container tidak ditemukan.');
        }
      } catch (err) {
        console.error('Error initializing game:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menginisialisasi game.');
        setIsLoading(false);
      }
    };

    // Setup event listener untuk game
    const setupGameEventListeners = (game: Phaser.Game) => {
      // Event listeners akan diimplementasikan sesuai kebutuhan
      console.log('Game event listeners configured');
    };

    // Inject player data ke game
    const injectPlayerData = (game: Phaser.Game, userData: any) => {
      if (game.registry) {
        // Simpan data player di registry Phaser
        game.registry.set('playerData', {
          id: userData.id,
          username: userData.username,
          level: userData.level || 1,
          experience: userData.experience || 0,
          avatar: userData.avatar_url,
          stats: {
            health: 100,
            strength: 10,
            intelligence: 10,
            agility: 10,
          }
        });
      }
    };

    // Handle window resize
    const handleResize = () => {
      if (gameInstanceRef.current) {
        const canvas = gameInstanceRef.current.canvas;
        if (canvas) {
          // Adjust canvas size based on container
          const container = gameContainerRef.current;
          if (container) {
            gameInstanceRef.current.scale.resize(container.clientWidth, container.clientHeight);
          }
        }
      }
    };

    // Initialize the game
    initializeGame();

    // Set up resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Destroy game instance when component unmounts
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [isAuthenticated, user, width, height, debug]);

  // Toggle mute state
  const toggleMute = () => {
    if (gameInstanceRef.current) {
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      
      // Mute/unmute game audio
      gameInstanceRef.current.sound.mute = newMuteState;
    }
  };

  // Restart game
  const handleRestartGame = () => {
    if (gameContainerRef.current) {
      // Re-initialize game
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }

      const gameContainerId = gameContainerRef.current.id;
      const gameInstance = initGame(gameContainerId, width, height, debug);
      gameInstanceRef.current = gameInstance;

      // Reset error state
      setError(null);
    }
  };

  return (
    <div className="relative w-full">
      {/* Game container dengan border dan padding pixel art style */}
      <div className="relative border-2 border-border bg-background rounded-md overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Skeleton className="h-32 w-32 rounded-md mx-auto mb-4 bg-primary/20" />
              <div className="font-pixel-body text-muted-foreground">Loading Game...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
            <div className="w-full max-w-md p-6">
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-pixel-heading">Game Error</AlertTitle>
                <AlertDescription className="font-pixel-body">
                  {error}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleRestartGame} 
                className="w-full font-pixel-body"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart Game
              </Button>
            </div>
          </div>
        )}

        {/* Game canvas container */}
        <div
          ref={gameContainerRef}
          className="w-full h-[540px]"
          style={{ aspectRatio: '16/9' }}
        />

        {/* Game controls overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full h-10 w-10 bg-background/70 backdrop-blur-sm"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Game controls hint */}
      <div className="mt-4 p-4 border border-border rounded-md bg-card/50">
        <h3 className="font-pixel-heading text-sm mb-2">Game Controls</h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-pixel-body">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">W/↑</kbd>
            <span>Move Up</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">S/↓</kbd>
            <span>Move Down</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">A/←</kbd>
            <span>Move Left</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">D/→</kbd>
            <span>Move Right</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">E</kbd>
            <span>Interact</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>
            <span>Menu</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
