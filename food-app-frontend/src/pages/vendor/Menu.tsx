import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Utensils,
  Package,
  AlertCircle,
  ChefHat,
  Upload,
  X,
  Star,
  Image as ImageIcon,
  Menu,
  Search,
  Check,
  Copy,
  MoreVertical,
  Download,
  FileText,
} from 'lucide-react';
import { useVendor } from '@/context/VendorContext';
import {
  useMenuCategories,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
} from '@/hooks/queries/useMenuCategories';
import {
  useDishes,
  useCreateDish,
  useUpdateDish,
  useDeleteDish,
} from '@/hooks/queries/useDishes';
import {
  useRestaurantCombos,
  useCreateCombo,
  useUpdateCombo,
  useDeleteCombo,
  useCreateComboGroup,
  useUpdateComboGroup,
  useDeleteComboGroup,
  useCreateComboGroupItem,
  useDeleteComboGroupItem,
} from '@/hooks/queries/useCombos';
import { useCreateNode } from '@/hooks/queries/useKitchenNodes';
import { MenuItemsSkeleton } from '@/components/vendor/LoadingSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { MenuCategory, Dish, Combo } from '@/services/menuService';
import kitchenService from '@/services/kitchenService';
import uploadService from '@/services/uploadService';

interface CategoryFormData {
  name: string;
  description?: string;
  display_order?: number;
  color_code?: string;
}

interface DishFormData {
  name: string;
  description?: string;
  category_id: string;
  price: number;
  unit?: string;
  available: boolean;
  addToKitchen?: boolean;
  images?: string[];
}

// Helper function to format date from ISO string to readable format
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // If URL is already absolute (starts with http:// or https://), use it directly
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If relative URL (shouldn't happen if backend is correct, but handle as fallback)
  // Only prepend if it's a relative path starting with /storage
  if (url.startsWith('/storage/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${apiBaseUrl}${url}`;
  }
  // If it's a malformed URL or just a path, return null to avoid broken images
  return null;
};

// ========== COMBO COMPONENTS ==========
interface ComboCardProps {
  combo: Combo;
  dishes: Dish[];
  onEdit: (combo: Combo) => void;
  onDuplicate: (combo: Combo) => void;
  onToggleStatus: (comboId: string) => void;
  onDelete: (comboId: string) => void;
}

const ComboCard: React.FC<ComboCardProps> = ({ combo, onEdit, onDuplicate, onToggleStatus, onDelete }) => {

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full border">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-800">{combo.name}</h3>
              <Badge
                variant={combo.available ? "default" : "secondary"}
                className={combo.available ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {combo.available ? 'Active' : 'Inactive'}
              </Badge>
              <Badge
                variant="outline"
                className={`
                  ${combo.pricing_mode === 'FIXED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${combo.pricing_mode === 'DYNAMIC' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${combo.pricing_mode === 'HYBRID' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                `}
              >
                {combo.pricing_mode}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{combo.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Base Price</p>
            <p className="font-bold text-gray-800">UGX {combo.base_price.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Groups</p>
            <p className="font-bold text-gray-800">{combo.groups?.length || 0}</p>
          </div>
        </div>

        {combo.groups && combo.groups.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Groups</p>
            <div className="space-y-1">
              {combo.groups.slice(0, 2).map(group => (
                <div key={group.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium text-gray-700 truncate">{group.name}</span>
                  <span className="text-xs text-gray-500">
                    {group.items?.length || 0} items
                  </span>
                </div>
              ))}
              {combo.groups.length > 2 && (
                <div className="text-center text-xs text-gray-500 py-1">
                  +{combo.groups.length - 2} more groups
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-gray-500">
            Updated: {formatDate(combo.updated_at)}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(combo)}
              title="Edit Combo"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDuplicate(combo)}
              title="Duplicate Combo"
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleStatus(combo.id)}
              title={combo.available ? 'Deactivate' : 'Activate'}
            >
              {combo.available ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(combo.id)}
              title="Delete Combo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface DishSelectorProps {
  dishes: Dish[];
  selectedDishes: string[];
  onDishToggle: (dishId: string) => void;
  categoryFilter?: string;
}

const DishSelector: React.FC<DishSelectorProps> = ({ dishes, selectedDishes, onDishToggle, categoryFilter }) => {
  const filteredDishes = categoryFilter
    ? dishes.filter(dish => dish.category?.name === categoryFilter)
    : dishes;

  return (
    <div className="max-h-60 overflow-y-auto border rounded-lg">
      {filteredDishes.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No dishes available{categoryFilter ? ` in ${categoryFilter}` : ''}
        </div>
      ) : (
        filteredDishes.map(dish => (
          <div
            key={dish.id}
            className={`flex items-center justify-between p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer ${selectedDishes.includes(dish.id) ? 'bg-blue-50' : ''
              }`}
            onClick={() => onDishToggle(dish.id)}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{dish.name}</p>
                  <p className="text-xs text-gray-500">{dish.category?.name || 'No category'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">UGX {dish.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    {!dish.available && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={`ml-4 w-5 h-5 rounded border flex items-center justify-center ${selectedDishes.includes(dish.id)
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300'
              }`}>
              {selectedDishes.includes(dish.id) && (
                <Check className="h-3 w-3 text-white" />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

interface ComboFormProps {
  combo: Combo | null;
  dishes: Dish[];
  categories: MenuCategory[];
  onSave: (combo: Combo) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const ComboForm: React.FC<ComboFormProps> = ({ combo, dishes, categories, onSave, onCancel, isEditing }) => {
  // Form state
  const [formData, setFormData] = useState<Combo>(combo || {
    id: Date.now().toString(),
    restaurant_id: '',
    name: '',
    description: '',
    base_price: 0,
    pricing_mode: 'DYNAMIC',
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    groups: [],
  });

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showDishSelector, setShowDishSelector] = useState<string | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);

  const handleInputChange = (field: keyof Combo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString()
    }));
  };

  const handleAddGroup = () => {
    const newGroup: any = {
      id: `temp-group-${Date.now()}`,
      combo_id: formData.id,
      name: `Group ${(formData.groups?.length || 0) + 1}`,
      allowed_min: 1,
      allowed_max: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      suggested_categories: [],
      items: []
    };

    setFormData(prev => ({
      ...prev,
      groups: [...(prev.groups || []), newGroup]
    }));
    setExpandedGroup(newGroup.id);
  };

  const handleUpdateGroup = (groupId: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups?.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    }));
  };

  const handleDeleteGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups?.filter(group => group.id !== groupId)
    }));
    if (expandedGroup === groupId) setExpandedGroup(null);
  };

  const handleToggleCategoryHint = (groupId: string, categoryId: string) => {
    const group = formData.groups?.find(g => g.id === groupId);
    if (!group) return;

    const currentHints = group.suggested_categories?.map(c => c.id) || [];
    const newHints = currentHints.includes(categoryId)
      ? currentHints.filter(id => id !== categoryId)
      : [...currentHints, categoryId];

    const newSuggestedCategories = categories.filter(cat => newHints.includes(cat.id));

    handleUpdateGroup(groupId, { suggested_categories: newSuggestedCategories });
  };

  const handleOpenDishSelector = (groupId: string) => {
    setShowDishSelector(groupId);
    setSelectedDishes([]);
  };

  const handleDishToggle = (dishId: string) => {
    setSelectedDishes(prev =>
      prev.includes(dishId)
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleAddDishesToGroup = (groupId: string) => {
    const group = formData.groups?.find(g => g.id === groupId);
    if (!group) return;

    const newItems = selectedDishes.map(dishId => {
      const dish = dishes.find(d => d.id === dishId);
      if (!dish) return null;

      return {
        id: `temp-item-${Date.now()}-${dishId}`,
        combo_group_id: groupId,
        dish_id: dishId,
        extra_price: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dish
      };
    }).filter(Boolean);

    handleUpdateGroup(groupId, {
      items: [...(group.items || []), ...newItems]
    });

    setShowDishSelector(null);
    setSelectedDishes([]);
  };

  const handleRemoveDishFromGroup = (groupId: string, itemId: string) => {
    const group = formData.groups?.find(g => g.id === groupId);
    if (!group) return;

    handleUpdateGroup(groupId, {
      items: group.items?.filter(item => item.id !== itemId)
    });
  };

  const handleUpdateExtraPrice = (groupId: string, itemId: string, extraPrice: number) => {
    const group = formData.groups?.find(g => g.id === groupId);
    if (!group) return;

    handleUpdateGroup(groupId, {
      items: group.items?.map(item =>
        item.id === itemId ? { ...item, extra_price: extraPrice } : item
      )
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a combo name');
      return;
    }

    if (formData.base_price < 0) {
      toast.error('Base price cannot be negative');
      return;
    }

    if (!formData.groups || formData.groups.length === 0) {
      toast.error('Please add at least one group');
      return;
    }

    for (const group of formData.groups) {
      if (!group.name.trim()) {
        toast.error('All groups must have a name');
        return;
      }

      if (group.allowed_min < 0 || group.allowed_max < group.allowed_min) {
        toast.error(`Invalid min/max selections for group: ${group.name}`);
        return;
      }

      if (!group.items || group.items.length === 0) {
        toast.error(`Group "${group.name}" must have at least one dish`);
        return;
      }
    }

    onSave(formData);
  };

  // Filter dishes for selector based on suggested categories
  const getFilteredDishesForGroup = (groupId: string) => {
    const group = formData.groups?.find(g => g.id === groupId);
    if (!group) return dishes;

    const suggestedCategoryIds = group.suggested_categories?.map(c => c.id) || [];
    
    if (suggestedCategoryIds.length === 0) {
      return dishes;
    }

    return dishes.filter(dish => 
      dish.category_id && suggestedCategoryIds.includes(dish.category_id)
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Edit Combo' : 'Create New Combo'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Combo Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Lunch Combo, Buffet Special"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Mode *
                </label>
                <Select
                  value={formData.pricing_mode}
                  onValueChange={(value: 'FIXED' | 'DYNAMIC' | 'HYBRID') => handleInputChange('pricing_mode', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Price</SelectItem>
                    <SelectItem value="DYNAMIC">Dynamic Pricing</SelectItem>
                    <SelectItem value="HYBRID">Hybrid Pricing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (UGX) *
                </label>
                <Input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => handleInputChange('available', checked)}
                  className="mr-2"
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">
                  Available for Orders
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe this combo for customers..."
                rows={2}
              />
            </div>
          </div>

          {/* Groups & Items */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Groups & Items</h3>
              <Button
                onClick={handleAddGroup}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Group
              </Button>
            </div>

            {!formData.groups || formData.groups.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <Menu className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No groups added yet</p>
                <p className="text-sm text-gray-500 mt-1">Add groups to define selection categories</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.groups.map((group) => (
                  <div key={group.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                    >
                      <div className="flex items-center gap-4">
                        <ChefHat className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-800">{group.name}</p>
                          <p className="text-sm text-gray-500">
                            {group.items?.length || 0} items • Select {group.allowed_min}-{group.allowed_max}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.suggested_categories && group.suggested_categories.length > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {group.suggested_categories.length} suggested {group.suggested_categories.length === 1 ? 'category' : 'categories'}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedGroup === group.id && (
                      <div className="p-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Group Name *
                            </label>
                            <Input
                              type="text"
                              value={group.name}
                              onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                              placeholder="e.g., Proteins, Starches"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Min Select *
                              </label>
                              <Input
                                type="number"
                                value={group.allowed_min}
                                onChange={(e) => handleUpdateGroup(group.id, { allowed_min: parseInt(e.target.value) || 0 })}
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Select *
                              </label>
                              <Input
                                type="number"
                                value={group.allowed_max}
                                onChange={(e) => handleUpdateGroup(group.id, { allowed_max: parseInt(e.target.value) || 0 })}
                                min="0"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Suggested Categories */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Suggested Categories (helps filter dishes)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {categories.map((category) => {
                              const isSelected = group.suggested_categories?.some(c => c.id === category.id) || false;
                              return (
                                <Badge
                                  key={category.id}
                                  variant={isSelected ? "default" : "outline"}
                                  className="cursor-pointer"
                                  style={isSelected ? {
                                    backgroundColor: category.color_code || '#3b82f6',
                                    borderColor: category.color_code || '#3b82f6',
                                  } : {
                                    borderColor: category.color_code || '#3b82f6',
                                    color: category.color_code || '#3b82f6',
                                  }}
                                  onClick={() => handleToggleCategoryHint(group.id, category.id)}
                                >
                                  {category.name}
                                </Badge>
                              );
                            })}
                          </div>
                          {group.suggested_categories && group.suggested_categories.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Dishes will be filtered to show only: {group.suggested_categories.map(c => c.name).join(', ')}
                            </p>
                          )}
                        </div>

                        {/* Items List */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Dishes ({group.items?.length || 0})
                            </label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDishSelector(group.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Dishes
                            </Button>
                          </div>

                          {!group.items || group.items.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded border border-dashed">
                              <p className="text-sm text-gray-500">No dishes added to this group yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">{item.dish?.name}</p>
                                    <p className="text-xs text-gray-500">{item.dish?.category?.name}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <label className="text-xs text-gray-500">Extra:</label>
                                      <Input
                                        type="number"
                                        value={item.extra_price}
                                        onChange={(e) => handleUpdateExtraPrice(group.id, item.id, parseInt(e.target.value) || 0)}
                                        className="w-20 h-8 text-xs"
                                        min="0"
                                      />
                                      <span className="text-xs text-gray-500">UGX</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleRemoveDishFromGroup(group.id, item.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isEditing ? 'Update Combo' : 'Create Combo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Dish Selector Modal */}
      {showDishSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Select Dishes
                  {formData.groups?.find(g => g.id === showDishSelector)?.suggested_categories && 
                   formData.groups.find(g => g.id === showDishSelector)!.suggested_categories!.length > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (Filtered by suggested categories)
                    </span>
                  )}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowDishSelector(null);
                    setSelectedDishes([]);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-180px)]">
              <DishSelector
                dishes={getFilteredDishesForGroup(showDishSelector)}
                selectedDishes={selectedDishes}
                onDishToggle={handleDishToggle}
              />
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {selectedDishes.length} dish{selectedDishes.length !== 1 ? 'es' : ''} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDishSelector(null);
                      setSelectedDishes([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleAddDishesToGroup(showDishSelector)}
                    disabled={selectedDishes.length === 0}
                  >
                    Add {selectedDishes.length > 0 && `(${selectedDishes.length})`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VendorMenu: React.FC = () => {
  const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();
  
  // Tab navigation
  const [activeSection, setActiveSection] = useState<'dishes' | 'combos'>('dishes');
  
  // Category states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  
  // Dish states
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [dishImages, setDishImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combo states
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboSearch, setComboSearch] = useState('');
  const [comboStatusFilter, setComboStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [comboPricingFilter, setComboPricingFilter] = useState<'all' | 'FIXED' | 'DYNAMIC' | 'HYBRID'>('all');

  // Fetch categories and dishes
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useMenuCategories(
    restaurantId || null
  );
  const { data: dishes, isLoading: dishesLoading, error: dishesError } = useDishes(
    restaurantId ? { restaurant_id: restaurantId } : undefined
  );
  
  // Fetch combos
  const { data: combos, isLoading: combosLoading } = useRestaurantCombos(restaurantId || '');

  // Helper: group dishes by category
  const dishesByCategory = (dishes || []).reduce((acc, dish) => {
    const catId = dish.category_id || 'uncategorized';
    if (!acc[catId]) {
      acc[catId] = [];
    }
    acc[catId].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  // Helper: filter dishes by selected category
  const filteredDishes = selectedCategoryId
    ? dishesByCategory[selectedCategoryId] || []
    : dishes || [];
    
  // Filter combos
  const filteredCombos = (combos || []).filter(combo => {
    const matchesSearch = combo.name.toLowerCase().includes(comboSearch.toLowerCase()) ||
      (combo.description || '').toLowerCase().includes(comboSearch.toLowerCase());
    const matchesStatus = comboStatusFilter === 'all' ||
      (comboStatusFilter === 'active' && combo.available) ||
      (comboStatusFilter === 'inactive' && !combo.available);
    const matchesPricing = comboPricingFilter === 'all' || combo.pricing_mode === comboPricingFilter;

    return matchesSearch && matchesStatus && matchesPricing;
  });

  // Calculate stats
  const stats = {
    categories: categories?.length || 0,
    dishes: dishes?.length || 0,
    combos: combos?.length || 0,
    activeCombos: combos?.filter(c => c.available).length || 0,
  };

  // Mutations
  const createCategoryMutation = useCreateMenuCategory();
  const updateCategoryMutation = useUpdateMenuCategory();
  const deleteCategoryMutation = useDeleteMenuCategory();
  const createDishMutation = useCreateDish();
  const updateDishMutation = useUpdateDish();
  const deleteDishMutation = useDeleteDish();
  const createNodeMutation = useCreateNode();
  
  // Combo mutations
  const createComboMutation = useCreateCombo();
  const updateComboMutation = useUpdateCombo();
  const deleteComboMutation = useDeleteCombo();
  const createComboGroupMutation = useCreateComboGroup();
  const createComboGroupItemMutation = useCreateComboGroupItem();

  // Category form
  const categoryForm = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      display_order: 0,
      color_code: '#3b82f6', // Default blue color
    },
  });

  // Dish form
  const dishForm = useForm<DishFormData>({
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      price: 0,
      unit: '',
      available: true,
      addToKitchen: false,
      images: [],
    },
  });

  // Open category dialog for editing
  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      color_code: category.color_code || '#3b82f6',
    });
    setCategoryDialogOpen(true);
  };

  // Open dish dialog for editing
  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish);
    const existingImages = dish.images || [];
    setDishImages(existingImages);
    dishForm.reset({
      name: dish.name,
      description: dish.description || '',
      category_id: dish.category_id || '',
      price: dish.price,
      unit: dish.unit || '',
      available: dish.available,
      addToKitchen: false,
      images: existingImages,
    });
    setDishDialogOpen(true);
  };

  // Handle category form submission
  const onCategorySubmit = async (data: CategoryFormData) => {
    if (!restaurantId) {
      toast.error('No restaurant selected');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          categoryId: editingCategory.id,
          data: {
            ...data,
            restaurant_id: restaurantId,
          },
        });
        toast.success('Category updated successfully');
      } else {
        await createCategoryMutation.mutateAsync({
          ...data,
          restaurant_id: restaurantId,
        });
        toast.success('Category created successfully');
      }
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  // Handle image upload
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = Math.max(0, 8 - dishImages.length);
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast.error('Maximum 8 images allowed');
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedFiles = await uploadService.uploadDishImages(filesToUpload);
      const newUrls = uploadedFiles.map((file) => file.url);
      const updatedImages = [...dishImages, ...newUrls];
      setDishImages(updatedImages);
      dishForm.setValue('images', updatedImages);
      toast.success(`${uploadedFiles.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    const updatedImages = dishImages.filter((_, i) => i !== index);
    setDishImages(updatedImages);
    dishForm.setValue('images', updatedImages);
  };

  // Set hero image (move to first position)
  const handleSetHeroImage = (index: number) => {
    if (index === 0) return; // Already hero
    const updatedImages = [...dishImages];
    const [heroImage] = updatedImages.splice(index, 1);
    updatedImages.unshift(heroImage);
    setDishImages(updatedImages);
    dishForm.setValue('images', updatedImages);
  };

  // Handle dish form submission
  const onDishSubmit = async (data: DishFormData) => {
    if (!restaurantId) {
      toast.error('No restaurant selected');
      return;
    }

    try {
      let createdDish: Dish;
      const submitData = {
        ...data,
        images: dishImages.length > 0 ? dishImages : undefined,
        restaurant_id: restaurantId,
      };
      
      if (editingDish) {
        createdDish = await updateDishMutation.mutateAsync({
          dishId: editingDish.id,
          data: submitData,
        });
        toast.success('Dish updated successfully');
      } else {
        createdDish = await createDishMutation.mutateAsync(submitData);
        toast.success('Dish created successfully');

        // Optionally add to kitchen graph
        if (data.addToKitchen && createdDish.category_id) {
          try {
            // Get the graph to find a suitable position
            const graph = await kitchenService.getGraph(restaurantId);
            const category = graph.categories?.find(
              (c) => c.id === createdDish.category_id
            );

            if (category) {
              await createNodeMutation.mutateAsync({
                restaurant_id: restaurantId,
                category_id: createdDish.category_id,
                entity_type: 'dish',
                entity_id: createdDish.id,
                display_name: createdDish.name,
                x: 100 + Math.random() * 200,
                y: 100 + Math.random() * 200,
                available: createdDish.available,
              });
              toast.success('Dish added to kitchen graph');
            }
          } catch (error: any) {
            console.error('Failed to add dish to kitchen graph:', error);
            toast.error('Dish created but failed to add to kitchen graph');
          }
        }
      }
      setDishDialogOpen(false);
      setEditingDish(null);
      setDishImages([]);
      dishForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save dish');
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  };

  // Handle dish deletion
  const handleDeleteDish = async (dishId: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) {
      return;
    }

    try {
      await deleteDishMutation.mutateAsync(dishId);
      toast.success('Dish deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete dish');
    }
  };

  // Combo handlers
  const handleCreateCombo = () => {
    setEditingCombo(null);
    setComboDialogOpen(true);
  };

  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setComboDialogOpen(true);
  };

  const handleDuplicateCombo = async (combo: Combo) => {
    if (!restaurantId) {
      toast.error('No restaurant selected');
      return;
    }

    try {
      await createComboMutation.mutateAsync({
        restaurant_id: restaurantId,
        name: `${combo.name} (Copy)`,
        description: combo.description || undefined,
        pricing_mode: combo.pricing_mode.toLowerCase() as 'fixed' | 'dynamic' | 'hybrid',
        base_price: combo.base_price,
        available: combo.available,
      });
      toast.success('Combo duplicated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate combo');
    }
  };

  const handleToggleComboStatus = async (comboId: string) => {
    const combo = combos?.find(c => c.id === comboId);
    if (!combo) return;

    try {
      await updateComboMutation.mutateAsync({
        comboId,
        data: {
          available: !combo.available,
        },
      });
      toast.success(`Combo ${!combo.available ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle combo status');
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!window.confirm('Are you sure you want to delete this combo? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteComboMutation.mutateAsync(comboId);
      toast.success('Combo deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete combo');
    }
  };

  const handleSaveCombo = async (combo: Combo) => {
    if (!restaurantId) {
      toast.error('No restaurant selected');
      return;
    }

    try {
      let savedCombo: Combo;

      // Step 1: Create or update the combo
      if (editingCombo) {
        savedCombo = await updateComboMutation.mutateAsync({
          comboId: combo.id,
          data: {
            name: combo.name,
            description: combo.description || undefined,
            pricing_mode: combo.pricing_mode.toLowerCase() as 'fixed' | 'dynamic' | 'hybrid',
            base_price: combo.base_price,
            available: combo.available,
          },
        });
        toast.success('Combo updated successfully');
      } else {
        savedCombo = await createComboMutation.mutateAsync({
          restaurant_id: restaurantId,
          name: combo.name,
          description: combo.description || undefined,
          pricing_mode: combo.pricing_mode.toLowerCase() as 'fixed' | 'dynamic' | 'hybrid',
          base_price: combo.base_price,
          available: combo.available,
        });
        
        // Step 2: Create groups and items for new combo
        if (combo.groups && combo.groups.length > 0) {
          for (const group of combo.groups) {
            try {
              // Create the group
              const categoryHints = group.suggested_categories?.map(cat => cat.id) || [];
              
              const createdGroup = await createComboGroupMutation.mutateAsync({
                combo_id: savedCombo.id,
                name: group.name,
                allowed_min: group.allowed_min,
                allowed_max: group.allowed_max,
                category_hints: categoryHints.length > 0 ? categoryHints : undefined,
              });

              // Create items for this group
              if (group.items && group.items.length > 0) {
                for (const item of group.items) {
                  await createComboGroupItemMutation.mutateAsync({
                    combo_group_id: createdGroup.id,
                    dish_id: item.dish_id,
                    extra_price: item.extra_price,
                  });
                }
              }
            } catch (groupError: any) {
              console.error('Error creating group:', groupError);
              toast.error(`Failed to create group "${group.name}": ${groupError.message}`);
            }
          }
        }

        toast.success('Combo created successfully with all groups and items!');
      }

      setComboDialogOpen(false);
      setEditingCombo(null);
    } catch (error: any) {
      console.error('Error saving combo:', error);
      toast.error(error.message || 'Failed to save combo');
    }
  };

  // Loading state
  if (vendorLoading || categoriesLoading || dishesLoading) {
    return (
      <div className="container mx-auto py-6 px-4 space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <MenuItemsSkeleton count={8} />
      </div>
    );
  }

  // No restaurant found
  if (!hasRestaurant) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No restaurant found</h3>
            <p className="text-muted-foreground">
              Create a restaurant to manage your menu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error loading data
  if (categoriesError || dishesError) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load menu data</h3>
            <p className="text-muted-foreground text-center mb-4">
              {categoriesError ? 'Failed to load categories' : 'Failed to load dishes'}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your menu categories and dishes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={(open) => {
              setCategoryDialogOpen(open);
              if (!open) {
                setEditingCategory(null);
                categoryForm.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? 'Update the category details below.'
                    : 'Add a new category to organize your menu.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...categoryForm}>
                <form
                  onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Appetizers" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Category description (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="display_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="color_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Input
                              type="color"
                              {...field}
                              className="h-10 w-20 cursor-pointer"
                            />
                            <Input
                              type="text"
                              {...field}
                              placeholder="#3b82f6"
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Choose a color to make this category visually distinct
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCategoryDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={dishDialogOpen}
            onOpenChange={(open) => {
              setDishDialogOpen(open);
              if (!open) {
                setEditingDish(null);
                setDishImages([]);
                dishForm.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setDishImages([]);
                  dishForm.reset({
                    name: '',
                    description: '',
                    category_id: '',
                    price: 0,
                    unit: '',
                    available: true,
                    addToKitchen: false,
                    images: [],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Dish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDish ? 'Edit Dish' : 'Create Dish'}
                </DialogTitle>
                <DialogDescription>
                  {editingDish
                    ? 'Update the dish details below.'
                    : 'Add a new dish to your menu.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...dishForm}>
                <form
                  onSubmit={dishForm.handleSubmit(onDishSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={dishForm.control}
                    name="name"
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Margherita Pizza" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={dishForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Dish description (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={dishForm.control}
                      name="category_id"
                      rules={{ required: 'Category is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dishForm.control}
                      name="price"
                      rules={{
                        required: 'Price is required',
                        min: { value: 0, message: 'Price must be positive' },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (UGX)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={dishForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., per plate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={dishForm.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Available</FormLabel>
                          <FormDescription>
                            Make this dish available for ordering
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  {!editingDish && (
                    <FormField
                      control={dishForm.control}
                      name="addToKitchen"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Add to Kitchen Graph</FormLabel>
                            <FormDescription>
                              Automatically add this dish as a node in the kitchen graph
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Images Section */}
                  <div className="space-y-2">
                    <FormLabel>Images</FormLabel>
                    <FormDescription>
                      Upload up to 8 images. The first image will be used as the hero image.
                    </FormDescription>
                    
                    {/* Image Upload Area */}
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-primary');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-primary');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-primary');
                        handleImageUpload(e.dataTransfer.files);
                      }}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP up to 5MB each
                      </p>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      disabled={uploadingImages || dishImages.length >= 8}
                    />
                    
                    {/* Image Preview Grid */}
                    {dishImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {dishImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border"
                          >
                            <img
                              src={imageUrl}
                              alt={`Dish image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              {index === 0 && (
                                <Badge variant="default" className="absolute top-1 left-1">
                                  <Star className="h-3 w-3 mr-1" />
                                  Hero
                                </Badge>
                              )}
                              {index !== 0 && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetHeroImage(index);
                                  }}
                                  title="Set as hero image"
                                >
                                  <Star className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(index);
                                }}
                                title="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {uploadingImages && (
                      <p className="text-sm text-muted-foreground">Uploading images...</p>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDishDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createDishMutation.isPending || updateDishMutation.isPending}>
                      {editingDish ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats + Action Buttons Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <ChefHat className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Categories</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.categories}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Utensils className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dishes</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.dishes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Menu className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Combos</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.combos}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 rounded-lg mr-3">
                    <Check className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active Combos</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.activeCombos}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(true)}
                  title="Create Category"
                  className="h-11 w-11 lg:h-10 lg:w-10"
                >
                  <ChefHat className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  onClick={() => setDishDialogOpen(true)}
                  title="Create Dish"
                  className="h-11 w-11 lg:h-10 lg:w-10"
                >
                  <Utensils className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  onClick={handleCreateCombo}
                  title="Create Combo"
                  className="h-11 w-11 lg:h-10 lg:w-10"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full lg:w-auto">
                      <MoreVertical className="h-4 w-4 mr-2" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCategoryDialogOpen(true)}>
                      <ChefHat className="h-4 w-4 mr-2" />
                      New Category
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDishDialogOpen(true)}>
                      <Utensils className="h-4 w-4 mr-2" />
                      New Dish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCreateCombo}>
                      <Menu className="h-4 w-4 mr-2" />
                      New Combo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Export Menu
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      View Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-8">
              <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No categories yet. Create your first category to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const categoryColor = category.color_code || '#3b82f6';
                return (
                  <Card 
                    key={category.id}
                    className="relative overflow-hidden border-t-4"
                    style={{ borderTopColor: categoryColor }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {category.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${categoryColor}15`,
                          borderColor: `${categoryColor}40`,
                          color: categoryColor
                        }}
                      >
                        {dishesByCategory[category.id]?.length || 0} dishes
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'dishes' | 'combos')} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dishes" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Dishes
          </TabsTrigger>
          <TabsTrigger value="combos" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Combos
          </TabsTrigger>
        </TabsList>

        {/* Dishes Tab */}
        <TabsContent value="dishes" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Dishes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 && (
            <div className="mb-4 flex gap-2 flex-wrap">
              <Button
                variant={selectedCategoryId === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategoryId(null)}
              >
                All Dishes
              </Button>
              {categories.map((cat) => {
                const catColor = cat.color_code || '#3b82f6';
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={
                      selectedCategoryId === cat.id
                        ? {
                            backgroundColor: catColor,
                            borderColor: catColor,
                            color: 'white',
                          }
                        : {
                            borderColor: catColor,
                            color: catColor,
                          }
                    }
                  >
                    {cat.name}
                  </Button>
                );
              })}
            </div>
          )}

          {dishesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : !filteredDishes || filteredDishes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedCategoryId
                  ? 'No dishes in this category yet.'
                  : 'No dishes yet. Create your first dish to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDishes.map((dish: Dish) => {
                // Handle images - could be array, string (JSON), or null
                let imagesArray: string[] = [];
                if (dish.images) {
                  if (Array.isArray(dish.images)) {
                    imagesArray = dish.images;
                  } else if (typeof dish.images === 'string') {
                    try {
                      const parsed = JSON.parse(dish.images);
                      imagesArray = Array.isArray(parsed) ? parsed : [];
                    } catch {
                      // If parsing fails, treat as single URL string
                      imagesArray = [dish.images];
                    }
                  }
                }
                
                const heroImage = imagesArray.length > 0 ? getImageUrl(imagesArray[0]) : null;
                const additionalImagesCount = imagesArray.length > 1 ? imagesArray.length - 1 : 0;
                
                return (
                  <Card key={dish.id} className="overflow-hidden relative h-64">
                    {/* Background Image with Overlay */}
                    {heroImage ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${heroImage})`,
                        }}
                      >
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-black/50" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
                    )}
                    
                    {/* Content Overlay */}
                    <div className="relative h-full flex flex-col p-4 text-white">
                      {/* Header with actions */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white drop-shadow-lg">
                            {dish.name}
                          </CardTitle>
                          {dish.category && (
                            <Badge 
                              variant="secondary" 
                              className="mt-1 text-white border-white/30"
                              style={{
                                backgroundColor: dish.category.color_code 
                                  ? `${dish.category.color_code}CC` 
                                  : 'rgba(255, 255, 255, 0.2)',
                                borderColor: dish.category.color_code 
                                  ? `${dish.category.color_code}80` 
                                  : 'rgba(255, 255, 255, 0.3)',
                              }}
                            >
                              {dish.category.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 h-8 w-8"
                            onClick={() => handleEditDish(dish)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 h-8 w-8"
                            onClick={() => handleDeleteDish(dish.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Description */}
                      {dish.description && (
                        <p className="text-sm text-white/90 mb-auto line-clamp-2 drop-shadow">
                          {dish.description}
                        </p>
                      )}
                      
                      {/* Footer with price and availability */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/20">
                        <span className="text-lg font-semibold text-white drop-shadow">
                          {dish.price.toLocaleString()} UGX
                          {dish.unit && (
                            <span className="text-sm font-normal text-white/80">
                              {' '}/ {dish.unit}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          {additionalImagesCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-white/20 text-white border-white/30"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              +{additionalImagesCount}
                            </Badge>
                          )}
                          <Badge
                            variant={dish.available ? 'default' : 'secondary'}
                            className={dish.available ? 'bg-green-500/80 text-white' : 'bg-white/20 text-white border-white/30'}
                          >
                            {dish.available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Combos Tab */}
        <TabsContent value="combos" className="space-y-6">
          {/* Combo Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Combos</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      value={comboSearch}
                      onChange={(e) => setComboSearch(e.target.value)}
                      placeholder="Search combos..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex gap-2">
                    <Button
                      variant={comboStatusFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setComboStatusFilter('all')}
                      className="flex-1"
                    >
                      All
                    </Button>
                    <Button
                      variant={comboStatusFilter === 'active' ? 'default' : 'outline'}
                      onClick={() => setComboStatusFilter('active')}
                      className="flex-1"
                    >
                      Active
                    </Button>
                    <Button
                      variant={comboStatusFilter === 'inactive' ? 'default' : 'outline'}
                      onClick={() => setComboStatusFilter('inactive')}
                      className="flex-1"
                    >
                      Inactive
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Mode</label>
                  <Select
                    value={comboPricingFilter}
                    onValueChange={(value: 'all' | 'FIXED' | 'DYNAMIC' | 'HYBRID') => setComboPricingFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Pricing Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pricing Modes</SelectItem>
                      <SelectItem value="FIXED">Fixed Price</SelectItem>
                      <SelectItem value="DYNAMIC">Dynamic Pricing</SelectItem>
                      <SelectItem value="HYBRID">Hybrid Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Combo Grid */}
          {filteredCombos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Menu className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {comboSearch || comboStatusFilter !== 'all' || comboPricingFilter !== 'all'
                    ? 'No combos found'
                    : 'No combos yet'
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {comboSearch || comboStatusFilter !== 'all' || comboPricingFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first combo to get started'
                  }
                </p>
                <Button onClick={handleCreateCombo}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Combo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCombos.map(combo => (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  dishes={dishes || []}
                  onEdit={handleEditCombo}
                  onDuplicate={handleDuplicateCombo}
                  onToggleStatus={handleToggleComboStatus}
                  onDelete={handleDeleteCombo}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Combo Form Dialog */}
      {comboDialogOpen && (
        <ComboForm
          combo={editingCombo}
          dishes={dishes || []}
          categories={categories || []}
          onSave={handleSaveCombo}
          onCancel={() => {
            setComboDialogOpen(false);
            setEditingCombo(null);
          }}
          isEditing={!!editingCombo}
        />
      )}
    </div>
  );
};

export default VendorMenu;

