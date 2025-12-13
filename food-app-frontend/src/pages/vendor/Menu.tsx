import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SelectSeparator, SelectGroup, SelectLabel } from "@/components/ui/select";
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
  X,
  Image as ImageIcon,
  Menu,
  Search,
  Check,
  MoreVertical,
  Download,
  FileText,
  Scale,
  Calculator,
  ChevronDown,
  ChevronUp,
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
  useUpdateComboGroupItem,
  useDeleteComboGroupItem,
  useCalculateComboPrice,
} from '@/hooks/queries/useCombos';
import { useCreateNode } from '@/hooks/queries/useKitchenNodes';
import { MenuItemsSkeleton } from '@/components/vendor/LoadingSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { MenuCategory, Dish, Combo, ComboPriceCalculation, ComboPriceLineItem } from '@/services/menuService';
import kitchenService from '@/services/kitchenService';
import uploadService from '@/services/uploadService';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { CategoryFormData, DishFormData } from '@/types/menu';
import { getImageUrl, getPricingModeFormula } from '@/utils/pricingUtils';
import { ComboCard, DishSelectorModal } from '@/components/vendor/menu/combos';
import { CategoryFormDialog } from '@/components/vendor/menu/categories';
import { DishFormDialog } from '@/components/vendor/menu/dishes';

// ========== COMBO FORM COMPONENT ==========
interface ComboFormProps {
  combo: Combo | null;
  dishes: Dish[];
  categories: MenuCategory[];
  onSave: (combo: Combo) => void;
  onCancel: () => void;
  isEditing: boolean;
  isSaving?: boolean;
}

const ComboForm: React.FC<ComboFormProps> = ({ combo, dishes, categories, onSave, onCancel, isEditing, isSaving = false }) => {
  // Form state
  const [formData, setFormData] = useState<Combo>(combo || {
    id: Date.now().toString(),
    restaurant_id: '',
    name: '',
    description: '',
    base_price: 0,
    pricing_mode: 'DYNAMIC',
    available: true,
    tags: [],
    images: [],
    order_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    groups: [],
  });

  // Images and tags state
  const [comboImages, setComboImages] = useState<string[]>(combo?.images || []);
  const [comboTags, setComboTags] = useState<string[]>(combo?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [uploadingComboImages, setUploadingComboImages] = useState(false);
  const comboFileInputRef = useRef<HTMLInputElement>(null!);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showDishSelector, setShowDishSelector] = useState<string | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [showPriceCalculator, setShowPriceCalculator] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<ComboPriceCalculation | null>(null);
  const [showModeComparison, setShowModeComparison] = useState(false);
  const [priceCalcSelections, setPriceCalcSelections] = useState<Record<string, string>>({});
  const [modeComparisonPrices, setModeComparisonPrices] = useState<{
    FIXED: ComboPriceCalculation | null;
    DYNAMIC: ComboPriceCalculation | null;
    HYBRID: ComboPriceCalculation | null;
  }>({ FIXED: null, DYNAMIC: null, HYBRID: null });

  const calculatePriceMutation = useCalculateComboPrice();

  const handleInputChange = (field: keyof Combo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString()
    }));
  };

  // Sync formData with images and tags whenever they change
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      images: comboImages,
      tags: comboTags,
    }));
  }, [comboImages, comboTags]);

  // Handle combo image upload
  const handleComboImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = Math.max(0, 8 - comboImages.length);
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast.error('Maximum 8 images allowed');
      return;
    }

    setUploadingComboImages(true);
    try {
      const uploadedFiles = await uploadService.uploadDishImages(filesToUpload);
      const newUrls = uploadedFiles.map((file) => file.url);
      const updatedImages = [...comboImages, ...newUrls];
      setComboImages(updatedImages);
      toast.success(`${uploadedFiles.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingComboImages(false);
    }
  };

  // Handle remove combo image
  const handleRemoveComboImage = (index: number) => {
    setComboImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle add tag
  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (!trimmedTag) {
      toast.error('Tag cannot be empty');
      return;
    }
    if (comboTags.includes(trimmedTag)) {
      toast.error('Tag already exists');
      return;
    }
    if (comboTags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
      return;
    }
    setComboTags(prev => [...prev, trimmedTag]);
    setNewTag('');
  };

  // Handle remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setComboTags(prev => prev.filter(tag => tag !== tagToRemove));
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

  // Handle calculate price
  const handleCalculatePrice = async (mode?: 'FIXED' | 'DYNAMIC' | 'HYBRID') => {
    // Validate that we have all required data
    if (!combo?.id) {
      toast.error('Cannot calculate price: Combo not saved yet');
      return null;
    }

    if (!formData.groups || formData.groups.length === 0) {
      toast.error('Please add at least one group with dishes');
      return null;
    }

    // Build selections payload using interactive selections or first item from each group
    const groups = formData.groups.map(group => {
      let selectedDishId = priceCalcSelections[group.id];

      // If no selection, use first item
      if (!selectedDishId) {
        const firstItem = group.items?.[0];
        if (!firstItem) return null;
        selectedDishId = String(firstItem.dish_id);
      }

      return {
        group_id: group.id,
        selected: [
          {
            dish_id: selectedDishId,
            option_ids: [] as string[]
          }
        ]
      };
    }).filter((g): g is NonNullable<typeof g> => g !== null);

    if (groups.length === 0) {
      toast.error('Please add dishes to groups');
      return null;
    }

    try {
      const result = await calculatePriceMutation.mutateAsync({
        comboId: combo.id.toString(),
        selections: { groups }
      });

      if (!mode) {
        setCalculatedPrice(result);
        toast.success('Price calculated successfully');
      }

      return result;
    } catch (error) {
      console.error('Price calculation error:', error);
      if (!mode) {
        toast.error('Failed to calculate price');
      }
      return null;
    }
  };

  // Handle pricing mode comparison
  const handleCompareModesCalculation = async () => {
    if (!combo?.id) {
      toast.error('Cannot compare modes: Combo not saved yet');
      return;
    }

    setShowModeComparison(true);
    toast.info('Calculating prices for all modes...');

    // Calculate for all three modes in parallel
    const [fixedResult, dynamicResult, hybridResult] = await Promise.all([
      handleCalculatePrice('FIXED'),
      handleCalculatePrice('DYNAMIC'),
      handleCalculatePrice('HYBRID')
    ]);

    setModeComparisonPrices({
      FIXED: fixedResult,
      DYNAMIC: dynamicResult,
      HYBRID: hybridResult
    });

    toast.success('Mode comparison ready!');
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
                  disabled={formData.pricing_mode === 'DYNAMIC'}
                  className={formData.pricing_mode === 'DYNAMIC' ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
                {formData.pricing_mode === 'DYNAMIC' && (
                  <p className="text-xs text-amber-600 mt-1">
                    Base price is not used in DYNAMIC mode
                  </p>
                )}
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

            {/* Tags Section */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag (e.g., spicy, vegetarian, popular)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {comboTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {comboTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {comboTags.length}/10 tags added
              </p>
            </div>

            {/* Images Section */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Combo Images (Optional)
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={comboFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleComboImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => comboFileInputRef.current?.click()}
                    disabled={uploadingComboImages || comboImages.length >= 8}
                    variant="outline"
                    size="sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {uploadingComboImages ? 'Uploading...' : 'Upload Images'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {comboImages.length}/8 images uploaded
                  </span>
                </div>

                {comboImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {comboImages.map((image, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={(getImageUrl(image) || image) as string}
                          alt={`Combo image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveComboImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Count Display (for editing mode) */}
            {isEditing && combo?.order_count !== undefined && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Orders
                  </span>
                  <Badge variant="default" className="text-base">
                    {combo.order_count}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This combo has been ordered {combo.order_count} time{combo.order_count !== 1 ? 's' : ''}
                </p>
              </div>
            )}
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
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Group Name *
                            </label>

                            <div className="flex rounded-lg border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                              <input
                                type="text"
                                value={group.name}
                                onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                                placeholder="Enter group name..."
                                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                              />

                              <div className="relative border-l">
                                <Select
                                  onValueChange={(categoryId) => {
                                    const selectedCategory = categories.find(c => c.id === categoryId);
                                    if (selectedCategory) {
                                      const autoName = `Pick ${group.allowed_max} from ${selectedCategory.name}`;
                                      handleUpdateGroup(group.id, { name: autoName });
                                      const currentHints = group.suggested_categories?.map(c => c.id) || [];
                                      if (!currentHints.includes(categoryId)) {
                                        handleToggleCategoryHint(group.id, categoryId);
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-full border-0 rounded-none px-3 py-2 text-sm bg-muted/50 hover:bg-muted">
                                    <SelectValue placeholder="Quick" />
                                  </SelectTrigger>
                                  <SelectContent align="end">
                                    <SelectItem value="custom">Custom name</SelectItem>
                                    <SelectSeparator />
                                    <SelectGroup>
                                      <SelectLabel>Auto-name from category:</SelectLabel>
                                      {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500">
                              Type custom name or use Quick to auto-generate from category
                            </p>
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
                                onChange={(e) => {
                                  const newMax = parseInt(e.target.value) || 0;
                                  handleUpdateGroup(group.id, { allowed_max: newMax });

                                  // Update auto-generated name if it follows the pattern
                                  if (group.name.match(/^Pick \d+ from /)) {
                                    const categoryMatch = group.name.match(/from (.+)$/);
                                    if (categoryMatch) {
                                      const categoryName = categoryMatch[1];
                                      handleUpdateGroup(group.id, { name: `Pick ${newMax} from ${categoryName}` });
                                    }
                                  }
                                }}
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

          {/* Live Price Calculator */}
          {combo?.id && (
            <div className="mb-8">
              <Collapsible
                open={showPriceCalculator}
                onOpenChange={setShowPriceCalculator}
              >
                <div className="border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between p-4 hover:bg-white/50"
                    >
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-800">Price Calculator</span>
                        <Badge variant="outline" className="ml-2">
                          {formData.pricing_mode}
                        </Badge>
                      </div>
                      {showPriceCalculator ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 space-y-4 border-t">
                      {/* Interactive Dish Selection for Calculator */}
                      {formData.groups && formData.groups.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700">Select dishes to calculate price:</p>
                          {formData.groups.map((group) => (
                            <div key={group.id} className="space-y-2">
                              <label className="text-xs font-medium text-gray-600">{group.name}</label>
                              <Select
                                value={priceCalcSelections[group.id] || String(group.items?.[0]?.dish_id || '')}
                                onValueChange={(value) => {
                                  setPriceCalcSelections({ ...priceCalcSelections, [group.id]: value });
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select a dish" />
                                </SelectTrigger>
                                <SelectContent>
                                  {group.items?.map((item) => {
                                    const dish = dishes.find(d => d.id === item.dish_id);
                                    return (
                                      <SelectItem key={item.id} value={String(item.dish_id)}>
                                        {dish?.name || `Dish #${item.dish_id}`}
                                        {item.extra_price > 0 && ` (+UGX ${item.extra_price})`}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCalculatePrice()}
                          disabled={calculatePriceMutation.isPending || !formData.groups?.length}
                          className="flex items-center gap-2"
                        >
                          <Calculator className="h-4 w-4" />
                          {calculatePriceMutation.isPending ? 'Calculating...' : 'Calculate Price'}
                        </Button>

                        <Button
                          onClick={handleCompareModesCalculation}
                          variant="outline"
                          disabled={calculatePriceMutation.isPending || !formData.groups?.length}
                          className="flex items-center gap-2"
                        >
                          <Scale className="h-4 w-4" />
                          Compare Modes
                        </Button>
                      </div>

                      {calculatedPrice && (
                        <div className="space-y-3 p-4 bg-white rounded-lg border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Price Breakdown</span>
                            <Badge className="text-base px-3 py-1">
                              UGX {calculatedPrice.total.toLocaleString()}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            {calculatedPrice.breakdown.combo_base > 0 && (
                              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                <span className="text-gray-700">Combo Base Price</span>
                                <span className="font-medium">UGX {calculatedPrice.breakdown.combo_base.toLocaleString()}</span>
                              </div>
                            )}

                            {calculatedPrice.breakdown.dish_base > 0 && (
                              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                <span className="text-gray-700">Dish Base Prices</span>
                                <span className="font-medium">UGX {calculatedPrice.breakdown.dish_base.toLocaleString()}</span>
                              </div>
                            )}

                            {calculatedPrice.breakdown.dish_surcharges > 0 && (
                              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                <span className="text-gray-700">Dish Extra Prices</span>
                                <span className="font-medium">UGX {calculatedPrice.breakdown.dish_surcharges.toLocaleString()}</span>
                              </div>
                            )}

                            {calculatedPrice.breakdown.options_surcharges > 0 && (
                              <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                                <span className="text-gray-700">Options Surcharges</span>
                                <span className="font-medium">UGX {calculatedPrice.breakdown.options_surcharges.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {calculatedPrice.items && calculatedPrice.items.length > 0 && (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                                View Item Details ({calculatedPrice.items.length} items)
                              </summary>
                              <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
                                {calculatedPrice.items.map((item: ComboPriceLineItem, idx: number) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-gray-600">{item.dish_name}</span>
                                    <span className="font-medium">UGX {item.line_total.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}

                          <div className="pt-2 border-t text-xs text-gray-500">
                            Formula: {getPricingModeFormula(calculatedPrice.pricing_mode)}
                          </div>
                        </div>
                      )}

                      {!calculatedPrice && !calculatePriceMutation.isPending && (
                        <p className="text-sm text-gray-500 italic">
                          Select dishes from each group and click "Calculate Price" to see a detailed breakdown
                        </p>
                      )}

                      {/* Pricing Mode Comparison */}
                      {showModeComparison && (modeComparisonPrices.FIXED || modeComparisonPrices.DYNAMIC || modeComparisonPrices.HYBRID) && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">Pricing Mode Comparison</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowModeComparison(false);
                                setModeComparisonPrices({ FIXED: null, DYNAMIC: null, HYBRID: null });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {(['FIXED', 'DYNAMIC', 'HYBRID'] as const).map((mode) => {
                              const modePrice = modeComparisonPrices[mode];
                              const isCurrentMode = formData.pricing_mode === mode;

                              return (
                                <div
                                  key={mode}
                                  className={`p-3 rounded-lg border-2 ${isCurrentMode
                                    ? 'bg-white border-green-500 shadow-md'
                                    : 'bg-white/50 border-gray-200'
                                    }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge
                                      variant={isCurrentMode ? 'default' : 'outline'}
                                      className="text-xs"
                                    >
                                      {mode}
                                    </Badge>
                                    {isCurrentMode && (
                                      <Check className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>

                                  {modePrice ? (
                                    <>
                                      <div className="text-lg font-bold text-gray-900">
                                        UGX {modePrice.total.toLocaleString()}
                                      </div>
                                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                                        {modePrice.breakdown.combo_base > 0 && (
                                          <div className="flex justify-between">
                                            <span>Base:</span>
                                            <span>{modePrice.breakdown.combo_base.toLocaleString()}</span>
                                          </div>
                                        )}
                                        {modePrice.breakdown.dish_base > 0 && (
                                          <div className="flex justify-between">
                                            <span>Dishes:</span>
                                            <span>{modePrice.breakdown.dish_base.toLocaleString()}</span>
                                          </div>
                                        )}
                                        {modePrice.breakdown.dish_surcharges > 0 && (
                                          <div className="flex justify-between">
                                            <span>Extras:</span>
                                            <span>{modePrice.breakdown.dish_surcharges.toLocaleString()}</span>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-gray-500">Calculating...</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 border-t text-xs text-gray-600">
                            <p className="font-medium mb-1">Quick Guide:</p>
                            <ul className="space-y-0.5 pl-4">
                              <li>• <strong>FIXED:</strong> Best for consistent pricing</li>
                              <li>• <strong>DYNAMIC:</strong> Reflects actual dish costs</li>
                              <li>• <strong>HYBRID:</strong> Balance of both approaches</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditing ? 'Update Combo' : 'Create Combo'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dish Selector Modal */}
      <DishSelectorModal
        isOpen={!!showDishSelector}
        dishes={showDishSelector ? getFilteredDishesForGroup(showDishSelector) : []}
        selectedDishes={selectedDishes}
        groupName={showDishSelector ? formData.groups?.find(g => g.id === showDishSelector)?.name : undefined}
        hasFilteredCategories={
          showDishSelector
            ? (formData.groups?.find(g => g.id === showDishSelector)?.suggested_categories?.length || 0) > 0
            : false
        }
        onDishToggle={handleDishToggle}
        onConfirm={() => showDishSelector && handleAddDishesToGroup(showDishSelector)}
        onCancel={() => {
          setShowDishSelector(null);
          setSelectedDishes([]);
        }}
      />
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
  const fileInputRef = useRef<HTMLInputElement>(null!);

  // Dish options state
  const [dishOptions, setDishOptions] = useState<Array<{ name: string; extra_cost: number; required: boolean }>>([]);

  // Combo states
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboSearch, setComboSearch] = useState('');
  const [comboStatusFilter, setComboStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [comboPricingFilter, setComboPricingFilter] = useState<'all' | 'FIXED' | 'DYNAMIC' | 'HYBRID'>('all');

  // Track loading states for combo operations
  const [operatingComboId, setOperatingComboId] = useState<string | null>(null);
  const [comboOperation, setComboOperation] = useState<'duplicate' | 'toggle' | 'delete' | null>(null);

  // Fetch categories and dishes
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useMenuCategories(
    restaurantId || null
  );
  const { data: dishes, isLoading: dishesLoading, error: dishesError } = useDishes(
    restaurantId ? { restaurant_id: restaurantId } : undefined
  );

  // Fetch combos
  const { data: combos } = useRestaurantCombos(restaurantId || '');

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
  const updateComboGroupMutation = useUpdateComboGroup();
  const deleteComboGroupMutation = useDeleteComboGroup();
  const createComboGroupItemMutation = useCreateComboGroupItem();
  const updateComboGroupItemMutation = useUpdateComboGroupItem();
  const deleteComboGroupItemMutation = useDeleteComboGroupItem();

  // Open category dialog for editing
  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  // Open dish dialog for editing
  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish);
    const existingImages = dish.images || [];
    const existingOptions = (dish.options || []).map(opt => ({
      name: opt.name,
      extra_cost: opt.extra_cost,
      required: opt.required,
    }));
    setDishImages(existingImages);
    setDishOptions(existingOptions);
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
      toast.success(`${uploadedFiles.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
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
        options: dishOptions.length > 0 ? dishOptions : undefined,
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
      setDishOptions([]);
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

    setOperatingComboId(combo.id);
    setComboOperation('duplicate');
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
    } finally {
      setOperatingComboId(null);
      setComboOperation(null);
    }
  };

  const handleToggleComboStatus = async (comboId: string) => {
    const combo = combos?.find(c => c.id === comboId);
    if (!combo) return;

    setOperatingComboId(comboId);
    setComboOperation('toggle');
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
    } finally {
      setOperatingComboId(null);
      setComboOperation(null);
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!window.confirm('Are you sure you want to delete this combo? This action cannot be undone.')) {
      return;
    }

    setOperatingComboId(comboId);
    setComboOperation('delete');
    try {
      await deleteComboMutation.mutateAsync(comboId);
      toast.success('Combo deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete combo');
    } finally {
      setOperatingComboId(null);
      setComboOperation(null);
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
            tags: combo.tags && combo.tags.length > 0 ? combo.tags : undefined,
            images: combo.images && combo.images.length > 0 ? combo.images : undefined,
          },
        });

        // Step 2: Update groups and items for existing combo
        if (combo.groups && combo.groups.length > 0) {
          // Get original group IDs to detect deletions
          const originalGroupIds = editingCombo.groups?.map(g => g.id) || [];
          const updatedGroupIds = combo.groups.map(g => g.id).filter(id => !id.startsWith('temp-'));
          const deletedGroupIds = originalGroupIds.filter(id => !updatedGroupIds.includes(id));

          // Delete removed groups
          for (const groupId of deletedGroupIds) {
            try {
              await deleteComboGroupMutation.mutateAsync(groupId);
            } catch (error: any) {
              console.error('Error deleting group:', error);
              toast.error(`Failed to delete group: ${error.message}`);
            }
          }

          // Process each group
          for (const group of combo.groups) {
            try {
              const categoryHints = group.suggested_categories?.map(cat => cat.id) || [];
              let processedGroup;

              if (group.id.startsWith('temp-')) {
                // Create new group
                processedGroup = await createComboGroupMutation.mutateAsync({
                  combo_id: savedCombo.id,
                  name: group.name,
                  allowed_min: group.allowed_min,
                  allowed_max: group.allowed_max,
                  category_hints: categoryHints.length > 0 ? categoryHints : undefined,
                });
              } else {
                // Update existing group
                processedGroup = await updateComboGroupMutation.mutateAsync({
                  groupId: group.id,
                  data: {
                    name: group.name,
                    allowed_min: group.allowed_min,
                    allowed_max: group.allowed_max,
                    category_hints: categoryHints.length > 0 ? categoryHints : undefined,
                  },
                });
              }

              // Handle items for this group
              const originalGroup = editingCombo.groups?.find(g => g.id === group.id);
              const originalItems = originalGroup?.items || [];
              const currentItems = group.items || [];

              // Build map for comparison
              const originalItemMap = new Map(originalItems.map(i => [i.id, i]));

              // Delete removed items (items that existed but are no longer present)
              for (const originalItem of originalItems) {
                const stillExists = currentItems.some(ci => 
                  ci.id === originalItem.id || ci.dish_id === originalItem.dish_id
                );
                if (!stillExists) {
                  try {
                    await deleteComboGroupItemMutation.mutateAsync(originalItem.id);
                  } catch (error: any) {
                    console.error('Error deleting item:', error);
                  }
                }
              }

              // Process each current item
              for (const item of currentItems) {
                if (item.id.startsWith('temp-')) {
                  // Create new item
                  try {
                    await createComboGroupItemMutation.mutateAsync({
                      combo_group_id: processedGroup.id,
                      dish_id: item.dish_id,
                      extra_price: item.extra_price,
                    });
                  } catch (error: any) {
                    console.error('Error creating item:', error);
                  }
                } else {
                  // Check if existing item's extra_price changed
                  const originalItem = originalItemMap.get(item.id);
                  if (originalItem && originalItem.extra_price !== item.extra_price) {
                    try {
                      await updateComboGroupItemMutation.mutateAsync({
                        itemId: item.id,
                        data: {
                          extra_price: item.extra_price,
                        },
                      });
                    } catch (error: any) {
                      console.error('Error updating item:', error);
                    }
                  }
                }
              }
            } catch (groupError: any) {
              console.error('Error processing group:', groupError);
              toast.error(`Failed to process group "${group.name}": ${groupError.message}`);
            }
          }
        }

        toast.success('Combo updated successfully with all changes!');
      } else {
        savedCombo = await createComboMutation.mutateAsync({
          restaurant_id: restaurantId,
          name: combo.name,
          description: combo.description || undefined,
          pricing_mode: combo.pricing_mode.toLowerCase() as 'fixed' | 'dynamic' | 'hybrid',
          base_price: combo.base_price,
          available: combo.available,
          tags: combo.tags && combo.tags.length > 0 ? combo.tags : undefined,
          images: combo.images && combo.images.length > 0 ? combo.images : undefined,
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

      // Close dialog after a brief delay to allow query invalidation
      setTimeout(() => {
        setComboDialogOpen(false);
        setEditingCombo(null);
      }, 300);
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
        <div className="flex items-baseline gap-2">
          <h1 className="text-3xl font-bold">The Menu:</h1>
          <p className="text-muted-foreground text-lg">
            Create Dishes, Custom Combos, and Categorize them from here
          </p>
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Categories
            </div>
            <CategoryFormDialog
              open={categoryDialogOpen}
              onOpenChange={(open) => {
                setCategoryDialogOpen(open);
                if (!open) {
                  setEditingCategory(null);
                }
              }}
              editingCategory={editingCategory}
              onSubmit={onCategorySubmit}
              isCreating={createCategoryMutation.isPending}
              isUpdating={updateCategoryMutation.isPending}
            />
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
                            disabled={deleteCategoryMutation.isPending}
                          >
                            {deleteCategoryMutation.isPending ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Dishes
                </div>
                <DishFormDialog
                  open={dishDialogOpen}
                  onOpenChange={(open) => {
                    setDishDialogOpen(open);
                    if (!open) {
                      setEditingDish(null);
                      setDishImages([]);
                      setDishOptions([]);
                    }
                  }}
                  editingDish={editingDish}
                  categories={categories || []}
                  dishImages={dishImages}
                  setDishImages={setDishImages}
                  dishOptions={dishOptions}
                  setDishOptions={setDishOptions}
                  uploadingImages={uploadingImages}
                  fileInputRef={fileInputRef}
                  onImageUpload={handleImageUpload}
                  onSubmit={onDishSubmit}
                  isCreating={createDishMutation.isPending}
                  isUpdating={updateDishMutation.isPending}
                />
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
                                disabled={deleteDishMutation.isPending}
                              >
                                {deleteDishMutation.isPending ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Description */}
                          {dish.description && (
                            <p className="text-sm text-white/90 mb-2 line-clamp-2 drop-shadow">
                              {dish.description}
                            </p>
                          )}

                          {/* Dish Options */}
                          {dish.options && dish.options.length > 0 && (
                            <div className="mb-auto">
                              <p className="text-xs text-white/70 mb-1 drop-shadow">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {dish.options.slice(0, 3).map((option, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30 text-xs"
                                  >
                                    {option.name}
                                    {option.extra_cost > 0 && (
                                      <span className="ml-1 text-white/80">
                                        +{option.extra_cost}
                                      </span>
                                    )}
                                  </Badge>
                                ))}
                                {dish.options.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30 text-xs"
                                  >
                                    +{dish.options.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
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
                  onEdit={handleEditCombo}
                  onDuplicate={handleDuplicateCombo}
                  onToggleStatus={handleToggleComboStatus}
                  onDelete={handleDeleteCombo}
                  isDuplicating={operatingComboId === combo.id && comboOperation === 'duplicate'}
                  isToggling={operatingComboId === combo.id && comboOperation === 'toggle'}
                  isDeleting={operatingComboId === combo.id && comboOperation === 'delete'}
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
          isSaving={
            createComboMutation.isPending ||
            updateComboMutation.isPending ||
            createComboGroupMutation.isPending ||
            updateComboGroupMutation.isPending ||
            deleteComboGroupMutation.isPending ||
            createComboGroupItemMutation.isPending ||
            updateComboGroupItemMutation.isPending ||
            deleteComboGroupItemMutation.isPending
          }
        />
      )}
    </div>
  );
};

export default VendorMenu;

