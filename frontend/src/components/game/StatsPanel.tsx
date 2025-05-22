'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerStats } from '@/types/phaser';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  /**
   * Data statistik player
   */
  stats?: PlayerStats;
  /**
   * Level player
   */
  level: number;
  /**
   * XP progress (0-100)
   */
  experience: number;
  /**
   * Apakah panel dalam kondisi expanded
   */
  expanded?: boolean;
  /**
   * Handler ketika toggle expansion
   */
  onToggle?: () => void;
  /**
   * Tema UI ('light' or 'dark')
   */
  theme?: 'light' | 'dark';
  /**
   * Class tambahan untuk styling
   */
  className?: string;
}

/**
 * Panel untuk menampilkan statistik player in-game
 */
const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  level,
  experience,
  expanded = false,
  onToggle,
  theme = 'dark',
  className,
}) => {
  // Default stats jika tidak ada
  const defaultStats: PlayerStats = {
    health: 100,
    strength: 10,
    intelligence: 10,
    agility: 10,
    experience: 0,
    level: 1
  };
  
  // Gunakan stats dari props atau default
  const playerStats = stats || defaultStats;
  
  // Setup stat colors
  const statColors = {
    health: '#FF6B6B', // danger color
    strength: '#FFA502', // warning color
    intelligence: '#45AAF2', // secondary color
    agility: '#2ECC71', // accent color
  };
  
  return (
    <div 
      className={cn(
        'stats-panel relative',
        expanded ? 'w-64' : 'w-48',
        theme === 'dark' ? 'text-white' : 'text-gray-900',
        className
      )}
    >
      {/* Main stats bar (always visible) */}
      <div 
        className={cn(
          'main-stats flex items-center p-2 bg-dark-800/80 rounded-lg border-2 border-pixel transition-all duration-300',
          expanded ? 'mb-2' : ''
        )}
      >
        {/* Level indicator */}
        <div className="level-badge w-10 h-10 flex-shrink-0 bg-primary rounded-full border-2 border-white/30 flex items-center justify-center mr-2">
          <span className="font-pixel text-sm text-white">{level}</span>
        </div>
        
        {/* Health & XP bars */}
        <div className="bars-container flex-grow">
          {/* Health bar */}
          <div className="health-bar-container mb-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-pixel-body">HP</span>
              <span className="text-xs font-pixel-body">{playerStats.health}</span>
            </div>
            <div className="health-bar h-3 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="health-fill h-full bg-danger rounded-full"
                style={{ width: `${(playerStats.health / 100) * 100}%` }}
              />
            </div>
          </div>
          
          {/* XP bar */}
          <div className="xp-bar-container">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-pixel-body">XP</span>
              <span className="text-xs font-pixel-body">{experience}%</span>
            </div>
            <div className="xp-bar h-2 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="xp-fill h-full bg-accent rounded-full"
                style={{ width: `${experience}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Expand button */}
        <button 
          onClick={onToggle}
          className="expand-btn ml-2 w-6 h-6 flex items-center justify-center bg-dark-700 hover:bg-primary/80 rounded transition-colors"
        >
          <svg 
            width="10" 
            height="6" 
            viewBox="0 0 10 6" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Detailed stats (expanded view) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="expanded-stats bg-dark-800/80 rounded-lg border-2 border-pixel overflow-hidden"
          >
            <div className="p-3">
              <h3 className="font-pixel text-sm mb-2">Character Stats</h3>
              
              {/* Attributes */}
              <div className="grid grid-cols-1 gap-2">
                {/* Strength */}
                <div className="stat-item">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-pixel-body">Strength</span>
                    <span className="text-xs font-pixel-body">{playerStats.strength}</span>
                  </div>
                  <div className="stat-bar h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="stat-fill h-full rounded-full"
                      style={{ 
                        width: `${(playerStats.strength / 50) * 100}%`,
                        backgroundColor: statColors.strength
                      }}
                    />
                  </div>
                </div>
                
                {/* Intelligence */}
                <div className="stat-item">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-pixel-body">Intelligence</span>
                    <span className="text-xs font-pixel-body">{playerStats.intelligence}</span>
                  </div>
                  <div className="stat-bar h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="stat-fill h-full rounded-full"
                      style={{ 
                        width: `${(playerStats.intelligence / 50) * 100}%`,
                        backgroundColor: statColors.intelligence
                      }}
                    />
                  </div>
                </div>
                
                {/* Agility */}
                <div className="stat-item">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-pixel-body">Agility</span>
                    <span className="text-xs font-pixel-body">{playerStats.agility}</span>
                  </div>
                  <div className="stat-bar h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="stat-fill h-full rounded-full"
                      style={{ 
                        width: `${(playerStats.agility / 50) * 100}%`,
                        backgroundColor: statColors.agility
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Total XP & Level requirements */}
              <div className="mt-4 p-2 bg-dark-700/50 rounded text-center">
                <p className="text-xs font-pixel-body text-white/80">
                  Total XP: {playerStats.experience || 0}
                </p>
                <p className="text-xs font-pixel-body text-primary mt-1">
                  Next Level: {Math.ceil((level * 100) - (playerStats.experience || 0))} XP needed
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatsPanel;
