import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Dish } from '@/services/menuService';
import DishSelector from './DishSelector';

interface DishSelectorModalProps {
  isOpen: boolean;
  dishes: Dish[];
  selectedDishes: string[];
  groupName?: string;
  hasFilteredCategories?: boolean;
  onDishToggle: (dishId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const DishSelectorModal: React.FC<DishSelectorModalProps> = ({
  isOpen,
  dishes,
  selectedDishes,
  groupName,
  hasFilteredCategories,
  onDishToggle,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Select Dishes{groupName && ` for ${groupName}`}
              {hasFilteredCategories && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Filtered by suggested categories)
                </span>
              )}
            </h3>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-180px)]">
          <DishSelector
            dishes={dishes}
            selectedDishes={selectedDishes}
            onDishToggle={onDishToggle}
          />
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedDishes.length} dish{selectedDishes.length !== 1 ? 'es' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onConfirm} disabled={selectedDishes.length === 0}>
                Add {selectedDishes.length > 0 && `(${selectedDishes.length})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishSelectorModal;
