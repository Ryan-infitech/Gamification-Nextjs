'use client';

import React, { createContext, useEffect, useState, useRef, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { setupSocketClient, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { 
  PlayerData, 
  MapArea, 
  GamePosition, 
  GameChallengeDefinition, 
  NPCDefinition 
} from '@/types/phaser';

export interface Notification {
  id: string;
  type: 'achievement' | 'level' | 'quest' | 'item' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

// Game state interface
export interface GameState {
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  playerData: PlayerData | null;
  currentMap: string;
  currentArea: MapArea | null;
  activeChallenges: GameChallengeDefinition[];
  completedChallenges: string[];
  interactingWith: NPCDefinition | null;
  inventory: any[];
  quests: any[];
  notifications: Notification[];
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
    showTutorial: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
  };
  players: {
    [userId: string]: {
      id: string;
      username: string;
      position: GamePosition;
      sprite: string;
      lastUpdated: number;
    }
  };
  lastSaved: string | null;
  error: string | null;
}

// Interface for the context value
export interface GameContextType {
  state: GameState;
  initGame: () => Promise<void>;
  startGame: (continueGame?: boolean) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  exitGame: () => void;
  saveGameState: () => Promise<boolean>;
  updatePlayerPosition: (position: GamePosition) => void;
  setCurrentMap: (mapKey: string) => void;
  enterArea: (area: MapArea) => void;
  leaveArea: () => void;
  startChallenge: (challenge: GameChallengeDefinition) => void;
  completeChallenge: (challengeId: string, data?: any) => Promise<void>;
  interactWithNPC: (npc: NPCDefinition | null) => void;
  addItem: (item: any) => void;
  removeItem: (itemId: string) => void;
  updateSettings: (settings: Partial<GameState['settings']>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  resetGameState: () => void;
}

// Default game state
const defaultGameState: GameState = {
  isInitialized: false,
  isLoading: false,
  isPlaying: false,
  isPaused: false,
  playerData: null,
  currentMap: 'tutorial-area',
  currentArea: null,
  activeChallenges: [],
  completedChallenges: [],
  interactingWith: null,
  inventory: [],
  quests: [],
  notifications: [],
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    musicVolume: 0.7,
    sfxVolume: 1.0,
    showTutorial: true,
    difficulty: 'normal'
  },
  players: {},
  lastSaved: null,
  error: null
};

// Create the context with a default value
export const GameContext = createContext<GameContextType>({
  state: defaultGameState,
  initGame: async () => {},
  startGame: () => {},
  pauseGame: () => {},
  resumeGame: () => {},
  exitGame: () => {},
  saveGameState: async () => false,
  updatePlayerPosition: () => {},
  setCurrentMap: () => {},
  enterArea: () => {},
  leaveArea: () => {},
  startChallenge: () => {},
  completeChallenge: async () => {},
  interactWithNPC: () => {},
  addItem: () => {},
  removeItem: () => {},
  updateSettings: () => {},
  markNotificationAsRead: () => {},
  clearAllNotifications: () => {},
  addNotification: () => {},
  resetGameState: () => {},
});

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const [state, setState] = useState<GameState>(defaultGameState);
  const socket = useRef<any>(null);
  const gameStateRef = useRef<GameState>(defaultGameState);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Update ref whenever state changes
  useEffect(() => {
    gameStateRef.current = state;
  }, [state]);
  
  // Initialize game state from backend
  const initGame = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to play the game",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Fetch game state from backend
      const response = await axios.get('/api/game/state');
      
      // Setup socket connection after successful state fetch
      if (!socket.current) {
        socket.current = setupSocketClient();
        
        // Setup socket event listeners
        setupSocketListeners();
      }
      
      // Merge server state with local default state
      const serverState = response.data;
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        playerData: serverState.playerData || defaultGameState.playerData,
        currentMap: serverState.currentMap || defaultGameState.currentMap,
        completedChallenges: serverState.completedChallenges || [],
        inventory: serverState.inventory || [],
        quests: serverState.quests || [],
        settings: {
          ...defaultGameState.settings,
          ...serverState.settings
        },
        lastSaved: serverState.lastSaved || new Date().toISOString()
      }));
      
    } catch (error) {
      console.error("Failed to initialize game state:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to load game data. Please try again."
      }));
      
      toast({
        title: "Game Initialization Failed",
        description: "Could not load your game data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Start the game session
  const startGame = (continueGame = false) => {
    if (!state.isInitialized) {
      toast({
        title: "Game Not Initialized",
        description: "Please wait for the game to initialize",
        variant: "destructive"
      });
      return;
    }
    
    // Emit player joined event to socket server
    if (socket.current && user) {
      socket.current.emit('playerJoined', {
        userId: user.id,
        username: user.username,
        map: state.currentMap
      });
    }
    
    // Start auto-save interval
    if (autoSaveIntervalRef.current === null) {
      autoSaveIntervalRef.current = setInterval(() => {
        saveGameState();
      }, 60000); // Auto-save every minute
    }
    
    setState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false
    }));
    
    // Initial save
    saveGameState();
  };
  
  // Pause the game
  const pauseGame = () => {
    setState(prev => ({ ...prev, isPaused: true }));
    
    // Could emit event that player is AFK/paused
    if (socket.current && user) {
      socket.current.emit('playerStatus', {
        userId: user.id,
        status: 'idle'
      });
    }
  };
  
  // Resume the game
  const resumeGame = () => {
    setState(prev => ({ ...prev, isPaused: false }));
    
    // Could emit event that player is active again
    if (socket.current && user) {
      socket.current.emit('playerStatus', {
        userId: user.id,
        status: 'active'
      });
    }
  };
  
  // Exit the game (cleanup)
  const exitGame = () => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false
    }));
    
    // Clear auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
    
    // Save game state before exiting
    saveGameState();
    
    // Emit player left event to socket server
    if (socket.current && user) {
      socket.current.emit('playerLeft', {
        userId: user.id
      });
    }
  };
  
  // Save game state to backend
  const saveGameState = async (): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;
    
    try {
      const currentState = gameStateRef.current;
      
      // Prepare the state for saving (only what we need)
      const saveData = {
        playerData: currentState.playerData,
        currentMap: currentState.currentMap,
        completedChallenges: currentState.completedChallenges,
        inventory: currentState.inventory,
        quests: currentState.quests,
        settings: currentState.settings
      };
      
      await axios.post('/api/game/state/save', saveData);
      
      setState(prev => ({
        ...prev,
        lastSaved: new Date().toISOString()
      }));
      
      return true;
    } catch (error) {
      console.error("Failed to save game state:", error);
      
      toast({
        title: "Save Failed",
        description: "Could not save your game progress",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Update player position
  const updatePlayerPosition = (position: GamePosition) => {
    setState(prev => ({
      ...prev,
      playerData: prev.playerData ? {
        ...prev.playerData,
        position
      } : null
    }));
    
    // Emit position update to socket server
    if (socket.current && user && state.isPlaying && !state.isPaused) {
      socket.current.emit('playerPosition', {
        userId: user.id,
        position,
        map: state.currentMap
      });
    }
  };
  
  // Set current map
  const setCurrentMap = (mapKey: string) => {
    setState(prev => ({
      ...prev,
      currentMap: mapKey,
      currentArea: null // Reset area when map changes
    }));
    
    // Emit map change to socket server
    if (socket.current && user) {
      socket.current.emit('playerMapChange', {
        userId: user.id,
        map: mapKey
      });
    }
  };
  
  // Enter an area
  const enterArea = (area: MapArea) => {
    setState(prev => ({
      ...prev,
      currentArea: area
    }));
    
    // Add area entry event to socket
    if (socket.current && user) {
      socket.current.emit('playerEnterArea', {
        userId: user.id,
        areaName: area.name,
        map: state.currentMap
      });
    }
    
    // Trigger notification
    addNotification({
      type: 'system',
      title: 'Area Discovered',
      message: `You have entered ${area.name}`
    });
  };
  
  // Leave the current area
  const leaveArea = () => {
    // Capture current area before clearing it
    const previousArea = state.currentArea;
    
    setState(prev => ({
      ...prev,
      currentArea: null
    }));
    
    // Add area exit event to socket
    if (socket.current && user && previousArea) {
      socket.current.emit('playerExitArea', {
        userId: user.id,
        areaName: previousArea.name,
        map: state.currentMap
      });
    }
  };
  
  // Start a challenge
  const startChallenge = (challenge: GameChallengeDefinition) => {
    setState(prev => ({
      ...prev,
      activeChallenges: [...prev.activeChallenges, challenge]
    }));
    
    // Emit challenge start event
    if (socket.current && user) {
      socket.current.emit('playerStartChallenge', {
        userId: user.id,
        challengeId: challenge.id
      });
    }
  };
  
  // Complete a challenge
  const completeChallenge = async (challengeId: string, data?: any) => {
    try {
      // Send completion to backend
      const response = await axios.post('/api/game/challenge/complete', {
        challengeId,
        data
      });
      
      const { xpReward, coinReward } = response.data;
      
      // Update state
      setState(prev => ({
        ...prev,
        activeChallenges: prev.activeChallenges.filter(c => c.id !== challengeId),
        completedChallenges: [...prev.completedChallenges, challengeId],
        playerData: prev.playerData ? {
          ...prev.playerData,
          stats: {
            ...prev.playerData.stats,
            experience: (prev.playerData.stats.experience || 0) + xpReward
          }
        } : null
      }));
      
      // Emit challenge complete event
      if (socket.current && user) {
        socket.current.emit('playerCompleteChallenge', {
          userId: user.id,
          challengeId
        });
      }
      
      // Show completion notification
      toast({
        title: "Challenge Completed!",
        description: `You earned ${xpReward} XP and ${coinReward} coins`,
        variant: "success"
      });
      
      // Add to notifications
      addNotification({
        type: 'achievement',
        title: 'Challenge Completed',
        message: `You completed a challenge and earned ${xpReward} XP!`
      });
      
    } catch (error) {
      console.error("Failed to complete challenge:", error);
      
      toast({
        title: "Challenge Completion Failed",
        description: "There was an error recording your progress",
        variant: "destructive"
      });
    }
  };
  
  // Interact with NPC
  const interactWithNPC = (npc: NPCDefinition | null) => {
    setState(prev => ({
      ...prev,
      interactingWith: npc
    }));
    
    // Emit NPC interaction event
    if (socket.current && user && npc) {
      socket.current.emit('playerInteractNPC', {
        userId: user.id,
        npcId: npc.id
      });
    }
  };
  
  // Add item to inventory
  const addItem = (item: any) => {
    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, item]
    }));
    
    // Add notification
    addNotification({
      type: 'item',
      title: 'Item Acquired',
      message: `You obtained ${item.name}`
    });
  };
  
  // Remove item from inventory
  const removeItem = (itemId: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== itemId)
    }));
  };
  
  // Update game settings
  const updateSettings = (settings: Partial<GameState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings
      }
    }));
    
    // Save settings update
    saveGameState();
  };
  
  // Mark notification as read
  const markNotificationAsRead = (notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    }));
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    setState(prev => ({
      ...prev,
      notifications: []
    }));
  };
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      read: false
    };
    
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications].slice(0, 50) // Keep last 50 notifications
    }));
  };
  
  // Reset game state
  const resetGameState = () => {
    // Clear auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
    
    setState(defaultGameState);
  };
  
  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socket.current) return;
    
    // Player joined
    socket.current.on('playerJoined', (data: any) => {
      // Don't add self
      if (data.userId === user?.id) return;
      
      // Only add players in same map
      if (data.map !== gameStateRef.current.currentMap) return;
      
      setState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [data.userId]: {
            id: data.userId,
            username: data.username,
            position: data.position || { x: 0, y: 0 },
            sprite: data.sprite || 'player',
            lastUpdated: Date.now()
          }
        }
      }));
    });
    
    // Player left
    socket.current.on('playerLeft', (data: any) => {
      setState(prev => {
        const newPlayers = { ...prev.players };
        delete newPlayers[data.userId];
        return {
          ...prev,
          players: newPlayers
        };
      });
    });
    
    // Player position update
    socket.current.on('playerPosition', (data: any) => {
      // Don't update self
      if (data.userId === user?.id) return;
      
      // Only update players in same map
      if (data.map !== gameStateRef.current.currentMap) return;
      
      setState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [data.userId]: {
            ...prev.players[data.userId],
            position: data.position,
            lastUpdated: Date.now()
          }
        }
      }));
    });
    
    // Player map change
    socket.current.on('playerMapChange', (data: any) => {
      setState(prev => {
        // If player left our current map, remove them
        if (data.map !== prev.currentMap) {
          const newPlayers = { ...prev.players };
          delete newPlayers[data.userId];
          return {
            ...prev,
            players: newPlayers
          };
        }
        
        // If player entered our map, add them
        if (data.map === prev.currentMap && data.userId !== user?.id) {
          return {
            ...prev,
            players: {
              ...prev.players,
              [data.userId]: {
                id: data.userId,
                username: data.username,
                position: data.position || { x: 0, y: 0 },
                sprite: data.sprite || 'player',
                lastUpdated: Date.now()
              }
            }
          };
        }
        
        return prev;
      });
    });
    
    // Global game events (achievements, announcements)
    socket.current.on('gameEvent', (data: any) => {
      addNotification({
        type: data.type || 'system',
        title: data.title || 'Game Event',
        message: data.message || ''
      });
    });
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      if (socket.current) {
        disconnectSocket();
        socket.current = null;
      }
    };
  }, []);
  
  // Initialize game when user authenticates
  useEffect(() => {
    if (isAuthenticated && user && !state.isInitialized && !state.isLoading) {
      initGame();
    }
  }, [isAuthenticated, user]);
  
  // Context value
  const value = {
    state,
    initGame,
    startGame,
    pauseGame,
    resumeGame,
    exitGame,
    saveGameState,
    updatePlayerPosition,
    setCurrentMap,
    enterArea,
    leaveArea,
    startChallenge,
    completeChallenge,
    interactWithNPC,
    addItem,
    removeItem,
    updateSettings,
    markNotificationAsRead,
    clearAllNotifications,
    addNotification,
    resetGameState,
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
