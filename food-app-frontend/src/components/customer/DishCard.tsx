import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Dish } from '@/services/menuService';
import { useMeal } from '@/context/MealContext';

interface DishCardProps {
  dish: Dish;
}

const DishCard: React.FC<DishCardProps> = ({ dish }) => {
  const navigate = useNavigate();
  const { addToMeal } = useMeal();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCardClick = () => {
    navigate(`/dishes/${dish.id}`);
  };

  const handleAddToMeal = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToMeal(dish, 1);
  };

  const deliveryTimeText = dish.delivery_time
    ? `${dish.delivery_time} min`
    : dish.restaurant?.address
    ? 'Available'
    : '';

  return (
    <div
      className="flex-shrink-0 w-48 bg-card rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] cursor-pointer border border-border"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img
          src={
            dish.images && dish.images.length > 0
              ? dish.images[0]
              : `https://placehold.co/400x300/e0e0e0/555555?text=${dish.name.split(' ')[0]}`
          }
          alt={dish.name}
          className="w-full h-32 object-cover rounded-t-xl"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/400x300/e0e0e0/555555?text=Food';
          }}
        />
        <div className="relative">
          <button
            onClick={handleAddToMeal}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition duration-150 active:scale-95 z-10"
            aria-label={`Add ${dish.name} to my meal`}
          >
            <span className="font-bold">+</span>
          </button>
          {showTooltip && (
            <div className="absolute bottom-12 right-0 bg-popover text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap z-20 shadow-md border">
              Add to Meal
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-semibold truncate text-foreground">{dish.name}</h3>
          <p className="text-xs font-bold text-primary">
            UGX {dish.price.toLocaleString()}
          </p>
        </div>
        {dish.restaurant && (
          <p className="text-xs text-muted-foreground truncate mb-2">
            {dish.restaurant.name}
          </p>
        )}
        <div className="flex justify-between items-center text-xs">
          {dish.rating && (
            <span className="flex items-center text-accent font-medium">
              <Star size={10} className="mr-1 fill-accent" />
              {dish.rating}
            </span>
          )}
          {deliveryTimeText && (
            <span className="text-muted-foreground">{deliveryTimeText}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishCard;

