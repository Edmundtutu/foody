import React, { useState } from 'react';
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

interface CategoryFormData {
  name: string;
  description?: string;
  display_order?: number;
}

interface DishFormData {
  name: string;
  description?: string;
  category_id: string;
  price: number;
  unit?: string;
  available: boolean;
  addToKitchen?: boolean;
}

const VendorMenu: React.FC = () => {
  const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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
    },
  });

  // Open category dialog for editing
  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
    });
    setCategoryDialogOpen(true);
  };

  // Open dish dialog for editing
  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish);
    dishForm.reset({
      name: dish.name,
      description: dish.description || '',
      category_id: dish.category_id || '',
      price: dish.price,
      unit: dish.unit || '',
      available: dish.available,
      addToKitchen: false,
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

  // Handle dish form submission
  const onDishSubmit = async (data: DishFormData) => {
    if (!restaurantId) {
      toast.error('No restaurant selected');
      return;
    }

    try {
      let createdDish: Dish;
      if (editingDish) {
        createdDish = await updateDishMutation.mutateAsync({
          dishId: editingDish.id,
          data: {
            ...data,
            restaurant_id: restaurantId,
          },
        });
        toast.success('Dish updated successfully');
      } else {
        createdDish = await createDishMutation.mutateAsync({
          ...data,
          restaurant_id: restaurantId,
        });
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
                dishForm.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
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
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
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
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">
                      {dishesByCategory[category.id]?.length || 0} dishes
                    </Badge>
                  </CardContent>
                </Card>
              ))}
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
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
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
              {filteredDishes.map((dish: Dish) => (
                <Card key={dish.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{dish.name}</CardTitle>
                        {dish.category && (
                          <Badge variant="outline" className="mt-1">
                            {dish.category.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDish(dish)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDish(dish.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dish.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {dish.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        {dish.price.toLocaleString()} UGX
                        {dish.unit && ` / ${dish.unit}`}
                      </span>
                      <Badge
                        variant={dish.available ? 'default' : 'secondary'}
                      >
                        {dish.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorMenu;

