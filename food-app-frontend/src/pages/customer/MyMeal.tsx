import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeal } from '@/context/MealContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, UtensilsCrossed, ArrowLeft, Info } from 'lucide-react';
import orderService from '@/services/orderService';
import type { CreateOrderData } from '@/types/orders';
import type { MealItem } from '@/context/MealContext';
import RestaurantSectionsMobile from '@/components/customer/mymeal/RestaurantSectionsMobile';
import RestaurantSectionsDesktop from '@/components/customer/mymeal/RestaurantSectionsDesktop';
import ContactInformationCard from '@/components/customer/mymeal/ContactInformationCard';
import DeliveryOptionsCard from '@/components/customer/mymeal/DeliveryOptionsCard';

const MyMeal: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const {
        mealItems,
        removeFromMeal,
        updateQuantity,
        updateOptions,
        clearMeal,
        getItemCount,
        getTotalPrice,
        getItemsByRestaurant,
    } = useMeal();

    const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [customerEmail, setCustomerEmail] = useState(user?.email || '');
    const [customerName, setCustomerName] = useState(user?.name || '');
    const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
    const [expandedRestaurants, setExpandedRestaurants] = useState<Record<string, boolean>>({});
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const itemsByRestaurant = useMemo(() => getItemsByRestaurant(), [mealItems]);
    const restaurantEntries = useMemo(() => Object.entries(itemsByRestaurant), [itemsByRestaurant]);
    const restaurantCount = restaurantEntries.length;

    const toggleRestaurant = (restaurantId: string) => {
        setExpandedRestaurants(prev => ({
            ...prev,
            [restaurantId]: !prev[restaurantId]
        }));
    };

    const itemCount = getItemCount();
    const subtotal = useMemo(() => getTotalPrice(), [mealItems]);
    const deliveryFee = deliveryType === 'delivery' ? 5000 : 0;
    const total = subtotal + deliveryFee;

    const getItemTotal = (item: MealItem) => {
        const dishPrice = item.dish.price;
        const optionsPrice = item.selectedOptions.reduce((sum, option) => sum + option.extra_cost, 0);
        return (dishPrice + optionsPrice) * item.quantity;
    };

    const handleRemoveOption = (mealItemId: string, optionIdToRemove: string) => {
        const mealItem = mealItems.find(item => item.id === mealItemId);
        if (mealItem) {
            const updatedOptions = mealItem.selectedOptions.filter(opt => opt.id !== optionIdToRemove);
            updateOptions(mealItemId, updatedOptions);
        }
    };

    const handlePlaceOrder = async () => {
        if (!customerEmail.trim() || !customerName.trim()) {
            toast({
                title: 'Contact information required',
                description: 'Please provide your email and name',
                variant: 'destructive',
            });
            return;
        }

        if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
            toast({
                title: 'Delivery address required',
                description: 'Please enter your delivery address',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsProcessingOrder(true);

            // Create separate order payloads for each restaurant
            const orderPromises = Object.entries(itemsByRestaurant).map(([restaurantId, items]) => {
                const orderData: CreateOrderData = {
                    restaurant_id: restaurantId,
                    items: items.map(item => {
                        const dishPrice = item.dish.price;
                        const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.extra_cost, 0);
                        const unitPrice = dishPrice + optionsPrice;
                        const totalPrice = unitPrice * item.quantity;

                        return {
                            dish_id: item.dish.id,
                            quantity: item.quantity,
                            unit_price: unitPrice,
                            total_price: totalPrice,
                            options: item.selectedOptions.map(opt => ({
                                id: opt.id,
                                name: opt.name,
                                extra_cost: opt.extra_cost,
                            })),
                        };
                    }),
                    notes: notes.trim() || undefined,
                    delivery_address: deliveryType === 'delivery' ? deliveryAddress : undefined,
                };

                return orderService.createOrder(orderData);
            });

            // Place all orders in parallel
            await Promise.all(orderPromises);

            toast({
                title: 'Orders placed successfully!',
                description: `${restaurantCount} order(s) from ${restaurantCount} restaurant(s) have been placed.`,
            });
            clearMeal();
            navigate('/profile');
        } catch (error: any) {
            toast({
                title: 'Order failed',
                description: error?.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsProcessingOrder(false);
        }
    };

    if (itemCount === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card className="shadow-lg border-0">
                    <CardContent className="p-8 text-center">
                        <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Your meal is empty</h2>
                        <p className="text-muted-foreground mb-6">
                            Start adding dishes you crave to build your perfect meal
                        </p>
                        <Button onClick={() => navigate('/find-food')} size="lg">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Browse Dishes
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header Section */}
            <div className="text-left space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold">My Meal</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    {itemCount} dish{itemCount !== 1 ? 'es' : ''} from {restaurantCount} restaurant{restaurantCount !== 1 ? 's' : ''}
                </p>
            </div>

            {restaurantCount > 1 && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-900">
                                You're ordering from {restaurantCount} restaurants. We'll create separate orders for each restaurant when you place your order.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mobile Layout */}
            <div className="block lg:hidden space-y-6">
                <RestaurantSectionsMobile
                    restaurantEntries={restaurantEntries}
                    expandedRestaurants={expandedRestaurants}
                    onToggle={toggleRestaurant}
                    removeItem={removeFromMeal}
                    updateQuantity={updateQuantity}
                    removeOption={handleRemoveOption}
                    getItemTotal={getItemTotal}
                />

                <ContactInformationCard
                    variant="mobile"
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerEmail={customerEmail}
                    setCustomerEmail={setCustomerEmail}
                    customerPhone={customerPhone}
                    setCustomerPhone={setCustomerPhone}
                />

                <DeliveryOptionsCard
                    deliveryType={deliveryType}
                    setDeliveryType={setDeliveryType}
                    deliveryAddress={deliveryAddress}
                    setDeliveryAddress={setDeliveryAddress}
                    notes={notes}
                    setNotes={setNotes}
                    deliveryFee={deliveryFee}
                />

                {/* Order Summary */}
                <Card className="border-t-4 border-t-primary">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                            <span className="font-medium">UGX {subtotal.toLocaleString()}</span>
                        </div>

                        {deliveryFee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>Delivery Fee</span>
                                <span className="font-medium">UGX {deliveryFee.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg">UGX {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={clearMeal}
                        className="flex-1"
                        size="lg"
                    >
                        Clear Meal
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/find-food')}
                        className="flex-1"
                        size="lg"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Continue Browsing
                    </Button>
                </div>

                {/* Place Order Button - Sticky Bottom */}
                <div className="sticky bottom-0 bg-background border-t p-4 space-y-3 shadow-lg z-10">
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={
                            isProcessingOrder ||
                            (deliveryType === 'delivery' && !deliveryAddress.trim()) ||
                            !customerEmail.trim() ||
                            !customerName.trim()
                        }
                    >
                        {isProcessingOrder ? 'Processing...' : `Place Order - UGX ${total.toLocaleString()}`}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        You'll pay at pickup or delivery
                    </p>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block">
                <div className="flex gap-8">
                    {/* Left: Meal Items & Forms */}
                    <div className="flex-1 space-y-6">
                        <RestaurantSectionsDesktop
                            restaurantEntries={restaurantEntries}
                            removeItem={removeFromMeal}
                            updateQuantity={updateQuantity}
                            removeOption={handleRemoveOption}
                            getItemTotal={getItemTotal}
                        />

                        <ContactInformationCard
                            variant="desktop"
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            customerEmail={customerEmail}
                            setCustomerEmail={setCustomerEmail}
                            customerPhone={customerPhone}
                            setCustomerPhone={setCustomerPhone}
                        />

                        <DeliveryOptionsCard
                            deliveryType={deliveryType}
                            setDeliveryType={setDeliveryType}
                            deliveryAddress={deliveryAddress}
                            setDeliveryAddress={setDeliveryAddress}
                            notes={notes}
                            setNotes={setNotes}
                            deliveryFee={deliveryFee}
                        />
                    </div>

                    {/* Right: Order Summary */}
                    <div className="w-96 flex-shrink-0">
                        <div className="sticky top-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                                        <span className="font-medium">UGX {subtotal.toLocaleString()}</span>
                                    </div>

                                    {deliveryFee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span>Delivery Fee</span>
                                            <span className="font-medium">UGX {deliveryFee.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="font-bold text-lg">Total</span>
                                            <span className="font-bold text-lg">UGX {total.toLocaleString()}</span>
                                        </div>

                                        <Button
                                            className="w-full mb-3"
                                            size="lg"
                                            onClick={handlePlaceOrder}
                                            disabled={
                                                isProcessingOrder ||
                                                (deliveryType === 'delivery' && !deliveryAddress.trim()) ||
                                                !customerEmail.trim() ||
                                                !customerName.trim()
                                            }
                                        >
                                            {isProcessingOrder ? 'Processing...' : 'Place Order'}
                                        </Button>

                                        <p className="text-xs text-muted-foreground text-center mb-4">
                                            You'll pay at pickup or delivery
                                        </p>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={clearMeal}
                                                className="flex-1"
                                            >
                                                Clear
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate('/find-food')}
                                                className="flex-1"
                                            >
                                                Browse
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    };
export default MyMeal;

