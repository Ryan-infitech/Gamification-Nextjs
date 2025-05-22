'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { InventoryItem, InventoryTab } from '@/types/ui';
import { cn } from '@/lib/utils';

interface InventoryPanelProps {
  /**
   * Array of items in inventory
   */
  items: InventoryItem[];
  /**
   * Max number of slots (default 24)
   */
  maxSlots?: number;
  /**
   * Handler untuk close panel
   */
  onClose?: () => void;
  /**
   * Handler ketika item digunakan
   */
  onItemUse?: (itemId: string) => void;
  /**
   * Handler ketika item dibuang
   */
  onItemDrop?: (itemId: string) => void;
  /**
   * Handler ketika item di-equip
   */
  onItemEquip?: (itemId: string, slot: string) => void;
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
 * Panel untuk menampilkan dan mengelola inventory player
 */
const InventoryPanel: React.FC<InventoryPanelProps> = ({
  items,
  maxSlots = 24,
  onClose,
  onItemUse,
  onItemDrop,
  onItemEquip,
  theme = 'dark',
  className,
}) => {
  // State untuk item yang sedang dipilih
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // State untuk tab aktif
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  
  // Ref untuk dropdown action menu
  const actionMenuRef = useRef<HTMLDivElement>(null);
  
  // Filters item berdasarkan tab aktif
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });
  
  // Generate empty slots untuk grid
  const emptySlots = maxSlots - filteredItems.length;
  const slots = [...filteredItems, ...Array(emptySlots > 0 ? emptySlots : 0).fill(null)];
  
  // Click handler untuk item
  const handleItemClick = (item: InventoryItem | null) => {
    if (!item) return;
    
    setSelectedItem(item === selectedItem ? null : item);
  };
  
  // Handler untuk aksi item
  const handleItemAction = (action: 'use' | 'drop' | 'info', item: InventoryItem) => {
    switch (action) {
      case 'use':
        onItemUse?.(item.id);
        break;
      case 'drop':
        onItemDrop?.(item.id);
        break;
      case 'info':
        // Show item info (could open a modal)
        break;
    }
    
    // Clear selection after action
    setSelectedItem(null);
  };
  
  // Close action menu ketika click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setSelectedItem(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div 
      className={cn(
        'inventory-panel w-[600px] bg-dark-800/95 rounded-lg border-2 border-pixel overflow-hidden',
        theme === 'dark' ? 'text-white' : 'text-gray-900',
        className
      )}
    >
      {/* Header */}
      <div className="panel-header flex justify-between items-center px-4 py-3 bg-dark-700">
        <h3 className="font-pixel text-lg text-white">Inventory</h3>
        <div className="flex gap-2">
          <span className="text-sm font-pixel-body text-white/80">
            {filteredItems.length}/{maxSlots} slots
          </span>
          <button 
            onClick={onClose}
            className="close-btn w-6 h-6 rounded-full bg-danger/80 hover:bg-danger flex items-center justify-center"
          >
            <span className="sr-only">Close</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L9 9M9 1L1 9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs-container flex border-b-2 border-dark-600">
        {(['all', 'consumable', 'equipment', 'quest', 'collectible'] as InventoryTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn px-4 py-2 font-pixel-body text-sm capitalize transition-colors ${
              activeTab === tab 
                ? 'bg-primary text-white' 
                : 'bg-dark-700 text-white/70 hover:bg-dark-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Items Grid */}
      <div className="items-grid grid grid-cols-6 gap-2 p-4 h-[320px] overflow-y-auto">
        {slots.map((item, index) => (
          <div 
            key={item ? `item-${item.id}` : `empty-${index}`}
            onClick={() => handleItemClick(item)}
            className={cn(
              'item-slot w-16 h-16 border-2 border-dark-600 rounded-md relative',
              item ? 'bg-dark-700 hover:border-primary cursor-pointer' : 'bg-dark-700/50',
              item && selectedItem?.id === item.id ? 'border-primary' : ''
            )}
          >
            {item && (
              <>
                <div className="item-image flex items-center justify-center w-full h-full">
                  <img 
                    src={item.icon || '/assets/ui/items/placeholder.png'} 
                    alt={item.name}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                
                {/* Quantity badge */}
                {item.quantity > 1 && (
                  <div className="quantity-badge absolute bottom-0 right-0 px-1 py-0.5 text-xs font-pixel-body bg-dark-900/80 text-white rounded-tl-md">
                    {item.quantity}
                  </div>
                )}
                
                {/* Rarity indicator */}
                <div className={cn(
                  'rarity-indicator absolute top-0 left-0 w-2 h-2 rounded-full',
                  item.rarity === 'common' ? 'bg-gray-400' :
                  item.rarity === 'uncommon' ? 'bg-green-400' :
                  item.rarity === 'rare' ? 'bg-blue-400' :
                  item.rarity === 'epic' ? 'bg-purple-400' :
                  'bg-yellow-400' // legendary
                )} />
                
                {/* Action menu for selected item */}
                {selectedItem?.id === item.id && (
                  <div ref={actionMenuRef} className="action-menu absolute z-10 -top-1 -right-32 w-28 bg-dark-800 border-2 border-dark-600 rounded-md shadow-lg">
                    <ul className="py-1">
                      {item.usable && (
                        <li>
                          <button 
                            onClick={() => handleItemAction('use', item)}
                            className="w-full text-left px-3 py-1 text-sm font-pixel-body text-white hover:bg-primary/30"
                          >
                            Use
                          </button>
                        </li>
                      )}
                      <li>
                        <button 
                          onClick={() => handleItemAction('info', item)}
                          className="w-full text-left px-3 py-1 text-sm font-pixel-body text-white hover:bg-primary/30"
                        >
                          Info
                        </button>
                      </li>
                      {item.droppable && (
                        <li>
                          <button 
                            onClick={() => handleItemAction('drop', item)}
                            className="w-full text-left px-3 py-1 text-sm font-pixel-body text-danger hover:bg-danger/30"
                          >
                            Drop
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Item Details (shown when item is selected) */}
      <div className="item-details px-4 py-3 border-t-2 border-dark-600">
        {selectedItem ? (
          <div className="flex gap-4">
            <div className="item-image flex-shrink-0 w-16 h-16 border-2 border-dark-600 rounded-md bg-dark-700 flex items-center justify-center">
              <img 
                src={selectedItem.icon || '/assets/ui/items/placeholder.png'} 
                alt={selectedItem.name}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="item-info flex-grow">
              <h4 className={cn(
                'font-pixel text-sm',
                selectedItem.rarity === 'common' ? 'text-gray-200' :
                selectedItem.rarity === 'uncommon' ? 'text-green-400' :
                selectedItem.rarity === 'rare' ? 'text-blue-400' :
                selectedItem.rarity === 'epic' ? 'text-purple-400' :
                'text-yellow-400' // legendary
              )}>
                {selectedItem.name}
              </h4>
              <p className="text-xs font-pixel-body text-white/80 mt-1">
                {selectedItem.description || 'No description available.'}
              </p>
              {selectedItem.effects && selectedItem.effects.length > 0 && (
                <p className="text-xs font-pixel-body text-primary mt-1">
                  {selectedItem.effects.map(effect => 
                    `${effect.type}: +${effect.value}`
                  ).join(', ')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm font-pixel-body text-white/60 text-center">
            Select an item to view details
          </p>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;
