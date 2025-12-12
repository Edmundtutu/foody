import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { MealItem, DishMealItem, } from '@/context/MealContext';
import MealItemCard from './MealItemCard';
import ComboMealItemCard from './ComboMealItemCard';

interface RestaurantSectionsDesktopProps {
  restaurantEntries: Array<[string, MealItem[]]>;
  removeItem: (mealItemId: string) => void;
  updateQuantity: (mealItemId: string, quantity: number) => void;
  removeOption: (mealItemId: string, optionId: string) => void;
  getItemTotal: (item: MealItem) => number;
}

const RestaurantSectionsDesktop: React.FC<RestaurantSectionsDesktopProps> = ({
  restaurantEntries,
  removeItem,
  updateQuantity,
  removeOption,
  getItemTotal,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {restaurantEntries.map(([restaurantId, items]) => {
        // Get restaurant name from first dish item, or use generic label
        const firstDishItem = items.find(item => item.type === 'dish') as DishMealItem | undefined;
        const restaurantName = firstDishItem?.dish.restaurant?.name || 'Restaurant';

        return (
          <Card key={restaurantId}>
            <CardHeader className="pb-3">
              <button
                onClick={() => navigate(`/restaurants/${restaurantId}`)}
                className="w-full hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-primary">
                      {restaurantName[0]?.toUpperCase() || 'R'}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">
                      {restaurantName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

export default RestaurantSectionsDesktop;
