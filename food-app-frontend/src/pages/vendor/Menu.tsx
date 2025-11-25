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
import { useCreateNode } from '@/hooks/queries/useKitchenNodes';
import { MenuItemsSkeleton } from '@/components/vendor/LoadingSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { MenuCategory, Dish } from '@/services/menuService';
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

// Helper function to get full image URL
// Backend should return absolute URLs like http://localhost:8000/storage/dishes/... or https://domain.com/storage/dishes/...
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

const VendorMenu: React.FC = () => {
  const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [dishImages, setDishImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories and dishes
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useMenuCategories(
    restaurantId || null
  );
  const { data: dishes, isLoading: dishesLoading, error: dishesError } = useDishes(
    restaurantId ? { restaurant_id: restaurantId } : undefined
  );

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

  // Mutations
  const createCategoryMutation = useCreateMenuCategory();
  const updateCategoryMutation = useUpdateMenuCategory();
  const deleteCategoryMutation = useDeleteMenuCategory();
  const createDishMutation = useCreateDish();
  const updateDishMutation = useUpdateDish();
  const deleteDishMutation = useDeleteDish();
  const createNodeMutation = useCreateNode();

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

      {/* Dishes Section */}
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
    </div>
  );
};

export default VendorMenu;

