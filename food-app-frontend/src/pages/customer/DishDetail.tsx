import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Star, 
  MapPin, 
  Share,
  Plus,
  Minus,
  ArrowLeft,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Dish from '@/assets/icons/dish.svg?react';
import { useDish } from '@/hooks/queries/useDishes';
import { useQuery } from '@tanstack/react-query';
import menuService, { type DishOption } from '@/services/menuService';
import { useToast } from '@/hooks/use-toast';
import { useMeal } from '@/context/MealContext';
import { useNavbar } from '@/layouts/MainLayout';
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
  const { setMobileHeader, setHideMobileBottomNav } = useNavbar();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<DishOption[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Bottom sheet drag state
  const [sheetHeight, setSheetHeight] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(50);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { data: dish, isLoading: loadingDish } = useDish(id || null);
  const { data: dishOptions } = useQuery<DishOption[]>({
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

  // Setup nav-minimizer for mobile
  useEffect(() => {
    // Hide mobile navbar and bottom nav for immersive experience
    setHideMobileBottomNav(true);
    setMobileHeader(null);

    // Cleanup on unmount
    return () => {
      setHideMobileBottomNav(false);
      setMobileHeader(undefined);
    };
  }, [setMobileHeader, setHideMobileBottomNav]);

  const handleNextImage = () => {
    if (dish?.images && dish.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % (dish.images?.length || 1));
    }
  };

  const handlePrevImage = () => {
    if (dish?.images && dish.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + (dish.images?.length || 1)) % (dish.images?.length || 1));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dish?.name,
          text: `Check out ${dish?.name}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      });
    }
  };

  // Bottom sheet drag handlers
  const handleSheetTouchStart = React.useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setDragStartHeight(sheetHeight);
  }, [sheetHeight]);

  const handleSheetTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = dragStartY - currentY;
    const viewportHeight = window.innerHeight;
    const deltaPercentage = (deltaY / viewportHeight) * 100;
    
    const newHeight = Math.min(90, Math.max(35, dragStartHeight + deltaPercentage));
    setSheetHeight(newHeight);
  }, [isDragging, dragStartY, dragStartHeight]);

  const handleSheetTouchEnd = React.useCallback(() => {
    setIsDragging(false);
    
    // Snap to nearest position
    if (sheetHeight > 70) {
      setSheetHeight(90); // Expanded
    } else if (sheetHeight < 45) {
      setSheetHeight(35); // Collapsed
    } else {
      setSheetHeight(50); // Resting position
    }
  }, [sheetHeight]);

  const handleSheetMouseDown = React.useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(sheetHeight);
  }, [sheetHeight]);

  // Handle scroll-triggered expansion
  const handleContentScroll = React.useCallback(() => {
    const content = contentRef.current;
    if (!content || sheetHeight >= 90) return;
    
    // If user scrolls down within content, expand sheet to full height
    if (content.scrollTop > 5) {
      setSheetHeight(90);
    }
  }, [sheetHeight]);

  const handleSheetMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const deltaY = dragStartY - currentY;
    const viewportHeight = window.innerHeight;
    const deltaPercentage = (deltaY / viewportHeight) * 100;
    
    const newHeight = Math.min(90, Math.max(35, dragStartHeight + deltaPercentage));
    setSheetHeight(newHeight);
  };

  const handleSheetMouseUp = () => {
    setIsDragging(false);
    
    // Snap to nearest position
    if (sheetHeight > 70) {
      setSheetHeight(90); // Expanded
    } else if (sheetHeight < 45) {
      setSheetHeight(35); // Collapsed
    } else {
      setSheetHeight(50); // Resting position
    }
  };

  // Mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleSheetMouseMove);
      window.addEventListener('mouseup', handleSheetMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleSheetMouseMove);
        window.removeEventListener('mouseup', handleSheetMouseUp);
      };
    }
  }, [isDragging, dragStartY, dragStartHeight, sheetHeight]);

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

  const images = dish.images && dish.images.length > 0 ? dish.images : ['https://placehold.co/400x600/e0e0e0/555555?text=Food'];

  return (
    <>
      {/* MOBILE VIEW - Immersive Experience */}
      <div className="lg:hidden fixed inset-0 bg-black overflow-hidden">
        {/* Full-Screen Image Carousel */}
        <div className="relative h-[60vh] w-full">
          {/* Image Slides */}
          <div className="relative w-full h-full">
            {images.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={img}
                  alt={`${dish.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/e0e0e0/555555?text=Food';
                  }}
                />
                {/* Gradient overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
              </div>
            ))}
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className="h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
              >
                <Share className="h-5 w-5 text-gray-900" />
              </Button>
            </div>
          </div>

          {/* Image Navigation Arrows (if multiple images) */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-lg backdrop-blur-sm flex items-center justify-center transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-lg backdrop-blur-sm flex items-center justify-center transition-all"
              >
                <ChevronRight className="h-5 w-5 text-gray-900" />
              </button>
            </>
          )}

          {/* Slide Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-6 right-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
              <span className="text-white text-sm font-medium">
                {currentImageIndex + 1} / {images.length}
              </span>
            </div>
          )}

          {/* Dot Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Sheet Panel */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out"
          style={{ 
            height: `${sheetHeight}vh`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Sheet Handle - Draggable area */}
          <div 
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onMouseDown={handleSheetMouseDown}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Scrollable Content */}
          <div 
            ref={contentRef}
            onScroll={handleContentScroll}
            className="flex-1 overflow-y-auto px-6 pb-24"
          >
            {/* Header Section */}
            <div className="space-y-4 pb-4 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{dish.name}</h1>
                {dish.restaurant && (
                  <Link
                    to={`/restaurants/${dish.restaurant.id}`}
                    className="flex items-center gap-2 text-primary hover:underline w-fit"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{dish.restaurant.name}</span>
                  </Link>
                )}
              </div>

              {/* Rating & Reviews Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          dish.rating && star <= dish.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {dish.rating && (
                    <>
                      <span className="font-semibold text-sm">{dish.rating}</span>
                      <span className="text-muted-foreground text-sm">
                        ({dish.total_reviews || 0})
                      </span>
                    </>
                  )}
                </div>
                <Badge variant={dish.available ? 'default' : 'destructive'} className="text-xs">
                  {dish.available ? 'Available' : 'Out of stock'}
                </Badge>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  UGX {calculateTotalPrice().toLocaleString()}
                </span>
                {selectedOptions.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    (base: UGX {dish.price.toLocaleString()})
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {dish.description && (
              <div className="py-4 border-b border-gray-200">
                <h3 className="font-bold text-sm text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{dish.description}</p>
              </div>
            )}

            {/* Customize Options */}
            {dishOptions && dishOptions.length > 0 && (
              <div className="py-4 space-y-4 border-b border-gray-200">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded"></div>
                  Customize Your Dish
                </h3>

                {/* Required Options */}
                {requiredOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                      <span className="text-base">*</span> Required
                    </p>
                    {requiredOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <Checkbox
                          id={`mobile-option-${option.id}`}
                          checked={selectedOptions.some((o) => o.id === option.id)}
                          onCheckedChange={() => handleToggleOption(option)}
                        />
                        <label
                          htmlFor={`mobile-option-${option.id}`}
                          className="flex-1 text-sm font-medium cursor-pointer"
                        >
                          {option.name}
                          {option.extra_cost > 0 && (
                            <span className="text-primary ml-2">
                              (+UGX {option.extra_cost.toLocaleString()})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Options */}
                {optionalOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-blue-700">Optional Add-ons</p>
                    {optionalOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-xl"
                      >
                        <Checkbox
                          id={`mobile-option-${option.id}`}
                          checked={selectedOptions.some((o) => o.id === option.id)}
                          onCheckedChange={() => handleToggleOption(option)}
                        />
                        <label
                          htmlFor={`mobile-option-${option.id}`}
                          className="flex-1 text-sm font-medium cursor-pointer"
                        >
                          {option.name}
                          {option.extra_cost > 0 && (
                            <span className="text-primary ml-2">
                              (+UGX {option.extra_cost.toLocaleString()})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Section */}
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded"></div>
                  Reviews
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  Write Review
                </Button>
              </div>

              {showReviewForm && (
                <div className="space-y-3 p-4 border-2 border-primary rounded-xl bg-primary/5">
                  <div>
                    <label className="block text-xs font-bold mb-2">Rating</label>
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
                    <label className="block text-xs font-bold mb-2">Comment</label>
                    <Textarea
                      placeholder="Share your experience..."
                      value={newReview.comment}
                      onChange={(e) =>
                        setNewReview({ ...newReview, comment: e.target.value })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmitReview}>Submit</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {loadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <p>No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 border border-gray-200 rounded-xl bg-white">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground text-sm font-medium">
                            {review.user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{review.user.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30 safe-area-bottom">
          <div className="px-6 py-4 flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-gray-50 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-3 py-2 min-w-[2.5rem] text-center font-bold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Add to Meal Button */}
            <Button
              size="lg"
              className="flex-1 h-12 shadow-lg font-bold"
              onClick={handleAddToMeal}
              disabled={!dish.available}
            >
            <Dish className="h-5 w-5 mr-2" />
              Add to Meal · UGX {calculateTotalPrice().toLocaleString()}
            </Button>
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW - Keep existing design */}
      <div className="hidden lg:block min-h-screen bg-gray-100 py-6">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Dish Images */}
        {/* Dish Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden border border-gray-200">
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
                  className="aspect-square bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-md hover:scale-105 transition-all border border-gray-200"
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
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
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
            <div className="space-y-4 border-t-2 border-gray-200 pt-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded"></div>
                Customize Your Dish
              </h3>
              
              {/* Required Options */}
              {requiredOptions.length > 0 && (
                <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                    <span className="text-lg">*</span> Required Options
                  </p>
                  {requiredOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-start space-x-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-primary transition-colors shadow-sm"
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
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-bold text-blue-700">
                    Optional Add-ons
                  </p>
                  {optionalOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-start space-x-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
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

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center border-2 border-gray-200 rounded-lg shadow-sm bg-white">
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

          <div className="flex gap-4 pt-2">
            <Button
              size="lg"
              className="flex-1 shadow-md"
              onClick={handleAddToMeal}
              disabled={!dish.available}
            >
              <Dish className="h-5 w-5 mr-2" />
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
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-1 h-8 bg-primary rounded"></div>
            Reviews
          </h2>
          <Button onClick={() => setShowReviewForm(!showReviewForm)} className="shadow-sm">
            Write a Review
          </Button>
        </div>

        {showReviewForm && (
          <Card className="border-2 border-primary shadow-md">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4 text-lg">Write a Review</h3>
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
              <Card key={review.id} className="border-2 border-gray-200 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
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
      </div>
      </div>
    </>
  );
};

export default DishDetail;

