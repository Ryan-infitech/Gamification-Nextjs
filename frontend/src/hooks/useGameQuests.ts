import { useState, useEffect } from "react";
import { Quest, QuestObjective } from "@/types/phaser";
import { useAuth } from "./useAuth";

export const useGameQuests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchQuests = async () => {
      if (!isAuthenticated || !user) {
        setQuests([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // In a real implementation, you would fetch quests from your API
        // For now, we'll use placeholder data
        const response = await fetch("/api/game/quests");

        if (!response.ok) {
          throw new Error("Failed to fetch quests");
        }

        const data = await response.json();
        setQuests(data.quests);
      } catch (err) {
        console.error("Error fetching quests:", err);
        setError("Failed to load quests. Please try again.");

        // Use placeholder data for demo purposes
        setQuests([
          {
            id: "q1",
            title: "First Steps in Cyberspace",
            description:
              "Complete the tutorial to learn the basics of navigating the digital world and interacting with objects.",
            status: "active",
            objectives: [
              {
                id: "o1",
                description: "Speak to the Data Merchant",
                progress: 1,
                target: 1,
                type: "interact",
                completed: true,
              },
              {
                id: "o2",
                description: "Find the hidden security key",
                progress: 0,
                target: 1,
                type: "collect",
                completed: false,
              },
              {
                id: "o3",
                description: "Use the terminal to access the network",
                progress: 0,
                target: 1,
                type: "interact",
                completed: false,
              },
            ],
            rewards: [
              { type: "experience", amount: 100 },
              { type: "currency", amount: 50 },
            ],
          },
          {
            id: "q2",
            title: "Code Debugger",
            description:
              "Debug the faulty code in the main terminal to restore network access.",
            status: "available",
            objectives: [
              {
                id: "o4",
                description: "Locate the main terminal",
                progress: 0,
                target: 1,
                type: "location",
                completed: false,
              },
              {
                id: "o5",
                description: "Find and fix the syntax errors",
                progress: 0,
                target: 3,
                type: "code",
                completed: false,
              },
            ],
            rewards: [
              { type: "experience", amount: 150 },
              { type: "item", amount: 1, itemId: "debugger-tool" },
            ],
            level: 2,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuests();
  }, [isAuthenticated, user]);

  const acceptQuest = async (questId: string) => {
    if (!isAuthenticated) return false;

    try {
      // In a real implementation, you would make an API call to accept the quest
      // For now, we'll just update the local state
      setQuests((prevQuests) =>
        prevQuests.map((quest) =>
          quest.id === questId ? { ...quest, status: "active" } : quest
        )
      );

      return true;
    } catch (err) {
      console.error("Error accepting quest:", err);
      return false;
    }
  };

  const updateObjectiveProgress = async (
    questId: string,
    objectiveId: string,
    progress: number
  ) => {
    if (!isAuthenticated) return false;

    try {
      // In a real implementation, you would make an API call to update progress
      setQuests((prevQuests) =>
        prevQuests.map((quest) => {
          if (quest.id !== questId) return quest;

          const updatedObjectives = quest.objectives.map((obj) => {
            if (obj.id !== objectiveId) return obj;

            const newProgress = Math.min(obj.target, progress);
            const completed = newProgress >= obj.target;

            return {
              ...obj,
              progress: newProgress,
              completed,
            };
          });

          // Check if all objectives are completed
          const allCompleted = updatedObjectives.every((obj) => obj.completed);

          return {
            ...quest,
            objectives: updatedObjectives,
            status: allCompleted ? "completed" : quest.status,
          };
        })
      );

      return true;
    } catch (err) {
      console.error("Error updating objective progress:", err);
      return false;
    }
  };

  return {
    quests,
    isLoading,
    error,
    acceptQuest,
    updateObjectiveProgress,
  };
};
