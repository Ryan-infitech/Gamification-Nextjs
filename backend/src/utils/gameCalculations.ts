/**
 * Calculate experience needed for a specific level
 * Uses a common RPG-style level curve formula
 * Experience = base * (level ^ exponent)
 *
 * @param level - Target level
 * @returns Experience points needed
 */
export function calculateExperienceForLevel(level: number): number {
  const baseExp = 100; // Base experience for level 1
  const exponent = 1.8; // Growth exponent (higher = steeper curve)

  if (level <= 1) return 0;

  return Math.floor(baseExp * Math.pow(level - 1, exponent));
}

/**
 * Calculate current level based on total experience
 * Uses binary search to efficiently find the level
 *
 * @param experience - Total experience points
 * @returns Current level
 */
export function calculateLevelForExperience(experience: number): number {
  if (experience <= 0) return 1;

  // Set reasonable boundaries
  let min = 1;
  let max = 100; // Maximum reasonable level to check

  // Binary search for the level
  while (min <= max) {
    const mid = Math.floor((min + max) / 2);
    const expForLevel = calculateExperienceForLevel(mid);
    const expForNextLevel = calculateExperienceForLevel(mid + 1);

    if (experience >= expForLevel && experience < expForNextLevel) {
      return mid;
    }

    if (experience < expForLevel) {
      max = mid - 1;
    } else {
      min = mid + 1;
    }
  }

  // If we reach here, the experience is very high
  return max;
}

/**
 * Calculate progress to next level as a percentage
 *
 * @param experience - Current total experience
 * @param currentLevel - Current level (optional, will calculate if not provided)
 * @returns Progress as a percentage (0-100)
 */
export function calculateLevelProgress(
  experience: number,
  currentLevel?: number
): number {
  // Determine current level if not provided
  const level = currentLevel || calculateLevelForExperience(experience);

  // Calculate experience thresholds
  const currentLevelExp = calculateExperienceForLevel(level);
  const nextLevelExp = calculateExperienceForLevel(level + 1);

  // Calculate progress
  const expInCurrentLevel = experience - currentLevelExp;
  const expRequiredForNextLevel = nextLevelExp - currentLevelExp;

  // Calculate percentage (cap at 100%)
  const progress = Math.min(
    100,
    Math.floor((expInCurrentLevel / expRequiredForNextLevel) * 100)
  );

  return progress;
}

/**
 * Calculate rewards based on challenge difficulty
 *
 * @param baseCoinReward - Base coin reward value
 * @param baseExpReward - Base experience reward value
 * @param difficulty - Difficulty level ('easy', 'medium', 'hard')
 * @param playerLevel - Current player level for scaling
 * @returns Calculated rewards
 */
export function calculateChallengeRewards(
  baseCoinReward: number,
  baseExpReward: number,
  difficulty: "easy" | "medium" | "hard",
  playerLevel: number
): { coins: number; experience: number } {
  // Difficulty multipliers
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.5,
    hard: 2.5,
  };

  // Apply difficulty multiplier
  const multiplier = difficultyMultipliers[difficulty];

  // Level scaling factor (slight diminishing returns at higher levels)
  const levelScaling = Math.pow(playerLevel, 0.2);

  // Calculate final rewards
  const coins = Math.round(baseCoinReward * multiplier * levelScaling);
  const experience = Math.round(baseExpReward * multiplier * levelScaling);

  return { coins, experience };
}

/**
 * Calculate time-based rewards (for daily login, playtime, etc.)
 *
 * @param baseReward - Base reward amount
 * @param streakCount - Consecutive streak count
 * @param maxMultiplier - Maximum streak multiplier
 * @returns Calculated reward
 */
export function calculateStreakReward(
  baseReward: number,
  streakCount: number,
  maxMultiplier: number = 3
): number {
  // Calculate multiplier based on streak (capped at maxMultiplier)
  const multiplier = Math.min(1 + streakCount * 0.1, maxMultiplier);

  // Apply multiplier and round to integer
  return Math.round(baseReward * multiplier);
}

/**
 * Calculate damage based on attacker and defender stats
 *
 * @param attackerStat - Attacker's relevant stat (strength, intelligence)
 * @param defenderStat - Defender's relevant stat (usually defense)
 * @param baseDamage - Base damage amount
 * @param randomFactor - Whether to include random variance
 * @returns Calculated damage
 */
export function calculateDamage(
  attackerStat: number,
  defenderStat: number,
  baseDamage: number,
  randomFactor: boolean = true
): number {
  // Basic damage formula with stat difference
  let damage = baseDamage * (1 + (attackerStat - defenderStat) * 0.05);

  // Ensure minimum damage is 1
  damage = Math.max(1, damage);

  // Add random variance if enabled (±15%)
  if (randomFactor) {
    const variance = 0.15; // 15% variance
    const randomMultiplier = 1 + (Math.random() * 2 - 1) * variance;
    damage *= randomMultiplier;
  }

  // Round to integer
  return Math.round(damage);
}

/**
 * Calculate success chance for various game mechanics
 *
 * @param baseChance - Base chance of success (0-1)
 * @param playerStat - Player's relevant stat
 * @param difficulty - Difficulty threshold
 * @returns Success chance as percentage (0-100)
 */
export function calculateSuccessChance(
  baseChance: number,
  playerStat: number,
  difficulty: number
): number {
  // Calculate modifier based on player stat vs difficulty
  const statDifference = playerStat - difficulty;
  const modifier = statDifference * 0.05; // 5% per point of difference

  // Apply modifier to base chance
  let chance = baseChance + modifier;

  // Clamp between 0.05 (5%) and 0.95 (95%)
  chance = Math.min(0.95, Math.max(0.05, chance));

  // Convert to percentage
  return Math.round(chance * 100);
}

/**
 * Determine if a random chance succeeds
 *
 * @param chance - Success chance (0-100)
 * @returns true if successful, false otherwise
 */
export function rollChance(chance: number): boolean {
  return Math.random() * 100 < chance;
}

/**
 * Calculate item value based on rarity and level
 *
 * @param baseValue - Base value of the item
 * @param rarity - Rarity level ('common', 'uncommon', 'rare', 'epic', 'legendary')
 * @param itemLevel - Level of the item
 * @returns Calculated value
 */
export function calculateItemValue(
  baseValue: number,
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary",
  itemLevel: number
): number {
  // Rarity multipliers
  const rarityMultipliers = {
    common: 1,
    uncommon: 2,
    rare: 4,
    epic: 8,
    legendary: 16,
  };

  // Apply rarity multiplier
  const multiplier = rarityMultipliers[rarity];

  // Apply level scaling
  const levelScaling = 1 + itemLevel * 0.1;

  // Calculate final value
  return Math.round(baseValue * multiplier * levelScaling);
}

/**
 * Calculate cooldown reduction based on player stats
 *
 * @param baseCooldown - Base cooldown in seconds
 * @param intelligenceStat - Intelligence stat
 * @param maxReduction - Maximum reduction percentage (0-1)
 * @returns Cooldown in seconds after reduction
 */
export function calculateCooldown(
  baseCooldown: number,
  intelligenceStat: number,
  maxReduction: number = 0.5
): number {
  // Calculate reduction percentage based on intelligence
  // Each point of intelligence reduces cooldown by 1%, capped at maxReduction
  const reductionPercent = Math.min(intelligenceStat * 0.01, maxReduction);

  // Apply reduction
  const reducedCooldown = baseCooldown * (1 - reductionPercent);

  // Return the reduced cooldown, ensuring it's at least 0.5 seconds
  return Math.max(0.5, reducedCooldown);
}

/**
 * Scale difficulty based on player level and number of players
 *
 * @param baseDifficulty - Base difficulty value
 * @param playerLevel - Current player level
 * @param playerCount - Number of players (for multiplayer scaling)
 * @returns Scaled difficulty value
 */
export function scaleDifficulty(
  baseDifficulty: number,
  playerLevel: number,
  playerCount: number = 1
): number {
  // Scale by player level
  const levelScaling = 1 + (playerLevel - 1) * 0.1;

  // Scale by number of players (diminishing returns for more players)
  const playerScaling =
    playerCount <= 1 ? 1 : 1 + Math.log10(playerCount) * 0.5;

  // Calculate final difficulty
  return Math.round(baseDifficulty * levelScaling * playerScaling);
}

/**
 * Calculate total stats from base stats and equipment
 *
 * @param baseStats - Player's base stats
 * @param equipmentBonuses - Stat bonuses from equipment
 * @returns Combined stats
 */
export function calculateTotalStats(
  baseStats: Record<string, number>,
  equipmentBonuses: Record<string, number>[]
): Record<string, number> {
  // Start with base stats
  const totalStats = { ...baseStats };

  // Add equipment bonuses
  for (const bonuses of equipmentBonuses) {
    for (const [stat, value] of Object.entries(bonuses)) {
      if (totalStats[stat] !== undefined) {
        totalStats[stat] += value;
      } else {
        totalStats[stat] = value;
      }
    }
  }

  return totalStats;
}

/**
 * Calculate critical hit chance and damage
 *
 * @param baseCritChance - Base critical hit chance (0-1)
 * @param baseCritMultiplier - Base critical damage multiplier
 * @param agilityStat - Player's agility stat
 * @returns Critical hit info
 */
export function calculateCritical(
  baseCritChance: number,
  baseCritMultiplier: number,
  agilityStat: number
): { chance: number; multiplier: number } {
  // Each point of agility increases crit chance by 0.5%
  const critChance = Math.min(0.5, baseCritChance + agilityStat * 0.005);

  // Each point of agility increases crit multiplier by 0.01
  const critMultiplier = baseCritMultiplier + agilityStat * 0.01;

  return {
    chance: critChance,
    multiplier: critMultiplier,
  };
}

/**
 * Calculate experience reward distribution for teams
 *
 * @param totalExp - Total experience to distribute
 * @param playerLevels - Array of player levels
 * @returns Array of experience amounts to award each player
 */
export function distributeTeamExperience(
  totalExp: number,
  playerLevels: number[]
): number[] {
  const playerCount = playerLevels.length;

  // If solo, return all experience
  if (playerCount === 1) {
    return [totalExp];
  }

  // Calculate level sum for weighted distribution
  const levelSum = playerLevels.reduce((sum, level) => sum + level, 0);

  // Distribute experience proportionally to level
  return playerLevels.map((level) => {
    // Higher level players get slightly less to help lower level players catch up
    const levelWeight = Math.pow(level / levelSum, 0.9);
    // Apply slight group bonus (10% more total exp for teamwork)
    const groupBonus = 1.1;
    const expShare = Math.round(totalExp * groupBonus * levelWeight);
    return expShare;
  });
}

/**
 * Convert real time to game time
 *
 * @param realMilliseconds - Real-world time in milliseconds
 * @param gameTimeRatio - How much faster game time passes (e.g., 24 = 1 real hour = 1 game day)
 * @returns Game time object
 */
export function calculateGameTime(
  realMilliseconds: number,
  gameTimeRatio: number = 24
): { days: number; hours: number; minutes: number } {
  // Calculate total game minutes
  const gameMinutes = (realMilliseconds / 1000 / 60) * gameTimeRatio;

  // Break down into game days, hours, minutes
  const days = Math.floor(gameMinutes / (24 * 60));
  const hours = Math.floor((gameMinutes % (24 * 60)) / 60);
  const minutes = Math.floor(gameMinutes % 60);

  return { days, hours, minutes };
}
