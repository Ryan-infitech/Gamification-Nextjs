'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsPanel from './StatsPanel';
import InventoryPanel from './InventoryPanel';
import { useGameState } from '@/hooks/useGameState';
import { usePlayerStats } from '@/hooks/useGameState';
import useGameNotifications from '@/hooks/useGameNotifications';
import { UIState } from '@/types/ui';
import { cn } from '@/lib/utils';

interface GameUIProps {
  /**
   * Menampilkan debug information
   */
  debug?: boolean;
  /**
   * Flag untuk melihat apakah game sedang dalam kondisi pause
   */
  isPaused?: boolean;
  /**
   * Event handler ketika user melakukan interaksi dengan UI
   */
  onUIInteraction?: (actionType: string, data?: any) => void;
  /**
   * Tema UI ('light' atau 'dark')
   */
  theme?: 'light' | 'dark';
  /**
   * Class tambahan untuk styling
   */
  className?: string;
}

/**
 * Komponen utama UI game yang menampilkan semua UI elements
 * seperti stats, inventory, quest log, dll
 */
const GameUI: React.FC<GameUIProps> = ({
  debug = false,
  isPaused = false,
  onUIInteraction,
  theme = 'dark',
  className,
}) => {
  // State untuk UI
  const [uiState, setUIState] = useState<UIState>({
    inventoryVisible: false,
    statsExpanded: false,
    activeTab: 'none',
    minimapExpanded: false,
    fadeIn: true,
  });
  
  // Ref untuk tracking click outside
  const uiRef = useRef<HTMLDivElement>(null);
  
  // Game state dari context
  const { state } = useGameState();
  const { stats, level, progress } = usePlayerStats();
  const { notifications, unreadCount } = useGameNotifications();
  
  // Panel toggle handlers
  const toggleInventory = () => {
    setUIState(prev => ({
      ...prev,
      inventoryVisible: !prev.inventoryVisible,
      activeTab: prev.inventoryVisible ? 'none' : 'inventory'
    }));
    
    if (onUIInteraction) {
      onUIInteraction('toggleInventory');
    }
  };
  
  const toggleStats = () => {
    setUIState(prev => ({
      ...prev,
      statsExpanded: !prev.statsExpanded
    }));
    
    if (onUIInteraction) {
      onUIInteraction('toggleStats');
    }
  };
  
  const toggleMinimap = () => {
    setUIState(prev => ({
      ...prev,
      minimapExpanded: !prev.minimapExpanded
    }));
    
    if (onUIInteraction) {
      onUIInteraction('toggleMinimap');
    }
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if game is paused
      if (isPaused) return;
      
      switch (e.key.toLowerCase()) {
        case 'i': // Inventory
          toggleInventory();
          break;
        case 'c': // Character/Stats
          toggleStats();
          break;
        case 'm': // Map
          toggleMinimap();
          break;
        case 'escape': // Close all panels
          setUIState(prev => ({
            ...prev,
            inventoryVisible: false,
            statsExpanded: false,
            activeTab: 'none'
          }));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPaused]);
  
  // Handle click outside panels to close them
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (uiRef.current && !uiRef.current.contains(e.target as Node)) {
        // Close panels if clicking outside UI element
        setUIState(prev => ({
          ...prev,
          inventoryVisible: false,
          statsExpanded: false,
          activeTab: 'none'
        }));
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fade in effect on mount
  useEffect(() => {
    setUIState(prev => ({ ...prev, fadeIn: true }));
    const timer = setTimeout(() => {
      setUIState(prev => ({ ...prev, fadeIn: false }));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      ref={uiRef}
      className={cn(
        'game-ui-container absolute top-0 left-0 w-full h-full pointer-events-none z-20',
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
        className
      )}
    >
      {/* Main HUD - always visible */}
      <div className="hud-container absolute top-0 left-0 w-full p-2 pointer-events-auto">
        <div className="flex justify-between items-start">
          {/* Left side - Stats */}
          <StatsPanel 
            stats={stats}
            level={level}
            experience={progress}
            expanded={uiState.statsExpanded}
            onToggle={toggleStats}
            theme={theme}
          />
          
          {/* Center - Notifications/Area Name */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="area-name-container text-center"
          >
            <div className="area-name px-4 py-2 rounded-lg bg-gray-900/60 inline-block">
              <h2 className="font-pixel text-sm text-white">
                {state.currentArea?.name || 'World Map'}
              </h2>
            </div>
            
            {/* Area-based notifications */}
            <AnimatePresence>
              {uiState.fadeIn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="area-notification mt-2 px-4 py-2 rounded-lg bg-primary/80"
                >
                  <p className="font-pixel-body text-sm text-white">
                    Welcome to {state.currentArea?.name || 'World Map'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Right side - Game controls */}
          <div className="game-controls flex gap-2">
            <button 
              onClick={toggleInventory}
              className="game-btn inventory-btn flex items-center justify-center w-10 h-10 bg-dark-700/70 hover:bg-primary/80 rounded-lg border-2 border-pixel transition-colors pointer-events-auto"
              title="Inventory (I)"
            >
              <img src="/assets/ui/icons/backpack.png" alt="Inventory" className="w-6 h-6" />
            </button>
            
            <button 
              onClick={toggleMinimap}
              className="game-btn map-btn flex items-center justify-center w-10 h-10 bg-dark-700/70 hover:bg-primary/80 rounded-lg border-2 border-pixel transition-colors pointer-events-auto"
              title="Map (M)"
            >
              <img src="/assets/ui/icons/map.png" alt="Map" className="w-6 h-6" />
            </button>
            
            {/* Notification indicator */}
            {unreadCount > 0 && (
              <div className="notification-indicator relative">
                <button className="game-btn notification-btn flex items-center justify-center w-10 h-10 bg-dark-700/70 hover:bg-warning/80 rounded-lg border-2 border-pixel transition-colors pointer-events-auto">
                  <img src="/assets/ui/icons/notification.png" alt="Notifications" className="w-6 h-6" />
                </button>
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-danger text-xs font-pixel text-white">
                  {unreadCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Inventory Panel - conditionally visible */}
      <AnimatePresence>
        {uiState.inventoryVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="inventory-container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
          >
            <InventoryPanel 
              items={state.inventory} 
              onClose={toggleInventory}
              onItemUse={(itemId) => onUIInteraction?.('useItem', { itemId })}
              onItemDrop={(itemId) => onUIInteraction?.('dropItem', { itemId })}
              theme={theme}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Minimap - conditionally expanded */}
      <div className={`minimap-container absolute top-4 right-4 transition-all duration-300 pointer-events-auto ${
        uiState.minimapExpanded ? 'w-64 h-64' : 'w-32 h-32'
      }`}>
        <div className="minimap relative w-full h-full bg-dark-700/60 rounded-lg border-2 border-pixel overflow-hidden">
          {/* Minimap content would be rendered here, possibly a canvas or image */}
          <div className="minimap-overlay absolute inset-0 flex items-center justify-center">
            <span className="font-pixel-body text-xs text-center text-white/70">
              {uiState.minimapExpanded ? 'Click to minimize' : 'Click to expand'}
            </span>
          </div>
          
          {/* Transparent overlay for clicks */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={toggleMinimap}
          />
        </div>
      </div>
      
      {/* Debug Panel */}
      {debug && (
        <div className="debug-panel absolute bottom-2 left-2 p-2 bg-dark-700/80 text-white text-xs font-mono rounded border border-gray-500 pointer-events-auto">
          <div>Player Pos: {state.playerData?.position.x.toFixed(0)}, {state.playerData?.position.y.toFixed(0)}</div>
          <div>Current Map: {state.currentMap}</div>
          <div>Area: {state.currentArea?.name || 'None'}</div>
          <div>UI State: {JSON.stringify(uiState)}</div>
        </div>
      )}
      
      {/* Pause Overlay */}
      {isPaused && (
        <div className="pause-overlay absolute inset-0 bg-dark-900/80 flex items-center justify-center pointer-events-auto">
          <div className="pause-container text-center">
            <h2 className="font-pixel text-4xl text-white mb-8">PAUSED</h2>
            <div className="flex flex-col gap-4 items-center">
              <button className="game-btn pause-btn px-8 py-3 bg-primary hover:bg-primary/80 rounded-lg border-2 border-pixel transition-colors">
                <span className="font-pixel text-white">Resume</span>
              </button>
              <button className="game-btn pause-btn px-8 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg border-2 border-pixel transition-colors">
                <span className="font-pixel text-white">Options</span>
              </button>
              <button className="game-btn pause-btn px-8 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg border-2 border-pixel transition-colors">
                <span className="font-pixel text-white">Exit Game</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;
