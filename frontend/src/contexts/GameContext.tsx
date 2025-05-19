"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { socketManager } from "@/lib/socket";
import {
  GameState,
  GameAction,
  Player,
  GameArea,
  Challenge,
  GameEvent,
} from "@/types/game";

// Initial game state
const initialGameState: GameState = {
  player: {
    position: { x: 0, y: 0 },
    direction: "down",
    speed: 160,
    stats: {
      level: 1,
      xp: 0,
      coins: 0,
      health: 100,
      maxHealth: 100,
      codingSkill: 1,
      problemSolving: 1,
    },
    inventory: [],
    currentAreaId: null,
    isMoving: false,
  },
  gameAreas: [],
  currentArea: null,
  otherPlayers: new Map(),
  challenges: [],
  currentChallenge: null,
  events: [],
  settings: {
    soundEnabled: true,
    musicVolume: 0.7,
    sfxVolume: 1.0,
    pixelPerfect: true,
    showFps: false,
  },
  status: {
    isInitialized: false,
    isLoading: true,
    isConnected: false,
    lastSyncTime: null,
    error: null,
  },
};

// Reducer to handle game state updates
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "INITIALIZE_GAME":
      return {
        ...state,
        player: {
          ...state.player,
          ...action.payload.player,
        },
        gameAreas: action.payload.gameAreas || [],
        status: {
          ...state.status,
          isInitialized: true,
          isLoading: false,
        },
      };

    case "UPDATE_PLAYER_POSITION":
      return {
        ...state,
        player: {
          ...state.player,
          position: action.payload.position,
          direction: action.payload.direction || state.player.direction,
          isMoving:
            action.payload.isMoving !== undefined
              ? action.payload.isMoving
              : state.player.isMoving,
        },
      };

    case "UPDATE_PLAYER_STATS":
      return {
        ...state,
        player: {
          ...state.player,
          stats: {
            ...state.player.stats,
            ...action.payload,
          },
        },
      };

    case "CHANGE_AREA":
      return {
        ...state,
        player: {
          ...state.player,
          currentAreaId: action.payload.areaId,
          position: action.payload.position || state.player.position,
        },
        currentArea: action.payload.areaData || null,
        otherPlayers: new Map(), // Reset other players when changing areas
      };

    case "UPDATE_OTHER_PLAYER":
      const updatedPlayers = new Map(state.otherPlayers);
      if (action.payload.data) {
        updatedPlayers.set(action.payload.id, {
          ...updatedPlayers.get(action.payload.id),
          ...action.payload.data,
        });
      } else {
        updatedPlayers.delete(action.payload.id);
      }

      return {
        ...state,
        otherPlayers: updatedPlayers,
      };

    case "START_CHALLENGE":
      return {
        ...state,
        currentChallenge: action.payload,
      };

    case "END_CHALLENGE":
      return {
        ...state,
        currentChallenge: null,
      };

    case "ADD_ITEM_TO_INVENTORY":
      return {
        ...state,
        player: {
          ...state.player,
          inventory: [...state.player.inventory, action.payload],
        },
      };

    case "REMOVE_ITEM_FROM_INVENTORY":
      return {
        ...state,
        player: {
          ...state.player,
          inventory: state.player.inventory.filter(
            (item) => item.id !== action.payload.id
          ),
        },
      };

    case "ADD_GAME_EVENT":
      const newEvent: GameEvent = {
        id: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
        ...action.payload,
      };

      return {
        ...state,
        events: [newEvent, ...state.events].slice(0, 50), // Keep last 50 events
      };

    case "UPDATE_CONNECTION_STATUS":
      return {
        ...state,
        status: {
          ...state.status,
          isConnected: action.payload,
        },
      };

    case "UPDATE_GAME_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case "SET_ERROR":
      return {
        ...state,
        status: {
          ...state.status,
          error: action.payload,
        },
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        status: {
          ...state.status,
          error: null,
        },
      };

    default:
      return state;
  }
}

// Create context with TypeScript interface
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  movePlayer: (
    x: number,
    y: number,
    direction?: string,
    isMoving?: boolean
  ) => void;
  changeArea: (areaId: string, position?: { x: number; y: number }) => void;
  startChallenge: (challenge: Challenge) => void;
  endChallenge: (results?: any) => void;
  addItemToInventory: (item: any) => void;
  removeItemFromInventory: (itemId: string) => void;
  updatePlayerStats: (stats: Partial<GameState["player"]["stats"]>) => void;
  updateGameSettings: (settings: Partial<GameState["settings"]>) => void;
  sendChatMessage: (message: string, isGlobal?: boolean) => void;
  interactWithNPC: (npcId: string) => void;
}

const defaultContextValue: GameContextType = {
  state: initialGameState,
  dispatch: () => null,
  movePlayer: () => null,
  changeArea: () => null,
  startChallenge: () => null,
  endChallenge: () => null,
  addItemToInventory: () => null,
  removeItemFromInventory: () => null,
  updatePlayerStats: () => null,
  updateGameSettings: () => null,
  sendChatMessage: () => null,
  interactWithNPC: () => null,
};

// Create the context
const GameContext = createContext<GameContextType>(defaultContextValue);

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<any>(null);

  // Initialize the game when the component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeGame();
    }
  }, [isAuthenticated, user]);

  // Initialize socket connection when the user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const socketClient = socketManager.connect(user.token);
      setSocket(socketClient);

      // Listen for connection events
      socketClient.on("connect", () => {
        dispatch({ type: "UPDATE_CONNECTION_STATUS", payload: true });
        dispatch({
          type: "ADD_GAME_EVENT",
          payload: { type: "system", message: "Connected to server" },
        });
      });

      socketClient.on("disconnect", () => {
        dispatch({ type: "UPDATE_CONNECTION_STATUS", payload: false });
        dispatch({
          type: "ADD_GAME_EVENT",
          payload: { type: "system", message: "Disconnected from server" },
        });
      });

      // Player related events
      socketClient.on("player:moved", (data: any) => {
        if (data.userId !== user.id) {
          dispatch({
            type: "UPDATE_OTHER_PLAYER",
            payload: {
              id: data.userId,
              data: {
                position: data.position,
                direction: data.animation?.split("-")?.pop() || "down",
                isMoving: true,
                lastUpdated: Date.now(),
              },
            },
          });
        }
      });

      socketClient.on("player:joined", (data: any) => {
        dispatch({
          type: "UPDATE_OTHER_PLAYER",
          payload: {
            id: data.userId,
            data: {
              username: data.username,
              position: data.position,
              direction: "down",
              isMoving: false,
              lastUpdated: Date.now(),
            },
          },
        });

        dispatch({
          type: "ADD_GAME_EVENT",
          payload: {
            type: "player",
            message: `${data.username} joined the area`,
          },
        });
      });

      socketClient.on("player:left", (data: any) => {
        dispatch({
          type: "UPDATE_OTHER_PLAYER",
          payload: { id: data.userId, data: null },
        });
      });

      socketClient.on("area:players", (data: any) => {
        // Add all existing players in this area
        data.players.forEach((player: any) => {
          dispatch({
            type: "UPDATE_OTHER_PLAYER",
            payload: {
              id: player.userId,
              data: {
                username: player.username,
                position: player.position,
                direction: "down",
                isMoving: false,
                lastUpdated: Date.now(),
              },
            },
          });
        });
      });

      // Chat related events
      socketClient.on("chat:message", (data: any) => {
        dispatch({
          type: "ADD_GAME_EVENT",
          payload: {
            type: "chat",
            message: data.message,
            sender: data.senderName,
            isGlobal: data.isGlobal,
          },
        });
      });

      // Challenge related events
      socketClient.on("challenge:started", (data: any) => {
        dispatch({ type: "START_CHALLENGE", payload: data.challenge });
      });

      socketClient.on("challenge:completed", (data: any) => {
        // Update player stats with rewards
        if (data.rewards) {
          dispatch({
            type: "UPDATE_PLAYER_STATS",
            payload: {
              xp: state.player.stats.xp + data.rewards.xp,
              coins: state.player.stats.coins + data.rewards.coins,
              level: data.rewards.level || state.player.stats.level,
            },
          });
        }

        dispatch({ type: "END_CHALLENGE" });

        dispatch({
          type: "ADD_GAME_EVENT",
          payload: {
            type: "achievement",
            message: `Challenge completed: ${data.challenge?.title}`,
          },
        });
      });

      // Handle errors
      socketClient.on("error", (error: any) => {
        dispatch({ type: "SET_ERROR", payload: error.message });
      });

      // Clean up socket connection when the component unmounts
      return () => {
        socketClient.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Initialize the game by fetching player and world data
  const initializeGame = async () => {
    try {
      // In a real implementation, you would fetch data from your API
      const playerDataResponse = await fetch("/api/game/player");
      const areasResponse = await fetch("/api/game/areas");

      if (!playerDataResponse.ok || !areasResponse.ok) {
        throw new Error("Failed to fetch game data");
      }

      const playerData = await playerDataResponse.json();
      const areasData = await areasResponse.json();

      dispatch({
        type: "INITIALIZE_GAME",
        payload: {
          player: playerData.data,
          gameAreas: areasData.data.areas,
        },
      });

      // If the player has a current area, fetch it
      if (playerData.data.currentAreaId) {
        await changeArea(
          playerData.data.currentAreaId,
          playerData.data.position
        );
      }
    } catch (error: any) {
      console.error("Failed to initialize game:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  };

  // Move the player
  const movePlayer = (
    x: number,
    y: number,
    direction?: string,
    isMoving?: boolean
  ) => {
    // Update local state immediately for responsive UI
    dispatch({
      type: "UPDATE_PLAYER_POSITION",
      payload: {
        position: { x, y },
        direction,
        isMoving,
      },
    });

    // Send position update to server if connected
    if (socket && state.status.isConnected) {
      socket.emit("player:move", {
        position: { x, y },
        animation: direction ? `walk-${direction}` : undefined,
      });
    }
  };

  // Change the current area
  const changeArea = async (
    areaId: string,
    position?: { x: number; y: number }
  ) => {
    try {
      // Fetch area data
      const response = await fetch(`/api/game/areas/${areaId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch area data");
      }

      const data = await response.json();

      // Update state with new area
      dispatch({
        type: "CHANGE_AREA",
        payload: {
          areaId,
          position,
          areaData: data.data.area,
        },
      });

      // Notify server about area change
      if (socket && state.status.isConnected) {
        socket.emit("player:changeArea", {
          areaId,
          position,
        });
      }
    } catch (error: any) {
      console.error("Failed to change area:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  };

  // Start a challenge
  const startChallenge = (challenge: Challenge) => {
    dispatch({ type: "START_CHALLENGE", payload: challenge });

    // Notify server about starting a challenge
    if (socket && state.status.isConnected) {
      socket.emit("challenge:start", { challengeId: challenge.id });
    }
  };

  // End a challenge
  const endChallenge = (results?: any) => {
    const challengeId = state.currentChallenge?.id;

    dispatch({ type: "END_CHALLENGE" });

    // Notify server about challenge completion if there are results
    if (results && socket && state.status.isConnected && challengeId) {
      socket.emit("challenge:complete", {
        challengeId,
        score: results.score,
        timeTaken: results.timeTaken,
      });
    }
  };

  // Add an item to inventory
  const addItemToInventory = (item: any) => {
    dispatch({ type: "ADD_ITEM_TO_INVENTORY", payload: item });
  };

  // Remove an item from inventory
  const removeItemFromInventory = (itemId: string) => {
    dispatch({ type: "REMOVE_ITEM_FROM_INVENTORY", payload: { id: itemId } });
  };

  // Update player stats
  const updatePlayerStats = (stats: Partial<GameState["player"]["stats"]>) => {
    dispatch({ type: "UPDATE_PLAYER_STATS", payload: stats });
  };

  // Update game settings
  const updateGameSettings = (settings: Partial<GameState["settings"]>) => {
    dispatch({ type: "UPDATE_GAME_SETTINGS", payload: settings });

    // Save settings to localStorage
    localStorage.setItem(
      "gameSettings",
      JSON.stringify({
        ...state.settings,
        ...settings,
      })
    );
  };

  // Send a chat message
  const sendChatMessage = (message: string, isGlobal = false) => {
    if (socket && state.status.isConnected) {
      if (isGlobal) {
        socket.emit("chat:global", { message });
      } else {
        socket.emit("chat:area", { message });
      }
    }
  };

  // Interact with an NPC
  const interactWithNPC = (npcId: string) => {
    if (socket && state.status.isConnected) {
      socket.emit("npc:interact", { npcId });
    }
  };

  // Context value with all game state and actions
  const contextValue: GameContextType = {
    state,
    dispatch,
    movePlayer,
    changeArea,
    startChallenge,
    endChallenge,
    addItemToInventory,
    removeItemFromInventory,
    updatePlayerStats,
    updateGameSettings,
    sendChatMessage,
    interactWithNPC,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

// Hook for accessing the game context
export const useGameContext = () => useContext(GameContext);

export default GameContext;
