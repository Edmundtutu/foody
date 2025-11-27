import React, { createContext, useContext } from 'react';

interface MealContextType {
  getItemCount: () => number;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getItemCount = () => 0; // Stub implementation

  return (
    <MealContext.Provider value={{ getItemCount }}>
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
