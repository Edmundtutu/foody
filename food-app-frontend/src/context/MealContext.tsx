import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Dish, DishOption } from '@/services/menuService';

export interface MealItem {
  dish: Dish;
  quantity: number;
  selectedOptions: DishOption[];
}

interface MealContextType {
  mealItems: MealItem[];
  addToMeal: (dish: Dish, quantity?: number, selectedOptions?: DishOption[]) => void;
  removeFromMeal: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  updateOptions: (dishId: string, selectedOptions: DishOption[]) => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  clearMeal: () => void;
  getMealItem: (dishId: string) => MealItem | undefined;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

const STORAGE_KEY = 'food-app-meal';

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mealItems, setMealItems] = useState<MealItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMealItems(parsed);
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
    setMealItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.dish.id === dish.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          selectedOptions: selectedOptions.length > 0 ? selectedOptions : updated[existingIndex].selectedOptions,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, { dish, quantity, selectedOptions }];
      }
    });
  }, []);

  const removeFromMeal = useCallback((dishId: string) => {
    setMealItems((prev) => prev.filter((item) => item.dish.id !== dishId));
  }, []);

  const updateQuantity = useCallback((dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromMeal(dishId);
      return;
    }
    
    setMealItems((prev) =>
      prev.map((item) =>
        item.dish.id === dishId ? { ...item, quantity } : item
      )
    );
  }, [removeFromMeal]);

  const updateOptions = useCallback((dishId: string, selectedOptions: DishOption[]) => {
    setMealItems((prev) =>
      prev.map((item) =>
        item.dish.id === dishId ? { ...item, selectedOptions } : item
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

  const clearMeal = useCallback(() => {
    setMealItems([]);
  }, []);

  const getMealItem = useCallback((dishId: string) => {
    return mealItems.find((item) => item.dish.id === dishId);
  }, [mealItems]);

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
