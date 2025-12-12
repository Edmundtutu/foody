import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MealItem, DishMealItem, } from '@/context/MealContext';
import MealItemCard from './MealItemCard';
import ComboMealItemCard from './ComboMealItemCard';

interface RestaurantSectionsMobileProps {
  restaurantEntries: Array<[string, MealItem[]]>;
  expandedRestaurants: Record<string, boolean>;
  onToggle: (restaurantId: string) => void;
  removeItem: (mealItemId: string) => void;
  updateQuantity: (mealItemId: string, quantity: number) => void;
  removeOption: (mealItemId: string, optionId: string) => void;
  getItemTotal: (item: MealItem) => number;
}

const RestaurantSectionsMobile: React.FC<RestaurantSectionsMobileProps> = ({
  restaurantEntries,
  expandedRestaurants,
  onToggle,
  removeItem,
  updateQuantity,
  removeOption,
  getItemTotal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {restaurantEntries.map(([restaurantId, items]) => {
        // Get restaurant name from first dish item, or use generic label
        const firstDishItem = items.find(item => item.type === 'dish') as DishMealItem | undefined;
        const restaurantName = firstDishItem?.dish.restaurant?.name || 'Restaurant';
        const isExpanded = expandedRestaurants[restaurantId] !== false;

        return (
          <Card key={restaurantId} className="overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={() => navigate(`/restaurants/${restaurantId}`)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-primary">
                    {restaurantName[0]?.toUpperCase() || 'R'}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">
                    {restaurantName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
              <button
                onClick={() => onToggle(restaurantId)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="border-t space-y-3 p-3">
                {items.map((item) => (
                  item.type === 'dish' ? (
                    <MealItemCard
                      key={item.id}
                      item={item}
                      removeItem={removeItem}
                      updateQuantity={updateQuantity}
                      removeOption={removeOption}
                      getItemTotal={getItemTotal}
                    />
                  ) : (
                    <ComboMealItemCard
                      key={item.id}
                      item={item}
                      removeItem={removeItem}
                      updateQuantity={updateQuantity}
                      getItemTotal={getItemTotal}
                    />
                  )
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default RestaurantSectionsMobile;
