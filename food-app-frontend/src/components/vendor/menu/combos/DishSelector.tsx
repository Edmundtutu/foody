import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { Dish } from '@/services/menuService';

interface DishSelectorProps {
  dishes: Dish[];
  selectedDishes: string[];
  onDishToggle: (dishId: string) => void;
  categoryFilter?: string;
}

const DishSelector: React.FC<DishSelectorProps> = ({
  dishes,
  selectedDishes,
  onDishToggle,
  categoryFilter,
}) => {
  const filteredDishes = categoryFilter
    ? dishes.filter(dish => dish.category?.name === categoryFilter)
    : dishes;

  return (
    <div className="max-h-60 overflow-y-auto border rounded-lg">
      {filteredDishes.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No dishes available{categoryFilter ? ` in ${categoryFilter}` : ''}
        </div>
      ) : (
        filteredDishes.map(dish => (
          <div
            key={dish.id}
            className={`flex items-center justify-between p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer ${
              selectedDishes.includes(dish.id) ? 'bg-blue-50' : ''
            }`}
            onClick={() => onDishToggle(dish.id)}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{dish.name}</p>
                  <p className="text-xs text-gray-500">{dish.category?.name || 'No category'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">UGX {dish.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    {!dish.available && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`ml-4 w-5 h-5 rounded border flex items-center justify-center ${
                selectedDishes.includes(dish.id)
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300'
              }`}
            >
              {selectedDishes.includes(dish.id) && <Check className="h-3 w-3 text-white" />}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DishSelector;
