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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import type { Dish, MenuCategory } from '@/services/menuService';
import type { DishFormData } from '@/types/menu';
import DishOptionsManager from './DishOptionsManager';
import ImageUploadSection from './ImageUploadSection';

interface DishFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDish: Dish | null;
  categories: MenuCategory[];
  dishImages: string[];
  setDishImages: (images: string[]) => void;
  dishOptions: Array<{ name: string; extra_cost: number; required: boolean }>;
  setDishOptions: (options: Array<{ name: string; extra_cost: number; required: boolean }>) => void;
  uploadingImages: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageUpload: (files: FileList | null) => void;
  onSubmit: (data: DishFormData) => void;
  isCreating: boolean;
  isUpdating: boolean;
}

const DishFormDialog: React.FC<DishFormDialogProps> = ({
  open,
  onOpenChange,
  editingDish,
  categories,
  dishImages,
  setDishImages,
  dishOptions,
  setDishOptions,
  uploadingImages,
  fileInputRef,
  onImageUpload,
  onSubmit,
  isCreating,
  isUpdating,
}) => {
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
      options: [],
    },
  });

  // Sync form with editing dish
  React.useEffect(() => {
    if (editingDish) {
      dishForm.reset({
        name: editingDish.name,
        description: editingDish.description || '',
        category_id: editingDish.category_id || '',
        price: editingDish.price,
        unit: editingDish.unit || '',
        available: editingDish.available,
        addToKitchen: false,
        images: dishImages,
        options: dishOptions,
      });
    } else {
      dishForm.reset({
        name: '',
        description: '',
        category_id: '',
        price: 0,
        unit: '',
        available: true,
        addToKitchen: false,
        images: [],
        options: [],
      });
    }
  }, [editingDish, dishImages, dishOptions]);

  // Update form values when images or options change
  React.useEffect(() => {
    dishForm.setValue('images', dishImages);
  }, [dishImages]);

  React.useEffect(() => {
    dishForm.setValue('options', dishOptions);
  }, [dishOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onSubmit={dishForm.handleSubmit(onSubmit)}
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

            {/* Dish Options Section */}
            <DishOptionsManager
              options={dishOptions}
              onOptionsChange={setDishOptions}
            />

            {/* Images Section */}
            <ImageUploadSection
              images={dishImages}
              onImagesChange={setDishImages}
              onImageUpload={onImageUpload}
              isUploading={uploadingImages}
              fileInputRef={fileInputRef}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {editingDish ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DishFormDialog;
