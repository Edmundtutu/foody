import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { Plus } from 'lucide-react';
import type { MenuCategory } from '@/services/menuService';
import type { CategoryFormData } from '@/types/menu';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: MenuCategory | null;
  onSubmit: (data: CategoryFormData) => void;
  isCreating: boolean;
  isUpdating: boolean;
}

const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  open,
  onOpenChange,
  editingCategory,
  onSubmit,
  isCreating,
  isUpdating,
}) => {
  const categoryForm = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      display_order: 0,
      color_code: '#3b82f6', // Default blue color
    },
  });

  // Sync form with editing category
  React.useEffect(() => {
    if (editingCategory) {
      categoryForm.reset({
        name: editingCategory.name,
        description: editingCategory.description || '',
        display_order: editingCategory.display_order,
        color_code: editingCategory.color_code || '#3b82f6',
      });
    } else {
      categoryForm.reset({
        name: '',
        description: '',
        display_order: 0,
        color_code: '#3b82f6',
      });
    }
  }, [editingCategory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onSubmit={categoryForm.handleSubmit(onSubmit)}
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormDialog;
