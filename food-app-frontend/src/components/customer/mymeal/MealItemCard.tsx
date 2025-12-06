import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Trash2, Minus, Plus, UtensilsCrossed } from 'lucide-react';
import type { MealItem } from '@/context/MealContext';

interface MealItemCardProps {
  item: MealItem;
  removeItem: (mealItemId: string) => void;
  updateQuantity: (mealItemId: string, quantity: number) => void;
  removeOption: (mealItemId: string, optionId: string) => void;
  getItemTotal: (item: MealItem) => number;
}

const MealItemCard: React.FC<MealItemCardProps> = ({
  item,
  removeItem,
  updateQuantity,
  removeOption,
  getItemTotal,
}) => {
  const navigate = useNavigate();
  const unitPrice = item.dish.price + item.selectedOptions.reduce((sum, opt) => sum + opt.extra_cost, 0);

  return (
    <div className="flex gap-4 p-4 rounded-lg border hover:bg-muted/10 transition-colors">
      {/* Dish Image */}
      <div className="relative w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        {item.dish.images?.[0] ? (
          <img
            src={item.dish.images[0]}
            alt={item.dish.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      {/* Dish Details */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-start justify-between">
          <button
            onClick={() => navigate(`/dishes/${item.dish.id}`)}
            className="flex-1 text-left hover:underline"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-semibold truncate">{item.dish.name}</h3>
              {item.dish.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {item.dish.description}
                </p>
              )}
            </div>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {/* Selected Options Pills */}
        {item.selectedOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.selectedOptions.map((option) => (
              <Badge
                key={option.id}
                variant="secondary"
                className="text-xs pl-2 pr-1 py-0.5 gap-1 hover:bg-destructive/10 transition-colors group"
              >
                <span className="max-w-[120px] truncate">
                  {option.name}
                  {option.extra_cost > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      +{option.extra_cost.toLocaleString()}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => removeOption(item.id, option.id)}
                  className="h-3.5 w-3.5 rounded-full hover:bg-destructive/20 flex items-center justify-center transition-colors"
                  aria-label={`Remove ${option.name}`}
                >
                  <X className="h-2.5 w-2.5 text-muted-foreground group-hover:text-destructive" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="font-bold">UGX {getItemTotal(item).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {item.quantity} × UGX {unitPrice.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealItemCard;
