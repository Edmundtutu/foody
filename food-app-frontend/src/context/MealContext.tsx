import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Dish, DishOption } from '@/services/menuService';

export interface MealItem {
  id: string;
  dish: Dish;
  quantity: number;
  selectedOptions: DishOption[];
}

interface MealContextType {
  mealItems: MealItem[];
  addToMeal: (dish: Dish, quantity?: number, selectedOptions?: DishOption[]) => void;
  removeFromMeal: (mealItemId: string) => void;
  updateQuantity: (mealItemId: string, quantity: number) => void;
  updateOptions: (mealItemId: string, selectedOptions: DishOption[]) => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  clearMeal: () => void;
  getMealItem: (mealItemId: string) => MealItem | undefined;
  getItemsByRestaurant: () => Record<string, MealItem[]>;
  getItemsForDish: (dishId: string) => MealItem[];
  getDishQuantity: (dishId: string) => number;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

const STORAGE_KEY = 'food-app-meal';

const generateMealItemId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `meal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mealItems, setMealItems] = useState<MealItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<MealItem & { id?: string }>;
        const normalized = parsed.map((item) => ({
          ...item,
          id: item.id || generateMealItemId(),
          selectedOptions: item.selectedOptions || [],
        }));
        setMealItems(normalized);
      }
    } catch (error) {
      console.error('Failed to load meal from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever mealItems changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mealItems));
    } catch (error) {
      console.error('Failed to save meal to localStorage:', error);
    }
  }, [mealItems]);

  const addToMeal = useCallback((dish: Dish, quantity: number = 1, selectedOptions: DishOption[] = []) => {
    setMealItems((prev) => [
      ...prev,
      {
        id: generateMealItemId(),
        dish,
        quantity,
        selectedOptions,
      },
    ]);
  }, []);

  const removeFromMeal = useCallback((mealItemId: string) => {
    setMealItems((prev) => prev.filter((item) => item.id !== mealItemId));
  }, []);

  const updateQuantity = useCallback((mealItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromMeal(mealItemId);
      return;
    }
    
    setMealItems((prev) =>
      prev.map((item) =>
        item.id === mealItemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromMeal]);

  const updateOptions = useCallback((mealItemId: string, selectedOptions: DishOption[]) => {
    setMealItems((prev) =>
      prev.map((item) =>
        item.id === mealItemId ? { ...item, selectedOptions } : item
      )
    );
  }, []);

  const getItemCount = useCallback(() => {
    return mealItems.reduce((total, item) => total + item.quantity, 0);
  }, [mealItems]);

  const getTotalPrice = useCallback(() => {
    return mealItems.reduce((total, item) => {
      const dishPrice = item.dish.price;
      const optionsPrice = item.selectedOptions.reduce((sum, option) => sum + option.extra_cost, 0);
      const itemTotal = (dishPrice + optionsPrice) * item.quantity;
      return total + itemTotal;
    }, 0);
  }, [mealItems]);

  const getItemsByRestaurant = useCallback(() => {
    const grouped: Record<string, MealItem[]> = {};
    mealItems.forEach((item) => {
      const restaurantId = item.dish.restaurant_id;
      if (!grouped[restaurantId]) {
        grouped[restaurantId] = [];
      }
      grouped[restaurantId].push(item);
    });
    return grouped;
  }, [mealItems]);

  const clearMeal = useCallback(() => {
    setMealItems([]);
  }, []);

  const getMealItem = useCallback((mealItemId: string) => {
    return mealItems.find((item) => item.id === mealItemId);
  }, [mealItems]);

  const getItemsForDish = useCallback((dishId: string) => {
    return mealItems.filter((item) => item.dish.id === dishId);
  }, [mealItems]);

  const getDishQuantity = useCallback((dishId: string) => {
    return getItemsForDish(dishId).reduce((total, item) => total + item.quantity, 0);
  }, [getItemsForDish]);

  const value: MealContextType = {
    mealItems,
    addToMeal,
    removeFromMeal,
    updateQuantity,
    updateOptions,
    getItemCount,
    getTotalPrice,
    clearMeal,
    getMealItem,
    getItemsByRestaurant,
    getItemsForDish,
    getDishQuantity,
  };

  return (
    <MealContext.Provider value={value}>
      {children}
    </MealContext.Provider>
  );
};

export const useMeal = () => {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error('useMeal must be used within a MealProvider');
  }
  return context;
};
