import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Check, BadgeAlert } from 'lucide-react';
import menuService from '@/services/menuService';
import restaurantService from '@/services/restaurantService';
import type { Combo, ComboGroup, ComboGroupItem, ComboPriceRequest } from '@/services/menuService';
import { useMeal, type ComboSelection } from '@/context/MealContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavbar } from '@/layouts/MainLayout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import Bowl from '@/assets/icons/bowl.svg?react';
import { getImageUrl } from '@/utils/pricingUtils';

// === TYPES ===
interface SelectionState {
    [groupId: string]: Array<{
        dish_id: string;
        option_ids: string[];
    }>;
}

// === DESKTOP COMPONENTS ===
interface DesktopDishCardProps {
    item: ComboGroupItem;
    isSelected: boolean;
    selectedOptions: string[]; // Array of selected option IDs
    onSelect: () => void;
    onToggleOption: (optionId: string) => void;
    isDisabled?: boolean;
}

const DesktopDishCard: React.FC<DesktopDishCardProps> = ({
    item,
    isSelected,
    selectedOptions,
    onSelect,
    onToggleOption,
    isDisabled
}) => {
    const basePrice = (item.dish?.price || 0) + item.extra_price;
    const optionsPrice = item.dish?.options?.reduce((sum, opt) =>
        selectedOptions.includes(opt.id) ? sum + opt.extra_cost : sum, 0
    ) || 0;
    const totalPrice = basePrice + optionsPrice;

    // Get hero image from dish images
    const imagesArray = item.dish?.images || [];
    const heroImage = imagesArray.length > 0 ? getImageUrl(imagesArray[0]) : null;

    return (
        <button
            onClick={onSelect}
            disabled={isDisabled}
            className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 text-left w-full overflow-hidden
        ${isSelected
                    ? 'border-primary shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        >
            {/* Hero Image Background with Overlay */}
            {heroImage ? (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImage})` }}
                >
                    {/* Dark overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
            )}
            
            {/* Content Overlay */}
            <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white drop-shadow-lg">{item.dish?.name}</h3>
                <div className="text-right">
                    <div className="font-bold text-white drop-shadow">
                        UGX {totalPrice.toLocaleString()}
                    </div>
                    {item.extra_price > 0 && (
                        <div className="text-xs text-blue-300 drop-shadow">
                            +UGX {item.extra_price.toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Dish Options */}
            {isSelected && item.dish?.options && item.dish.options.length > 0 && (
                <div className="mb-3 space-y-1">
                    {item.dish.options.map((option) => (
                        <label
                            key={option.id}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 p-2 rounded bg-white/80 hover:bg-white/90 transition-colors cursor-pointer backdrop-blur-sm"
                        >
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option.id)}
                                onChange={() => onToggleOption(option.id)}
                                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                            />
                            <span className="text-sm text-gray-800 flex-1 font-medium">
                                {option.name}
                            </span>
                            {option.extra_cost > 0 && (
                                <span className="text-xs text-primary font-bold">
                                    +UGX {option.extra_cost.toLocaleString()}
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                    {item.dish?.category?.name || 'Dish'}
                </span>
                {isSelected && (
                    <div className="flex items-center text-white drop-shadow">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-1 shadow-lg"></div>
                        <span className="text-sm font-bold">Selected</span>
                    </div>
                )}
            </div>
            </div>
        </button>
    );
};

interface DesktopComboGroupSectionProps {
    group: ComboGroup;
    selectedDishIds: string[];
    selections: SelectionState;
    onSelectionChange: (dishId: string) => void;
    onToggleOption: (dishId: string, optionId: string) => void;
}

const DesktopComboGroupSection: React.FC<DesktopComboGroupSectionProps> = ({
    group,
    selectedDishIds,
    selections,
    onSelectionChange,
    onToggleOption
}) => {
    const isAtMax = selectedDishIds.length >= group.allowed_max;
    const isAtMin = selectedDishIds.length >= group.allowed_min;

    return (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">
                            Selected: {selectedDishIds.length}/{group.allowed_max}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isAtMin ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {isAtMin ? '✓ Minimum met' : `Need ${group.allowed_min - selectedDishIds.length} more`}
                        </span>
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    Pick between {group.allowed_min} and {group.allowed_max} items
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items?.map((item) => {
                    const isSelected = selectedDishIds.includes(item.dish_id);
                    const isDisabled = isAtMax && !isSelected;
                    const selectedOptions = selections[group.id]?.find(s => s.dish_id === item.dish_id)?.option_ids || [];

                    return (
                        <DesktopDishCard
                            key={item.id}
                            item={item}
                            isSelected={isSelected}
                            selectedOptions={selectedOptions}
                            isDisabled={isDisabled}
                            onSelect={() => onSelectionChange(item.dish_id)}
                            onToggleOption={(optionId) => onToggleOption(item.dish_id, optionId)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// === MOBILE COMPONENTS ===
interface MobileDishCardProps {
    item: ComboGroupItem;
    isSelected: boolean;
    selectedOptions: string[];
    onSelect: () => void;
    onToggleOption: (optionId: string) => void;
    isDisabled?: boolean;
}

const MobileDishCard: React.FC<MobileDishCardProps> = ({
    item,
    isSelected,
    selectedOptions,
    onSelect,
    onToggleOption,
    isDisabled
}) => {
    const basePrice = (item.dish?.price || 0) + item.extra_price;
    const optionsPrice = item.dish?.options?.reduce((sum, opt) =>
        selectedOptions.includes(opt.id) ? sum + opt.extra_cost : sum, 0
    ) || 0;
    const totalPrice = basePrice + optionsPrice;

    // Get hero image from dish images
    const imagesArray = item.dish?.images || [];
    const heroImage = imagesArray.length > 0 ? getImageUrl(imagesArray[0]) : null;

    return (
        <button
            onClick={onSelect}
            disabled={isDisabled}
            className={`
        flex-shrink-0 w-40 p-3 mr-3 rounded-xl border-2 transition-all duration-200 flex flex-col overflow-hidden relative
        ${isSelected
                    ? 'border-primary shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            {/* Hero Image Background with Overlay */}
            {heroImage ? (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImage})` }}
                >
                    {/* Dark overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
            )}
            
            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-white text-sm leading-tight flex-1 drop-shadow-lg">{item.dish?.name}</h3>
                {isSelected && <div className="w-2 h-2 rounded-full flex-shrink-0 ml-1 bg-green-500 shadow-lg"></div>}
            </div>

            {/* Dish Options - Inline for mobile */}
            {isSelected && item.dish?.options && item.dish.options.length > 0 && (
                <div className="mb-2 space-y-1">
                    {item.dish.options.map((option) => (
                        <label
                            key={option.id}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs cursor-pointer bg-white/80 hover:bg-white/90 rounded p-1 backdrop-blur-sm"
                        >
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option.id)}
                                onChange={() => onToggleOption(option.id)}
                                className="w-3 h-3 text-primary rounded"
                            />
                            <span className="text-gray-800 flex-1 truncate font-medium">{option.name}</span>
                            {option.extra_cost > 0 && (
                                <span className="text-primary font-bold">+{option.extra_cost.toLocaleString()}</span>
                            )}
                        </label>
                    ))}
                </div>
            )}

            <span className="text-xs px-2 py-1 rounded-full bg-white/20 text-white border border-white/30 self-start mb-2 backdrop-blur-sm">
                {item.dish?.category?.name || 'Dish'}
            </span>

            <div className="text-right mt-auto">
                <div className="font-bold text-white text-base drop-shadow">
                    UGX {totalPrice.toLocaleString()}
                </div>
                {item.extra_price > 0 && (
                    <div className="text-xs text-blue-300 drop-shadow">
                        +UGX {item.extra_price.toLocaleString()}
                    </div>
                )}
            </div>
            </div>
        </button>
    );
};

interface MobileComboGroupSectionProps {
    group: ComboGroup;
    selectedDishIds: string[];
    selections: SelectionState;
    onSelectionChange: (dishId: string) => void;
    onToggleOption: (dishId: string, optionId: string) => void;
}

const MobileComboGroupSection: React.FC<MobileComboGroupSectionProps> = ({
    group,
    selectedDishIds,
    selections,
    onSelectionChange,
    onToggleOption
}) => {
    const isAtMax = selectedDishIds.length >= group.allowed_max;
    const isAtMin = selectedDishIds.length >= group.allowed_min;

    return (
        <div className="mb-6 pb-6 border-b border-gray-100 last:border-b-0">
            <div className="mb-3 px-1">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-gray-800">{group.name}</h3>
                    <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-gray-600">
                            {selectedDishIds.length}/{group.allowed_max}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isAtMin ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {isAtMin ? '✓' : `${group.allowed_min - selectedDishIds.length}`}
                        </span>
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    Pick {group.allowed_min}-{group.allowed_max} items
                </div>
            </div>

            <div className="flex overflow-x-auto pb-3 -mx-1 px-1 hide-scrollbar">
                {group.items?.map((item) => {
                    const isSelected = selectedDishIds.includes(item.dish_id);
                    const isDisabled = isAtMax && !isSelected;
                    const selectedOptions = selections[group.id]?.find(s => s.dish_id === item.dish_id)?.option_ids || [];

                    return (
                        <MobileDishCard
                            key={item.id}
                            item={item}
                            isSelected={isSelected}
                            selectedOptions={selectedOptions}
                            isDisabled={isDisabled}
                            onSelect={() => onSelectionChange(item.dish_id)}
                            onToggleOption={(optionId) => onToggleOption(item.dish_id, optionId)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

interface ComboPillProps {
    combo: Combo;
    isActive: boolean;
    onClick: () => void;
}

const ComboPill: React.FC<ComboPillProps> = ({ combo, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`
        flex-shrink-0 px-4 py-2 mr-2 rounded-full border transition-all duration-200
        ${isActive
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }
        `}
        >
            <div className="flex items-center">
                <div className="text-left">
                    <div className="font-medium text-sm text-gray-800">{combo.name}</div>
                    <div className="flex items-center mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full mr-1 ${combo.pricing_mode === 'FIXED' ? 'bg-green-100 text-green-800' :
                            combo.pricing_mode === 'DYNAMIC' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                            }`}>
                            {combo.pricing_mode}
                        </span>
                        <span className="text-xs text-gray-600">
                            UGX {combo.base_price.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

interface MobileBottomBarProps {
    isValid: boolean;
    totalPrice: number;
    totalSelected: number;
    onAddToMeal: () => void;
    isCalculating: boolean;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
    isValid,
    totalPrice,
    totalSelected,
    onAddToMeal,
    isCalculating
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-[100] lg:hidden">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-500">Total Price</div>
                    <div className="text-lg font-bold text-gray-900">
                        {isCalculating ? 'Calculating...' : `UGX ${totalPrice.toLocaleString()}`}
                    </div>
                </div>

                <Button
                    onClick={onAddToMeal}
                    disabled={!isValid || isCalculating}
                    className={`
            px-5 py-2.5 rounded-lg font-bold text-white transition-all
            ${isValid && !isCalculating
                            ? 'bg-primary hover:bg-primary/90 shadow-md'
                            : 'bg-gray-400 cursor-not-allowed'
                        }
            `}
                >
                    {isValid ? 'Add to Meal' : `${totalSelected} Selected`}
                </Button>
            </div>
        </div>
    );
};

// === MAIN COMPONENT ===

// === MAIN COMPONENT ===
const ComboBuilder: React.FC = () => {
    const { comboId } = useParams<{ comboId: string }>();
    const navigate = useNavigate();
    const { addComboToMeal, getItemCount } = useMeal();
    const mealItemCount = getItemCount();

    const { toast } = useToast();
    const { setMobileHeader, setHideMobileBottomNav } = useNavbar();

    const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
    const [selections, setSelections] = useState<SelectionState>({});
    const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
    const [showWarningDialog, setShowWarningDialog] = useState(false);
    const [underUtilizedGroupNames, setUnderUtilizedGroupNames] = useState<string>('');

    // Fetch the initial combo
    const { data: combo, isLoading: loadingCombo } = useQuery({
        queryKey: ['combo', comboId],
        queryFn: () => menuService.getCombo(comboId!),
        enabled: !!comboId,
    });

    // Fetch all combos from the restaurant (once we have restaurant_id)
    const { data: allCombos, isLoading: loadingCombos } = useQuery({
        queryKey: ['restaurant-combos', combo?.restaurant_id],
        queryFn: () => menuService.getRestaurantCombos(combo!.restaurant_id),
        enabled: !!combo?.restaurant_id,
    });

    // Fetch restaurant details to get the name
    const { data: restaurant } = useQuery({
        queryKey: ['restaurant', combo?.restaurant_id],
        queryFn: () => restaurantService.getRestaurant(combo!.restaurant_id),
        enabled: !!combo?.restaurant_id,
    });

    // Price calculation mutation
    const { mutate: calculatePrice, isPending: isCalculating } = useMutation({
        mutationFn: ({ comboId, request }: { comboId: string; request: ComboPriceRequest }) =>
            menuService.calculateComboPrice(comboId, request),
        onSuccess: (data) => {
            setCalculatedPrice(data.total);
        },
        onError: (error) => {
            console.error('Price calculation failed:', error);
            toast({
                title: 'Error',
                description: 'Failed to calculate combo price',
                variant: 'destructive',
            });
        },
    });

    // Initialize selections when combo changes
    useEffect(() => {
        if (selectedCombo) {
            const initialSelections: SelectionState = {};
            selectedCombo.groups?.forEach(group => {
                initialSelections[group.id] = [];
            });
            setSelections(initialSelections);
            setCalculatedPrice(selectedCombo.base_price);
        }
    }, [selectedCombo]);

    // Set initial combo
    useEffect(() => {
        if (combo) {
            setSelectedCombo(combo);
        }
    }, [combo]);

    // Setup custom mobile header and hide mobile bottom nav
    useEffect(() => {
        // Hide mobile bottom nav since we have our own bottom bar
        setHideMobileBottomNav(true);

        // Get restaurant name for display
        const restaurantName = restaurant?.name || 'Restaurant';

        // Set custom mobile header
        setMobileHeader(
            <div className="bg-white shadow-sm sticky top-0 z-40">
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(-1)}
                                className="h-8 w-8"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">What will you eat?</h1>
                                <p className="text-xs text-gray-600">Choose among each category</p>
                            </div>
                        </div>
                        <Link to="/my-meal" className="relative">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Bowl className="h-4 w-4" />
                            </Button>
                            {mealItemCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] p-0">
                                    {mealItemCount > 99 ? '99+' : mealItemCount}
                                </Badge>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Mobile Combo Pills Navigation */}
                {allCombos && allCombos.length > 1 && (
                    <div className="px-4 py-2">
                        <div className="text-xs text-gray-500 font-medium mb-1">
                            Available Combos at {restaurantName}:
                        </div>
                        <div className="flex overflow-x-auto pb-1 hide-scrollbar">
                            {allCombos.map((c) => (
                                <ComboPill
                                    key={c.id}
                                    combo={c}
                                    isActive={selectedCombo?.id === c.id}
                                    onClick={() => {
                                        setSelectedCombo(c);
                                        navigate(`/combos/${c.id}/builder`);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );

        // Cleanup on unmount
        return () => {
            setMobileHeader(null);
            setHideMobileBottomNav(false);
        };
    }, [allCombos, selectedCombo, mealItemCount, restaurant, navigate, setMobileHeader, setHideMobileBottomNav]);

    // Recalculate price when selections change (debounced)
    useEffect(() => {
        if (!selectedCombo) return;

        // Check if all groups meet minimum requirements before calculating
        const allGroupsMeetMin = selectedCombo.groups?.every(group => {
            const selectedCount = selections[group.id]?.length || 0;
            return selectedCount >= group.allowed_min;
        });

        if (!allGroupsMeetMin) {
            // Reset to base price if minimums not met
            setCalculatedPrice(selectedCombo.base_price);
            return;
        }

        const timer = setTimeout(() => {
            const request: ComboPriceRequest = {
                groups: selectedCombo.groups!.map(group => ({
                    group_id: group.id,
                    selected: selections[group.id] || [],
                })),
            };

            calculatePrice({ comboId: selectedCombo.id, request });
        }, 300);

        return () => clearTimeout(timer);
    }, [selections, selectedCombo]);

    const handleItemSelection = (groupId: string, dishId: string) => {
        setSelections(prev => {
            const currentSelections = prev[groupId] || [];
            const existingIndex = currentSelections.findIndex(s => s.dish_id === dishId);

            let newSelections: Array<{ dish_id: string; option_ids: string[] }>;
            if (existingIndex >= 0) {
                // Deselect - remove the item
                newSelections = currentSelections.filter(s => s.dish_id !== dishId);
            } else {
                // Select if not at max
                const group = selectedCombo?.groups?.find(g => g.id === groupId);
                if (group && currentSelections.length < group.allowed_max) {
                    newSelections = [...currentSelections, { dish_id: dishId, option_ids: [] }];
                } else {
                    return prev; // Cannot select more
                }
            }

            return {
                ...prev,
                [groupId]: newSelections,
            };
        });
    };

    const handleToggleOption = (groupId: string, dishId: string, optionId: string) => {
        setSelections(prev => {
            const currentSelections = prev[groupId] || [];
            const itemIndex = currentSelections.findIndex(s => s.dish_id === dishId);

            if (itemIndex === -1) {
                return prev; // Item not selected, shouldn't happen
            }

            const item = currentSelections[itemIndex];
            const optionIndex = item.option_ids.indexOf(optionId);

            let newOptionIds: string[];
            if (optionIndex >= 0) {
                // Remove option
                newOptionIds = item.option_ids.filter(id => id !== optionId);
            } else {
                // Add option
                newOptionIds = [...item.option_ids, optionId];
            }

            // Create a NEW item object (immutable update)
            const updatedItem = {
                ...item,
                option_ids: newOptionIds
            };

            // Create a NEW selections array with the updated item
            const updatedSelections = [
                ...currentSelections.slice(0, itemIndex),
                updatedItem,
                ...currentSelections.slice(itemIndex + 1)
            ];

            return {
                ...prev,
                [groupId]: updatedSelections,
            };
        });
    };

    const isComboValid = () => {
        if (!selectedCombo?.groups) return false;
        return selectedCombo.groups.every(group => {
            const selectedCount = selections[group.id]?.length || 0;
            return selectedCount >= group.allowed_min && selectedCount <= group.allowed_max;
        });
    };

    const handleAddToMeal = async () => {
        if (!selectedCombo || !isComboValid()) {
            toast({
                title: 'Incomplete Selection',
                description: 'Please complete all selections according to the requirements',
                variant: 'destructive',
            });
            return;
        }

        // Check if user is under-utilizing their allowance
        const underUtilizedGroups = selectedCombo.groups?.filter(group => {
            const selectedCount = selections[group.id]?.length || 0;
            return selectedCount >= group.allowed_min && selectedCount < group.allowed_max;
        });

        if (underUtilizedGroups && underUtilizedGroups.length > 0) {
            const groupNames = underUtilizedGroups.map(g => g.name).join(', ');
            setUnderUtilizedGroupNames(groupNames);
            setShowWarningDialog(true);
            return; // Show dialog instead of proceeding
        }

        // Proceed to add to meal
        await addComboToMealConfirmed();
    };

    const addComboToMealConfirmed = async () => {
        if (!selectedCombo) return;

        try {
            // Build payload for backend
            const request: ComboPriceRequest = {
                groups: selectedCombo.groups!.map(group => ({
                    group_id: group.id,
                    selected: selections[group.id] || [],
                })),
            };

            // Create combo selection on backend
            const comboSelection = await menuService.createComboSelection(selectedCombo.id, request);

            // Build ComboSelection format for MealContext
            const comboSelections: ComboSelection[] = selectedCombo.groups!.map(group => {
                const groupSelections = selections[group.id] || [];
                return {
                    group_id: group.id,
                    group_name: group.name,
                    selected: groupSelections.map(sel => {
                        const item = group.items?.find(i => i.dish_id === sel.dish_id);
                        return {
                            dish_id: sel.dish_id,
                            dish_name: item?.dish?.name || 'Unknown',
                            option_ids: sel.option_ids,
                        };
                    }),
                };
            });

            addComboToMeal(selectedCombo, comboSelection.id, comboSelections, calculatedPrice);

            toast({
                title: 'Added to Meal',
                description: `${selectedCombo.name} has been added to your meal. Continue customizing or view your meal.`,
                action: (
                    <ToastAction altText="View Meal" onClick={() => navigate('/my-meal')}>
                        View Meal
                    </ToastAction>
                ),
            });

            // Reset selections for this combo to allow adding another
            const freshSelections: SelectionState = {};
            selectedCombo.groups?.forEach(group => {
                freshSelections[group.id] = [];
            });
            setSelections(freshSelections);
            setCalculatedPrice(selectedCombo.base_price);

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.message || 'Failed to add combo to meal',
                variant: 'destructive',
            });
        }
    };

    const totalSelected = Object.values(selections).reduce(
        (sum, groupSelections) => sum + groupSelections.length,
        0
    );

    if (loadingCombo) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!combo || !selectedCombo) {
        return (
            <div className="min-h-screen bg-background p-8">
                <h1 className="text-2xl font-bold text-destructive">Combo not found</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 lg:bg-gray-50 pb-20 lg:pb-0">
            {/* MOBILE VIEW */}
            <div className="lg:hidden min-h-screen bg-gray-100">
                {/* Mobile Main Content */}
                <div className="p-4 space-y-4">
                    {/* Current Combo Info */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{selectedCombo.name}</h2>
                                <p className="text-sm text-gray-600 mt-1">{selectedCombo.description}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedCombo.pricing_mode === 'FIXED' ? 'bg-green-100 text-green-800' :
                                selectedCombo.pricing_mode === 'DYNAMIC' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                }`}>
                                {selectedCombo.pricing_mode}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                            <div>
                                <div className="text-xs text-gray-600">Base Price</div>
                                <div className="text-base font-bold text-gray-900">
                                    UGX {selectedCombo.base_price.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-600">Your Total</div>
                                <div className="text-lg font-bold text-primary">
                                    UGX {calculatedPrice.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Combo Builder Sections */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800 text-base">Select Your Items</h3>
                            <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                {totalSelected} selected
                            </div>
                        </div>

                        {selectedCombo.groups?.map(group => (
                            <MobileComboGroupSection
                                key={group.id}
                                group={group}
                                selectedDishIds={selections[group.id]?.map(s => s.dish_id) || []}
                                selections={selections}
                                onSelectionChange={(dishId) => handleItemSelection(group.id, dishId)}
                                onToggleOption={(dishId, optionId) => handleToggleOption(group.id, dishId, optionId)}
                            />
                        ))}

                        {/* Selection Summary */}
                        <div className="mt-6 pt-4 border-t-2 border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-1 h-5 bg-primary rounded"></div>
                                Your Selections
                            </h4>
                            {totalSelected > 0 ? (
                                <div className="space-y-2">
                                    {selectedCombo.groups?.map(group => {
                                        const selectedItems = selections[group.id] || [];
                                        return selectedItems.map(selection => {
                                            const item = group.items?.find(i => i.dish_id === selection.dish_id);
                                            if (!item) return null;

                                            const basePrice = (item.dish?.price || 0) + item.extra_price;
                                            const optionsPrice = item.dish?.options?.reduce((sum, opt) =>
                                                selection.option_ids.includes(opt.id) ? sum + opt.extra_cost : sum, 0
                                            ) || 0;
                                            const totalItemPrice = basePrice + optionsPrice;

                                            return (
                                                <div key={`${group.id}-${selection.dish_id}`} className="p-3 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-800 text-sm">{item.dish?.name}</div>
                                                            <div className="text-xs text-gray-500">{group.name}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-gray-900 text-sm">
                                                                UGX {totalItemPrice.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Show selected options if any */}
                                                    {selection.option_ids.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                            <div className="text-xs text-gray-600 font-medium mb-1">Options:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {selection.option_ids.map(optId => {
                                                                    const option = item.dish?.options?.find(o => o.id === optId);
                                                                    return option ? (
                                                                        <span key={optId} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                                                            {option.name} {option.extra_cost > 0 && `(+${option.extra_cost})`}
                                                                        </span>
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })}
                                </div>
                            ) : (
                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                    <p className="text-gray-500 text-sm italic">No items selected yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Start selecting items from the categories above</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar */}
                <MobileBottomBar
                    isValid={isComboValid()}
                    totalPrice={calculatedPrice}
                    totalSelected={totalSelected}
                    onAddToMeal={handleAddToMeal}
                    isCalculating={isCalculating}
                />
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden lg:block min-h-screen bg-gray-100 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Desktop Header */}
                    <header className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">What will you eat?</h1>
                                <p className="text-gray-600 mt-1">
                                    Choose among each category what best suits your taste
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Desktop Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">Available Combos at : </p>
                                    <h3 className="font-bold text-lg">
                                        {restaurant?.name || 'Restaurant'}
                                    </h3>
                                </div>

                                {loadingCombos ? (
                                    <p className="text-sm text-gray-500">Loading...</p>
                                ) : (
                                    <div className="space-y-2">
                                        {allCombos?.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedCombo(c);
                                                    navigate(`/combos/${c.id}/builder`);
                                                }}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${c.id === selectedCombo.id
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="font-medium text-sm mb-1">{c.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.pricing_mode === 'FIXED' ? 'bg-green-100 text-green-800' :
                                                        c.pricing_mode === 'DYNAMIC' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {c.pricing_mode}
                                                    </span>
                                                    <span className="text-xs text-gray-600">
                                                        UGX {c.base_price?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Desktop Price Summary */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
                                        <div className="text-sm text-gray-600 mb-1">Total Price</div>
                                        <div className="text-2xl font-bold text-gray-900 mb-3">
                                            {isCalculating ? (
                                                <span className="text-base">Calculating...</span>
                                            ) : (
                                                `UGX ${calculatedPrice.toLocaleString()}`
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleAddToMeal}
                                            disabled={!isComboValid() || isCalculating}
                                            className="w-full bg-primary hover:bg-primary/90"
                                        >
                                            <Check className="mr-2 h-4 w-4" />
                                            Add to Meal
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Main Area */}
                        <div className="lg:col-span-2">
                            {/* Combo Info Card */}
                            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 shadow-lg mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCombo.name}</h2>
                                        <p className="text-gray-700 mb-4">{selectedCombo.description}</p>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedCombo.pricing_mode === 'FIXED' ? 'bg-green-100 text-green-800' :
                                                selectedCombo.pricing_mode === 'DYNAMIC' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                {selectedCombo.pricing_mode}
                                            </span>
                                            <span className="text-gray-700">
                                                Base: UGX {selectedCombo.base_price.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Group Sections */}
                            {selectedCombo.groups?.map(group => (
                                <DesktopComboGroupSection
                                    key={group.id}
                                    group={group}
                                    selectedDishIds={selections[group.id]?.map(s => s.dish_id) || []}
                                    selections={selections}
                                    onSelectionChange={(dishId) => handleItemSelection(group.id, dishId)}
                                    onToggleOption={(dishId, optionId) => handleToggleOption(group.id, dishId, optionId)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Dialog */}
            <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <BadgeAlert className="h-5 w-5" />
                            Maximize Your Combo!
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You can select more items from: <strong>{underUtilizedGroupNames?.replace(/Pick\s+\d+(-\d+)?\s+(from\s+)?/gi, '') || 'some groups,'}</strong>.
                            <br /><br />
                            You're not maximizing your combo value. Do you want to proceed anyway or go back and select more items?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Select More Items</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            setShowWarningDialog(false);
                            await addComboToMealConfirmed();
                        }}>
                            Proceed Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ComboBuilder;