import React from 'react';
import { useMeal } from '@/context/MealContext';

const MyMeal: React.FC = () => {
    const { getItemCount } = useMeal();
    const itemCount = getItemCount();

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">My Meal</h1>
                {itemCount > 0 ? (
                    <p className="text-muted-foreground mb-4">
                        Your meal has {itemCount} dish{itemCount !== 1 ? 'es' : ''} ready to review.
                    </p>
                ) : (
                    <p className="text-muted-foreground mb-4">
                        Your meal is empty. Start adding dishes you crave.
                    </p>
                )}
                <p className="text-muted-foreground">
                    Meal review and customization. Content to be implemented.
                </p>
            </div>
        </div>
    );
};

export default MyMeal;

