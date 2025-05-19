import React, { useState } from "react";
import { Quest } from "@/types/phaser";

interface GameQuestsProps {
  onClose: () => void;
  quests?: Quest[];
}

const GameQuests: React.FC<GameQuestsProps> = ({ onClose, quests = [] }) => {
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  const placeholderQuests: Quest[] = [
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
    {
      id: "q3",
      title: "Digital Defenders",
      description:
        "Eliminate the rogue AI processes that are corrupting the system.",
      status: "completed",
      objectives: [
        {
          id: "o6",
          description: "Defeat corrupted processes",
          progress: 5,
          target: 5,
          type: "kill",
          completed: true,
        },
        {
          id: "o7",
          description: "Upload the antivirus program",
          progress: 1,
          target: 1,
          type: "interact",
          completed: true,
        },
      ],
      rewards: [
        { type: "experience", amount: 200 },
        { type: "currency", amount: 100 },
        { type: "skill", amount: 1 },
      ],
    },
  ];

  const displayQuests = quests.length > 0 ? quests : placeholderQuests;
  const selectedQuest =
    displayQuests.find((q) => q.id === selectedQuestId) || displayQuests[0];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 pointer-events-auto">
      <div className="w-full max-w-3xl h-3/4 bg-[var(--dark-surface)] border border-[var(--neon-pink)] rounded p-4 flex flex-col pixel-corners">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-[var(--light-surface)] pb-2">
          <h3 className="text-lg font-mono text-[var(--neon-pink)]">
            QUEST LOG
          </h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>
            X
          </button>
        </div>

        {/* Quest interface */}
        <div className="flex flex-1 gap-4">
          {/* Quest list */}
          <div className="w-1/3 border-r border-[var(--light-surface)] pr-2 overflow-y-auto">
            {displayQuests.map((quest) => (
              <div
                key={quest.id}
                className={`mb-2 p-2 border ${
                  selectedQuestId === quest.id
                    ? "border-[var(--neon-pink)]"
                    : "border-[var(--light-surface)]"
                } rounded cursor-pointer hover:bg-[var(--dark-bg)] transition`}
                onClick={() => setSelectedQuestId(quest.id)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">{quest.title}</h4>
                  <span
                    className={`text-xs px-1 rounded ${
                      quest.status === "available"
                        ? "bg-gray-600 text-gray-200"
                        : quest.status === "active"
                        ? "bg-blue-600 text-white"
                        : quest.status === "completed"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {quest.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {quest.description}
                </p>
              </div>
            ))}
          </div>

          {/* Quest details */}
          <div className="flex-1 overflow-y-auto">
            {selectedQuest ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[var(--neon-pink)]">
                    {selectedQuest.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      selectedQuest.status === "available"
                        ? "bg-gray-600 text-gray-200"
                        : selectedQuest.status === "active"
                        ? "bg-blue-600 text-white"
                        : selectedQuest.status === "completed"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {selectedQuest.status}
                  </span>
                </div>

                <p className="text-gray-300 mb-4">
                  {selectedQuest.description}
                </p>

                {selectedQuest.level && (
                  <div className="mb-4 text-sm">
                    <span className="text-gray-400">Recommended Level: </span>
                    <span className="text-[var(--neon-blue)]">
                      {selectedQuest.level}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-2 text-[var(--neon-blue)]">
                    Objectives:
                  </h4>
                  <ul className="space-y-2">
                    {selectedQuest.objectives.map((objective) => (
                      <li
                        key={objective.id}
                        className={`flex items-center p-2 bg-[var(--dark-bg)] rounded ${
                          objective.completed
                            ? "border-l-2 border-green-500"
                            : "border-l-2 border-gray-500"
                        }`}
                      >
                        <div className="flex-1">
                          <p
                            className={
                              objective.completed
                                ? "text-gray-400 line-through"
                                : "text-white"
                            }
                          >
                            {objective.description}
                          </p>
                          {objective.progress < objective.target && (
                            <div className="mt-1 text-xs">
                              <div className="h-1 w-full bg-gray-700 rounded">
                                <div
                                  className="h-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-pink)]"
                                  style={{
                                    width: `${
                                      (objective.progress / objective.target) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                              <div className="text-right text-gray-500 mt-0.5">
                                {objective.progress}/{objective.target}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          {objective.completed ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-green-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-2 text-[var(--neon-green)]">
                    Rewards:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedQuest.rewards.map((reward, index) => (
                      <div
                        key={index}
                        className="flex items-center p-2 bg-[var(--dark-bg)] rounded"
                      >
                        <div className="w-8 h-8 flex items-center justify-center mr-2 bg-[var(--dark-surface)] rounded">
                          {reward.type === "experience" && (
                            <span className="text-[var(--neon-blue)]">XP</span>
                          )}
                          {reward.type === "currency" && (
                            <span className="text-[var(--neon-pink)]">₡</span>
                          )}
                          {reward.type === "item" && (
                            <span className="text-[var(--neon-green)]">I</span>
                          )}
                          {reward.type === "skill" && (
                            <span className="text-[var(--neon-yellow)]">S</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm">
                            {reward.type === "experience" &&
                              `${reward.amount} XP`}
                            {reward.type === "currency" &&
                              `${reward.amount} Credits`}
                            {reward.type === "item" &&
                              `${reward.amount} Item${
                                reward.amount > 1 ? "s" : ""
                              }`}
                            {reward.type === "skill" &&
                              `${reward.amount} Skill Point${
                                reward.amount > 1 ? "s" : ""
                              }`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedQuest.status === "available" && (
                  <div className="mt-6 text-center">
                    <button
                      className="cyber-button px-4 py-2"
                      onClick={() =>
                        console.log("Accept quest:", selectedQuest.id)
                      }
                    >
                      ACCEPT QUEST
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Select a quest to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameQuests;
