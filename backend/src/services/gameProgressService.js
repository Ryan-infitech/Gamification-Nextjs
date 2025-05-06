/**
 * Game Progress Service
 * Manages game state, player progression, and achievements
 */
const { executeDbOperation } = require("../config/database");

/**
 * Calculate level from XP
 * @param {number} xp - Experience points
 * @returns {number} - Level
 */
const calculateLevelFromXp = (xp) => {
  // Simple level calculation: each level requires 20% more XP than the previous
  // Level 1: 0 XP
  // Level 2: 100 XP
  // Level 3: 220 XP (100 + 100*1.2)
  // Level 4: 364 XP (220 + 120*1.2)
  // and so on...

  if (xp < 100) return 1;

  let level = 1;
  let xpForNextLevel = 100;
  let totalXpRequired = 0;

  while (true) {
    totalXpRequired += xpForNextLevel;
    if (xp < totalXpRequired) {
      return level;
    }
    level++;
    xpForNextLevel = Math.floor(xpForNextLevel * 1.2);
  }
};

/**
 * Update player position in the game
 * @param {string} userId - User ID
 * @param {string} areaId - Area ID
 * @param {number} positionX - X coordinate
 * @param {number} positionY - Y coordinate
 * @param {string} checkpoint - Checkpoint name (optional)
 * @returns {Object} - Result with success flag and data
 */
const updatePlayerPosition = async (
  userId,
  areaId,
  positionX,
  positionY,
  checkpoint = null
) => {
  try {
    // Prepare update data
    const updateData = {
      current_area_id: areaId,
      position_x: positionX,
      position_y: positionY,
      last_active: new Date(),
    };

    if (checkpoint) {
      updateData.last_checkpoint = checkpoint;
    }

    // Update game progress
    const result = await executeDbOperation(async (client) => {
      return await client
        .from("game_progress")
        .update(updateData)
        .eq("user_id", userId)
        .select("*")
        .single();
    });

    if (result.error) {
      return {
        success: false,
        message: "Failed to update player position: " + result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error updating player position:", error);
    return {
      success: false,
      message: "Error updating player position: " + error.message,
    };
  }
};

/**
 * Track a challenge attempt
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {Object} - Result with success flag
 */
const trackChallengeAttempt = async (userId, challengeId) => {
  try {
    // Check if the challenge has been attempted before
    const existingResult = await executeDbOperation(async (client) => {
      return await client
        .from("completed_challenges")
        .select("attempts")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .single();
    });

    if (!existingResult.error && existingResult.data) {
      // Increment attempts for existing record
      await executeDbOperation(async (client) => {
        return await client
          .from("completed_challenges")
          .update({
            attempts: existingResult.data.attempts + 1,
          })
          .eq("user_id", userId)
          .eq("challenge_id", challengeId);
      });
    } else {
      // Create a new record with attempts = 1 but not completed yet
      await executeDbOperation(async (client) => {
        return await client.from("completed_challenges").insert({
          user_id: userId,
          challenge_id: challengeId,
          attempts: 1,
          completed_at: null,
        });
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error tracking challenge attempt:", error);
    return {
      success: false,
      message: "Error tracking challenge attempt: " + error.message,
    };
  }
};

/**
 * Complete a challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @param {string} solution - User's solution code
 * @param {number} timeTaken - Time taken in seconds
 * @returns {Object} - Result with success flag, data, and achievements
 */
const completeChallenge = async (userId, challengeId, solution, timeTaken) => {
  try {
    // Get challenge details
    const challengeResult = await executeDbOperation(async (client) => {
      return await client
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
    });

    if (challengeResult.error || !challengeResult.data) {
      return {
        success: false,
        message: "Challenge not found",
      };
    }

    const challenge = challengeResult.data;

    // Get player stats
    const statsResult = await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
    });

    if (statsResult.error || !statsResult.data) {
      return {
        success: false,
        message: "Player stats not found",
      };
    }

    const playerStats = statsResult.data;

    // Calculate score based on time taken and difficulty
    // Simple formula: base score (100) - time penalty + difficulty bonus
    const baseScore = 100;
    const timePenalty = Math.min(50, Math.floor(timeTaken / 10)); // Up to 50 points penalty
    const difficultyBonus = challenge.difficulty * 10; // 10 points per difficulty level
    const score = baseScore - timePenalty + difficultyBonus;

    // Update the completed challenge record
    await executeDbOperation(async (client) => {
      return await client.from("completed_challenges").upsert(
        {
          user_id: userId,
          challenge_id: challengeId,
          completed_at: new Date(),
          solution_code: solution,
          score,
          time_taken: timeTaken,
          attempts: statsResult.data ? statsResult.data.attempts + 1 : 1,
        },
        {
          onConflict: "user_id,challenge_id",
          ignoreDuplicates: false,
        }
      );
    });

    // Update player stats with rewards
    const newXp = playerStats.xp + challenge.xp_reward;
    const newCoins = playerStats.coins + challenge.coin_reward;
    const newLevel = calculateLevelFromXp(newXp);

    // Calculate skill improvements based on challenge type
    let codingSkillIncrease = 0;
    let problemSolvingIncrease = 0;

    if (["algorithm", "data_structure"].includes(challenge.challenge_type)) {
      codingSkillIncrease = 1;
    }

    if (["logic", "boss"].includes(challenge.challenge_type)) {
      problemSolvingIncrease = 1;
    }

    // Update player stats
    await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .update({
          xp: newXp,
          coins: newCoins,
          level: newLevel,
          coding_skill: playerStats.coding_skill + codingSkillIncrease,
          problem_solving: playerStats.problem_solving + problemSolvingIncrease,
          updated_at: new Date(),
        })
        .eq("user_id", userId);
    });

    // Check for any achievements
    const achievements = await checkAndAwardAchievements(userId);

    return {
      success: true,
      data: {
        challenge,
        score,
        rewards: {
          xp: challenge.xp_reward,
          coins: challenge.coin_reward,
          level: newLevel > playerStats.level ? newLevel : null,
          codingSkill:
            codingSkillIncrease > 0
              ? playerStats.coding_skill + codingSkillIncrease
              : null,
          problemSolving:
            problemSolvingIncrease > 0
              ? playerStats.problem_solving + problemSolvingIncrease
              : null,
        },
      },
      achievements,
    };
  } catch (error) {
    console.error("Error completing challenge:", error);
    return {
      success: false,
      message: "Error completing challenge: " + error.message,
    };
  }
};

/**
 * Check for and award any earned achievements
 * @param {string} userId - User ID
 * @returns {Array} - Newly awarded achievements
 */
const checkAndAwardAchievements = async (userId) => {
  try {
    const newAchievements = [];

    // Get player's stats and completed challenges
    const statsResult = await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
    });

    if (statsResult.error || !statsResult.data) {
      return newAchievements;
    }

    const completedChallengesResult = await executeDbOperation(
      async (client) => {
        return await client
          .from("completed_challenges")
          .select("*, challenges(*)")
          .eq("user_id", userId);
      }
    );

    if (completedChallengesResult.error) {
      return newAchievements;
    }

    const completedChallenges = completedChallengesResult.data || [];

    // Get all achievements the player doesn't have yet
    const achievementsResult = await executeDbOperation(async (client) => {
      return await client
        .from("achievements")
        .select("*")
        .not(
          "id",
          "in",
          `(
          SELECT achievement_id FROM user_achievements WHERE user_id = '${userId}'
        )`
        );
    });

    if (achievementsResult.error) {
      return newAchievements;
    }

    const availableAchievements = achievementsResult.data || [];

    // Check each achievement requirement
    for (const achievement of availableAchievements) {
      let awarded = false;

      switch (achievement.requirement_code) {
        case "completed_challenges_count >= 1":
          if (completedChallenges.length >= 1) awarded = true;
          break;

        case "completed_algorithm_challenges_count >= 3":
          const algorithmChallenges = completedChallenges.filter(
            (cc) => cc.challenges?.challenge_type === "algorithm"
          );
          if (algorithmChallenges.length >= 3) awarded = true;
          break;

        case "defeated_bosses_count >= 1":
          const bossChallenges = completedChallenges.filter(
            (cc) => cc.challenges?.challenge_type === "boss"
          );
          if (bossChallenges.length >= 1) awarded = true;
          break;

        // Add more achievement checks as needed
      }

      if (awarded) {
        // Award the achievement
        await executeDbOperation(async (client) => {
          return await client.from("user_achievements").insert({
            user_id: userId,
            achievement_id: achievement.id,
            awarded_at: new Date(),
          });
        });

        // Add achievement XP and coins to player
        await executeDbOperation(async (client) => {
          return await client
            .from("player_stats")
            .update({
              xp: statsResult.data.xp + achievement.xp_reward,
              coins: statsResult.data.coins + achievement.coin_reward,
            })
            .eq("user_id", userId);
        });

        // Add to new achievements list
        newAchievements.push({
          ...achievement,
          rewards: {
            xp: achievement.xp_reward,
            coins: achievement.coin_reward,
          },
        });
      }
    }

    return newAchievements;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
};

/**
 * Purchase an item
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID
 * @returns {Object} - Result with success flag and data
 */
const purchaseItem = async (userId, itemId) => {
  try {
    // Get item details
    const itemResult = await executeDbOperation(async (client) => {
      return await client.from("items").select("*").eq("id", itemId).single();
    });

    if (itemResult.error || !itemResult.data) {
      return {
        success: false,
        message: "Item not found",
      };
    }

    const item = itemResult.data;

    // Get player stats to check coins
    const statsResult = await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
    });

    if (statsResult.error || !statsResult.data) {
      return {
        success: false,
        message: "Player stats not found",
      };
    }

    // Calculate item price based on rarity
    const rarityPrices = {
      common: 50,
      uncommon: 100,
      rare: 200,
      epic: 500,
      legendary: 1000,
    };

    const price = rarityPrices[item.rarity] || 100;

    // Check if player has enough coins
    if (statsResult.data.coins < price) {
      return {
        success: false,
        message: "Not enough coins to purchase this item",
      };
    }

    // Check if player already has this item
    const inventoryResult = await executeDbOperation(async (client) => {
      return await client
        .from("user_inventory")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .single();
    });

    // Start a transaction
    let transaction;
    if (inventoryResult.data) {
      // If player already has the item, increase quantity
      transaction = await executeDbOperation(async (client) => {
        return await client
          .from("user_inventory")
          .update({
            quantity: inventoryResult.data.quantity + 1,
          })
          .eq("id", inventoryResult.data.id)
          .select("*")
          .single();
      });
    } else {
      // Otherwise, add item to inventory
      transaction = await executeDbOperation(async (client) => {
        return await client
          .from("user_inventory")
          .insert({
            user_id: userId,
            item_id: itemId,
            quantity: 1,
            is_equipped: false,
          })
          .select("*")
          .single();
      });
    }

    if (transaction.error) {
      return {
        success: false,
        message: "Failed to update inventory",
      };
    }

    // Deduct coins from player
    const coinResult = await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .update({
          coins: statsResult.data.coins - price,
        })
        .eq("user_id", userId)
        .select("coins")
        .single();
    });

    if (coinResult.error) {
      return {
        success: false,
        message: "Failed to update player coins",
      };
    }

    return {
      success: true,
      data: {
        item,
        price,
        remainingCoins: coinResult.data.coins,
        inventoryUpdate: transaction.data,
      },
    };
  } catch (error) {
    console.error("Error purchasing item:", error);
    return {
      success: false,
      message: "Error purchasing item: " + error.message,
    };
  }
};

/**
 * Use an item from inventory
 * @param {string} userId - User ID
 * @param {string} inventoryItemId - Inventory item ID
 * @returns {Object} - Result with success flag and effect data
 */
const useItem = async (userId, inventoryItemId) => {
  try {
    // Get the inventory item
    const inventoryResult = await executeDbOperation(async (client) => {
      return await client
        .from("user_inventory")
        .select("*, items(*)")
        .eq("id", inventoryItemId)
        .eq("user_id", userId) // Ensure the item belongs to this user
        .single();
    });

    if (inventoryResult.error || !inventoryResult.data) {
      return {
        success: false,
        message: "Inventory item not found or does not belong to you",
      };
    }

    const inventoryItem = inventoryResult.data;

    // Check if quantity is sufficient
    if (inventoryItem.quantity < 1) {
      return {
        success: false,
        message: "You do not have any of this item left",
      };
    }

    // Process the item effects based on its type
    const item = inventoryItem.items;
    let effectResult = {};

    if (item.item_type === "power-up") {
      // For power-ups, we might temporarily boost player stats
      // This would require a separate active_buffs table to track duration
      effectResult = {
        type: "power-up",
        effects: item.effects,
        message: `Used ${item.name} - effects active for ${
          item.effects.duration || 300
        } seconds`,
      };
    } else if (item.item_type === "tool") {
      // For tools, we might provide gameplay assistance
      effectResult = {
        type: "tool",
        effects: item.effects,
        message: `Used ${item.name} - ${item.description}`,
      };
    } else if (item.item_type === "cosmetic") {
      // For cosmetics, we might equip it
      if (!inventoryItem.is_equipped) {
        await executeDbOperation(async (client) => {
          // Unequip any other cosmetics of the same slot
          if (item.effects && item.effects.slot) {
            await client
              .from("user_inventory")
              .update({ is_equipped: false })
              .eq("user_id", userId)
              .eq("is_equipped", true)
              .filter("items.effects->slot", "eq", item.effects.slot);
          }

          // Equip this item
          return await client
            .from("user_inventory")
            .update({ is_equipped: true })
            .eq("id", inventoryItemId);
        });

        effectResult = {
          type: "cosmetic",
          effects: item.effects,
          message: `Equipped ${item.name}`,
        };
      } else {
        // If already equipped, unequip it
        await executeDbOperation(async (client) => {
          return await client
            .from("user_inventory")
            .update({ is_equipped: false })
            .eq("id", inventoryItemId);
        });

        effectResult = {
          type: "cosmetic",
          effects: item.effects,
          message: `Unequipped ${item.name}`,
        };
      }
    }

    // For consumable items, reduce quantity
    if (item.item_type !== "cosmetic") {
      await executeDbOperation(async (client) => {
        return await client
          .from("user_inventory")
          .update({
            quantity: inventoryItem.quantity - 1,
          })
          .eq("id", inventoryItemId);
      });
    }

    return {
      success: true,
      data: effectResult,
    };
  } catch (error) {
    console.error("Error using item:", error);
    return {
      success: false,
      message: "Error using item: " + error.message,
    };
  }
};

module.exports = {
  updatePlayerPosition,
  trackChallengeAttempt,
  completeChallenge,
  checkAndAwardAchievements,
  purchaseItem,
  useItem,
};
