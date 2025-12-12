import React from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ComboMealItem } from '@/context/MealContext';

interface ComboMealItemCardProps {
    item: ComboMealItem;
    removeItem: (mealItemId: string) => void;
    updateQuantity: (mealItemId: string, quantity: number) => void;
    getItemTotal: (item: ComboMealItem) => number;
}

const ComboMealItemCard: React.FC<ComboMealItemCardProps> = ({
    item,
    removeItem,
    updateQuantity,
    getItemTotal,
}) => {
    const itemTotal = getItemTotal(item);
    const unitPrice = item.total_price;

    return (
        <Card className="mb-3 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{item.combo.name}</h3>
                            <Badge
                                variant="secondary"
                                className={`text-xs px-2 py-0.5 ${item.combo.pricing_mode === 'FIXED'
                                        ? 'bg-green-100 text-green-800'
                                        : item.combo.pricing_mode === 'DYNAMIC'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-purple-100 text-purple-800'
                                    }`}
                            >
                                {item.combo.pricing_mode}
                            </Badge>
                        </div>
                        {item.combo.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.combo.description}</p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Selections grouped by combo group */}
                <div className="space-y-2 mb-3 pl-2 border-l-2 border-blue-200">
                    {item.selections.map((selection) => (
                        <div key={selection.group_id} className="ml-2">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                                {selection.group_name}:
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {selection.selected.map((dish) => (
                                    <div key={dish.dish_id} className="flex flex-col gap-0.5">
                                        <Badge variant="secondary" className="text-xs">
                                            {dish.dish_name}
                                        </Badge>
                                        {dish.option_ids.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 ml-1">
                                                {dish.option_ids.map((optionId) => (
                                                    <Badge
                                                        key={optionId}
                                                        variant="outline"
                                                        className="text-xs px-1 py-0"
                                                    >
                                                        +option
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quantity controls and pricing */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-gray-500">
                            UGX {unitPrice.toLocaleString()} × {item.quantity}
                        </div>
                        <div className="text-base font-bold text-gray-900">
                            UGX {itemTotal.toLocaleString()}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ComboMealItemCard;
