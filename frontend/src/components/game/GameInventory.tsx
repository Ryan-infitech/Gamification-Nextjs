import React from "react";
import { InventoryItem } from "@/types/phaser";

interface GameInventoryProps {
  onClose: () => void;
  items?: InventoryItem[];
}

const GameInventory: React.FC<GameInventoryProps> = ({
  onClose,
  items = [],
}) => {
  const placeholder: InventoryItem[] = [
    {
      id: "1",
      name: "Energy Cell",
      description: "A small energy cell that can power basic tech devices.",
      type: "consumable",
      rarity: "common",
      quantity: 5,
      icon: "energy-cell",
      usable: true,
      equippable: false,
    },
    {
      id: "2",
      name: "Hack Chip",
      description: "Basic hacking tool for bypassing level 1 security systems.",
      type: "key",
      rarity: "uncommon",
      quantity: 2,
      icon: "hack-chip",
      usable: true,
      equippable: false,
    },
    {
      id: "3",
      name: "Neuromesh Jacket",
      description: "Armored jacket with basic neural interface capabilities.",
      type: "armor",
      rarity: "rare",
      quantity: 1,
      icon: "jacket",
      stats: {
        defense: 5,
        hacking: 2,
      },
      usable: false,
      equippable: true,
      equipped: true,
    },
  ];

  const displayItems = items.length > 0 ? items : placeholder;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 pointer-events-auto">
      <div className="w-full max-w-2xl bg-[var(--dark-surface)] border border-[var(--neon-blue)] rounded p-4 pixel-corners">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-[var(--light-surface)] pb-2">
          <h3 className="text-lg font-mono text-[var(--neon-blue)]">
            INVENTORY SYSTEM
          </h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>
            X
          </button>
        </div>

        {/* Inventory slots */}
        <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`p-2 border ${
                item.equipped
                  ? "border-[var(--neon-pink)]"
                  : "border-[var(--light-surface)]"
              } rounded aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--dark-bg)] transition`}
            >
              <div
                className={`w-10 h-10 mb-1 flex items-center justify-center ${
                  item.rarity === "common"
                    ? "bg-gray-600"
                    : item.rarity === "uncommon"
                    ? "bg-green-700"
                    : item.rarity === "rare"
                    ? "bg-blue-700"
                    : item.rarity === "epic"
                    ? "bg-purple-700"
                    : "bg-yellow-600"
                } rounded`}
              >
                {/* Placeholder for item icon */}
                <span className="text-lg">
                  {item.icon.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-xs truncate w-full text-center">
                {item.name}
              </div>
              <div className="text-xs text-gray-400">x{item.quantity}</div>
            </div>
          ))}

          {/* Empty slots */}
          {Array(24 - displayItems.length)
            .fill(0)
            .map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-2 border border-[var(--dark-bg)] rounded aspect-square flex items-center justify-center cursor-default"
              >
                <div className="w-full h-full bg-[var(--dark-bg)] rounded-sm opacity-30"></div>
              </div>
            ))}
        </div>

        {/* Stats */}
        <div className="mt-4 border-t border-[var(--light-surface)] pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-[var(--neon-blue)] mb-1">
                EQUIPPED GEAR
              </h4>
              <div className="text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Armor:</span>
                  <span>5</span>
                </div>
                <div className="flex justify-between">
                  <span>Hacking:</span>
                  <span>2</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm text-[var(--neon-pink)] mb-1">
                CARRY CAPACITY
              </h4>
              <div className="h-2 bg-[var(--dark-bg)] rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-pink)]"
                  style={{ width: "30%" }}
                />
              </div>
              <div className="text-xs text-right text-gray-400 mt-1">
                7/24 slots used
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInventory;
