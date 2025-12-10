export interface CategoryFormData {
  name: string;
  description?: string;
  display_order?: number;
  color_code?: string;
}

export interface DishFormData {
  name: string;
  description?: string;
  category_id: string;
  price: number;
  unit?: string;
  available: boolean;
  addToKitchen?: boolean;
  images?: string[];
  options?: Array<{
    name: string;
    extra_cost: number;
    required: boolean;
  }>;
}
