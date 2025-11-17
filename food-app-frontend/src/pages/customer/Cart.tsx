import React from 'react';
import { useCart } from '@/context/CartContext.tsx';

const Cart: React.FC = () => {
    const { getItemCount } = useCart();
    const itemCount = getItemCount();

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Shopping Cart</h1>
                {itemCount > 0 ? (
                    <p className="text-muted-foreground mb-4">
                        You have {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart.
                    </p>
                ) : (
                    <p className="text-muted-foreground mb-4">
                        Your cart is empty.
                    </p>
                )}
                <p className="text-muted-foreground">
                    Cart management. Content to be implemented.
                </p>
            </div>
        </div>
    );
};

export default Cart;

