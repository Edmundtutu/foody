import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Star, 
  Heart, 
  MapPin, 
  Share,
  Plus,
  Minus,
  HandPlatter
} from 'lucide-react';
import { useDish } from '@/hooks/queries/useDishes';
import { useQuery } from '@tanstack/react-query';
import menuService, { type DishOption } from '@/services/menuService';
import { useToast } from '@/hooks/use-toast';
import { useMeal } from '@/context/MealContext';
import api from '@/services/api';
import type { ApiResponse } from '@/types/api';

interface Review {
  id: string;
  user: {
    id: string;
    name: string;
  };
  rating: number;
  comment: string | null;
  created_at: string;
}

const DishDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToMeal } = useMeal();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<DishOption[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: dish, isLoading: loadingDish } = useDish(id || null);
  const { data: dishOptions, isLoading: loadingOptions } = useQuery<DishOption[]>({
    queryKey: ['dish-options', id],
    queryFn: () => menuService.getDishOptions(id!),
    enabled: !!id,
  });

  const { data: reviews, isLoading: loadingReviews } = useQuery<Review[]>({
    queryKey: ['dish-reviews', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Review[]>>('/v1/reviews', {
        params: {
          reviewable_type: 'dish',
          reviewable_id: id,
        },
      });
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      return [];
    },
    enabled: !!id,
  });

  const handleToggleOption = (option: DishOption) => {
    setSelectedOptions((prev) => {
      const exists = prev.find((o) => o.id === option.id);
      if (exists) {
        return prev.filter((o) => o.id !== option.id);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleAddToMeal = () => {
    if (!dish) return;
    
    // Validate required options
    const requiredOptions = dishOptions?.filter((opt) => opt.required) || [];
    const selectedRequired = requiredOptions.filter((opt) =>
      selectedOptions.some((sel) => sel.id === opt.id)
    );
    
    if (requiredOptions.length > 0 && selectedRequired.length !== requiredOptions.length) {
      toast({
        title: 'Required options missing',
        description: 'Please select all required options before adding to meal.',
        variant: 'destructive',
      });
      return;
    }

    addToMeal(dish, quantity, selectedOptions);
    toast({
      title: 'Added to Meal',
      description: `${dish.name} added to your meal.`,
    });
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    
    try {
      await api.post<ApiResponse<Review>>('/v1/reviews', {
        reviewable_type: 'dish',
        reviewable_id: id,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      
      toast({
        title: 'Review submitted',
        description: 'Thank you for your review!',
      });
      
      setNewReview({ rating: 5, comment: '' });
      setShowReviewForm(false);
      // Invalidate reviews query to refetch
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const calculateTotalPrice = () => {
    if (!dish) return 0;
    const basePrice = dish.price;
    const optionsPrice = selectedOptions.reduce((sum, opt) => sum + opt.extra_cost, 0);
    return (basePrice + optionsPrice) * quantity;
  };

  if (loadingDish) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Dish not found</h2>
            <p className="text-muted-foreground mb-4">
              The dish you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/find-food">Browse Dishes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredOptions = dishOptions?.filter((opt) => opt.required) || [];
  const optionalOptions = dishOptions?.filter((opt) => !opt.required) || [];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dish Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {dish.images && dish.images.length > 0 ? (
              <img
                src={dish.images[0]}
                alt={dish.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e0e0e0/555555?text=Food';
                }}
              />
            ) : (
              <div className="text-6xl">🍽️</div>
            )}
          </div>
          {dish.images && dish.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {dish.images.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition"
                >
                  <img
                    src={img}
                    alt={`${dish.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dish Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{dish.name}</h1>
            {dish.restaurant && (
              <Link
                to={`/restaurants/${dish.restaurant.id}`}
                className="text-primary hover:underline"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {dish.restaurant.name}
                </div>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      dish.rating && star <= dish.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {dish.rating && (
                <>
                  <span className="font-medium">{dish.rating}</span>
                  <span className="text-muted-foreground">
                    ({dish.total_reviews || 0} reviews)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-3xl font-bold">
            UGX {calculateTotalPrice().toLocaleString()}
            {selectedOptions.length > 0 && (
              <span className="text-sm text-muted-foreground font-normal ml-2">
                (base: UGX {dish.price.toLocaleString()})
              </span>
            )}
          </div>

          {dish.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{dish.description}</p>
            </div>
          )}

          {/* Dish Options Section */}
          {dishOptions && dishOptions.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-lg">Customize Your Dish</h3>
              
              {/* Required Options */}
              {requiredOptions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-destructive">
                    Required Options *
                  </p>
                  {requiredOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        id={`option-${option.id}`}
                        checked={selectedOptions.some((o) => o.id === option.id)}
                        onCheckedChange={() => handleToggleOption(option)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`option-${option.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {option.name}
                          {option.extra_cost > 0 && (
                            <span className="text-primary ml-2">
                              (+UGX {option.extra_cost.toLocaleString()})
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional Options */}
              {optionalOptions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Optional Add-ons
                  </p>
                  {optionalOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition"
                    >
                      <Checkbox
                        id={`option-${option.id}`}
                        checked={selectedOptions.some((o) => o.id === option.id)}
                        onCheckedChange={() => handleToggleOption(option)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`option-${option.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {option.name}
                          {option.extra_cost > 0 && (
                            <span className="text-primary ml-2">
                              (+UGX {option.extra_cost.toLocaleString()})
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant={dish.available ? 'default' : 'destructive'}>
              {dish.available ? 'Available' : 'Out of stock'}
            </Badge>
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToMeal}
              disabled={!dish.available}
            >
              <HandPlatter className="h-5 w-5 mr-2" />
              Add to Meal
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/my-meal')}
            >
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6 border-t pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reviews</h2>
          <Button onClick={() => setShowReviewForm(!showReviewForm)}>
            Write a Review
          </Button>
        </div>

        {showReviewForm && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${
                          star <= newReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    placeholder="Share your experience with this dish..."
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview}>Submit Review</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loadingReviews ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">
                Be the first to review this dish!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {review.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{review.user.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.comment && <p>{review.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DishDetail;

