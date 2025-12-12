import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Dish, DishOption, Combo } from '@/services/menuService';

// Dish-based meal item
export interface DishMealItem {
  id: string;
  type: 'dish';
  dish: Dish;
  quantity: number;
  selectedOptions: DishOption[];
}

// Combo selection for meal
export interface ComboSelection {
  group_id: string;
  group_name: string;
  selected: Array<{
    dish_id: string;
    dish_name: string;
    option_ids: string[];
  }>;
}

// Combo-based meal item
export interface ComboMealItem {
  id: string;
  type: 'combo';
  combo: Combo;
  combo_selection_id: string; // Backend combo selection ID
  quantity: number;
  selections: ComboSelection[];
  total_price: number; // Calculated price from backend
}

// Union type for all meal items
export type MealItem = DishMealItem | ComboMealItem;

interface MealContextType {
  mealItems: MealItem[];
  addToMeal: (dish: Dish, quantity?: number, selectedOptions?: DishOption[]) => void;
  addComboToMeal: (combo: Combo, comboSelectionId: string, selections: ComboSelection[], totalPrice: number, quantity?: number) => void;
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
        type: 'dish' as const,
        dish,
        quantity,
        selectedOptions,
      },
    ]);
  }, []);

  const addComboToMeal = useCallback((
    combo: Combo,
    comboSelectionId: string,
    selections: ComboSelection[],
    totalPrice: number,
    quantity: number = 1
  ) => {
    setMealItems((prev) => [
      ...prev,
      {
        id: generateMealItemId(),
        type: 'combo' as const,
        combo,
        combo_selection_id: comboSelectionId,
        quantity,
        selections,
        total_price: totalPrice,
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
      if (item.type === 'dish') {
        const dishPrice = item.dish.price;
        const optionsPrice = item.selectedOptions.reduce((sum, option) => sum + option.extra_cost, 0);
        const itemTotal = (dishPrice + optionsPrice) * item.quantity;
        return total + itemTotal;
      } else {
        // Combo item - use pre-calculated total price
        return total + (item.total_price * item.quantity);
      }
    }, 0);
  }, [mealItems]);

  const getItemsByRestaurant = useCallback(() => {
    const grouped: Record<string, MealItem[]> = {};
    mealItems.forEach((item) => {
      const restaurantId = item.type === 'dish' ? item.dish.restaurant_id : item.combo.restaurant_id;
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
    return mealItems.filter((item) => item.type === 'dish' && item.dish.id === dishId) as DishMealItem[];
  }, [mealItems]);

  const getDishQuantity = useCallback((dishId: string) => {
    return getItemsForDish(dishId).reduce((total, item) => total + item.quantity, 0);
  }, [getItemsForDish]);

  const value: MealContextType = {
    mealItems,
    addToMeal,
    addComboToMeal,
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
