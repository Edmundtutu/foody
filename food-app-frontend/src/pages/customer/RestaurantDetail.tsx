import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MapPin, 
  Phone,
  Mail,
  Navigation,
  ArrowLeft,
  ChefHat,
  Package,
} from 'lucide-react';
import { useRestaurant } from '@/hooks/queries/useRestaurants';
import { useDishes } from '@/hooks/queries/useDishes';
import { useCombos } from '@/hooks/queries/useCombos';
import DishCard from '@/components/customer/discovery/DishCard';
import ComboCard from '@/components/customer/discovery/ComboCard';
import { formatDistance } from '@/utils/location';
import { useGeolocation } from '@/hooks/utils/useGeolocation';
import { useNavbar } from '@/layouts/MainLayout';

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { location: userLocation } = useGeolocation();
  const [activeTab, setActiveTab] = useState<'dishes' | 'combos'>('dishes');
  const { setMobileHeader } = useNavbar();

  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurant(id);
  const { data: dishes = [], isLoading: loadingDishes } = useDishes({
    restaurant_id: id,
    available: true,
  });
  const { data: combos = [], isLoading: loadingCombos } = useCombos({
    restaurant_id: id,
    available: true,
  });

  // Nav-minimizer: Setup custom mobile header
  useEffect(() => {
    setMobileHeader(
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
            {restaurant?.name || 'Restaurant'}
          </h1>
        </div>
      </header>
    );

    return () => {
      setMobileHeader(null);
    };
  }, [setMobileHeader, navigate, restaurant?.name]);

  if (loadingRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Restaurant not found</h2>
            <p className="text-muted-foreground mb-4">
              The restaurant you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/find-food">Browse Restaurants</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate distance if user location is available
  let distance: number | null = null;
  if (userLocation && restaurant.latitude && restaurant.longitude) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((restaurant.latitude - userLocation.lat) * Math.PI) / 180;
    const dLng = ((restaurant.longitude - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((restaurant.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance = R * c;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Restaurant Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Restaurant Icon/Image */}
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <ChefHat className="h-12 w-12 text-primary" />
            </div>

            {/* Restaurant Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                  <Badge variant={restaurant.verification_status === 'verified' ? 'default' : 'secondary'}>
                    {restaurant.verification_status === 'verified' ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
                
                {restaurant.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(restaurant.rating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{restaurant.rating}</span>
                    <span className="text-muted-foreground">
                      ({restaurant.total_reviews || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              {restaurant.description && (
                <p className="text-muted-foreground">{restaurant.description}</p>
              )}

              <div className="space-y-2">
                {restaurant.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{restaurant.address}</span>
                    {distance !== null && (
                      <span className="text-sm text-primary font-medium ml-2">
                        • {formatDistance(distance)}
                      </span>
                    )}
                  </div>
                )}
                
                {restaurant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${restaurant.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}

                {restaurant.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${restaurant.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {restaurant.email}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {restaurant.latitude && restaurant.longitude && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                )}
                {restaurant.phone && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(`tel:${restaurant.phone}`, '_self')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Section with Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Menu</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('dishes')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'dishes'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ChefHat className="h-4 w-4" />
            Dishes
            <Badge variant={activeTab === 'dishes' ? 'default' : 'outline'}>
              {dishes.length}
            </Badge>
            {activeTab === 'dishes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('combos')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'combos'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            Combos
            <Badge variant={activeTab === 'combos' ? 'default' : 'outline'}>
              {combos.length}
            </Badge>
            {activeTab === 'combos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Dishes Tab Content */}
        {activeTab === 'dishes' && (
          <>
            {loadingDishes ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : dishes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No dishes available</h3>
                  <p className="text-muted-foreground">
                    This restaurant hasn't added any dishes yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Combos Tab Content */}
        {activeTab === 'combos' && (
          <>
            {loadingCombos ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : combos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No combos available</h3>
                  <p className="text-muted-foreground">
                    This restaurant hasn't added any combos yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {combos.map((combo) => (
                  <ComboCard key={combo.id} combo={combo} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;

