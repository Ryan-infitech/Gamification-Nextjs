// API response types

export interface ApiResponse<T> {
  status: "success" | "error" | "partial";
  message?: string;
  data?: T;
  errors?: any[];
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  playerStats?: PlayerStats;
}

export interface PlayerStats {
  id: string;
  userId: string;
  level: number;
  xp: number;
  coins: number;
  powerLevel: number;
  codingSkill: number;
  problemSolving: number;
}

export interface GameArea {
  id: string;
  name: string;
  description: string;
  mapFile: string;
  difficultyLevel: number;
  prerequisiteAreaId: string | null;
  minPlayerLevel: number;
  isActive: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challengeType: "logic" | "algorithm" | "data_structure" | "boss";
  difficulty: number;
  areaId: string;
  xpReward: number;
  coinReward: number;
  hints: string[];
}

export interface ChallengeTestCase {
  id: string;
  challengeId: string;
  caseOrder: number;
  description?: string;
  input: any;
  expected?: any;
  isHidden: boolean;
}

export interface GameProgress {
  id: string;
  userId: string;
  currentAreaId: string;
  positionX: number;
  positionY: number;
  lastCheckpoint: string | null;
  lastActive: string;
}
