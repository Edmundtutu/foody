import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  MapPin, 
  Navigation,
  Crosshair,
  Filter,
  X,
  Phone,
  Star,
} from 'lucide-react';
import type { Restaurant } from '@/services/restaurantService';
import { useGeolocation } from '@/hooks/utils/useGeolocation';
import { formatDistance } from '@/utils/location';
import RestaurantMarker from './RestaurantMarker';
import { useRestaurants } from '@/hooks/queries/useRestaurants';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RestaurantMapProps {
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  className?: string;
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({ 
  onRestaurantSelect, 
  className = "",
}) => {
  const { location: userLocation, error, loading, requestLocation } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState([20]); // km
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [sheetPosition, setSheetPosition] = useState<'collapsed' | 'mid' | 'expanded'>('mid');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Default center (Kampala, Uganda)
  const defaultCenter: [number, number] = [0.3211264, 32.5910528];
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : defaultCenter;

  // Only fetch restaurants if we have user location (location-based search)
  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants(
    userLocation ? {
      name: searchQuery || undefined,
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: searchRadius[0],
      verification_status: 'verified',
    } : undefined
  );

  // Request location on mount
  useEffect(() => {
    if (!userLocation && !loading) {
      requestLocation();
    }
  }, [userLocation, loading, requestLocation]);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    // On mobile, show the details in bottom sheet
    if (window.innerWidth < 1024) {
      setSheetPosition('mid');
    }
  };

  const handleViewRestaurant = () => {
    if (selectedRestaurant) {
      onRestaurantSelect?.(selectedRestaurant);
      setSelectedRestaurant(null);
    }
  };

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe) {
      // Swipe up - expand to show only results
      if (sheetPosition === 'collapsed') {
        setSheetPosition('mid');
      } else if (sheetPosition === 'mid') {
        setSheetPosition('expanded');
      }
    }
    
    if (isDownSwipe) {
      // Swipe down - collapse to show only map
      if (sheetPosition === 'expanded') {
        setSheetPosition('mid');
      } else if (sheetPosition === 'mid') {
        setSheetPosition('collapsed');
      }
    }
  };

  // Calculate bottom sheet position based on state
  const getSheetPosition = () => {
    switch (sheetPosition) {
      case 'collapsed':
        return { bottom: '0px', height: '60px' }; // Only show drag handle
      case 'expanded':
        return { bottom: '0px', height: '85vh' }; // Almost full screen
      case 'mid':
      default:
        return { bottom: '0px', height: '40vh' }; // Mid position (default)
    }
  };

  const sheetStyle = getSheetPosition();

  return (
    <div className={`${className} flex flex-col h-screen`}>
      {/* Search and Controls */}
      <div className="flex-shrink-0 space-y-3 p-4 pb-0 lg:p-0 lg:pb-4">
        <div className="flex gap-3">
          <form 
            onSubmit={(e) => e.preventDefault()} 
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 w-8"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={requestLocation}
                disabled={loading}
                className="h-8 w-8"
                title="Update location"
              >
                <Crosshair className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </form>

          <Badge variant="outline" className="px-3 py-2 whitespace-nowrap hidden sm:flex">
            {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
          </Badge>
        </div>

        {showFilters && (
          <Card className="lg:max-w-md">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Search Radius: {searchRadius[0]} km
                </label>
                <Slider
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {restaurants.length} restaurants found
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {typeof error === 'string' ? error : (error as Error).message || 'An error occurred'}
          </div>
        )}

        {!userLocation && !loading && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            Please enable location access to see nearby restaurants
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-0 pt-0 lg:p-0 lg:pt-4">
        {/* Map Container */}
        <div className="flex-1 rounded-none overflow-hidden min-h-[400px] lg:min-h-[500px]">
          <Card className="h-full border-0 rounded-none">
            <CardContent className="p-0 h-full">
              {restaurantsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                  center={mapCenter}
                  zoom={userLocation ? 14 : 12}
                  style={{ height: '100%', width: '100%', zIndex: 1 }}
                  className="rounded-none"
                  scrollWheelZoom={true}
                  dragging={true}
                  touchZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* User location marker */}
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>
                        <div className="text-center p-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <Navigation className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-sm font-medium">Your location</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Restaurant markers */}
                  {restaurants.map((restaurant) => (
                    <RestaurantMarker
                      key={restaurant.id}
                      restaurant={restaurant}
                      onMarkerClick={handleRestaurantClick}
                    />
                  ))}
                </MapContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Sidebar - Only on large screens */}
        <div className="hidden lg:flex lg:flex-col w-80 xl:w-96 flex-shrink-0 space-y-4">
          {selectedRestaurant ? (
            <Card className="flex-1">
              <CardContent className="p-4 space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedRestaurant.name}</h3>
                    <div className="flex items-center gap-2">
                      {selectedRestaurant.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{selectedRestaurant.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({selectedRestaurant.total_reviews || 0})
                          </span>
                        </div>
                      )}
                      <Badge variant={selectedRestaurant.verification_status === 'verified' ? 'default' : 'secondary'}>
                        {selectedRestaurant.verification_status === 'verified' ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedRestaurant.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRestaurant.description}
                  </p>
                )}

                <div className="space-y-2">
                  {selectedRestaurant.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedRestaurant.address}</span>
                    </div>
                  )}
                  
                  {selectedRestaurant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${selectedRestaurant.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedRestaurant.phone}
                      </a>
                    </div>
                  )}
                  
                  {selectedRestaurant.distance && (
                    <div className="text-sm text-primary font-medium">
                      {formatDistance(selectedRestaurant.distance)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button 
                    className="flex-1"
                    onClick={handleViewRestaurant}
                  >
                    View Dishes
                  </Button>
                  {selectedRestaurant.latitude && selectedRestaurant.longitude && (
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.latitude},${selectedRestaurant.longitude}`;
                        window.open(url, '_blank');
                      }}
                      title="Get directions"
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedRestaurant.phone && (
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`tel:${selectedRestaurant.phone}`, '_self')}
                      title="Call restaurant"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1">
              <CardContent className="p-6 text-center h-full flex flex-col items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Select a restaurant</h3>
                <p className="text-sm text-muted-foreground">
                  Click on a marker to view restaurant details
                </p>
              </CardContent>
            </Card>
          )}

          {/* Nearby Restaurants List */}
          <Card className="flex-1 max-h-80">
            <CardContent className="p-4 h-full flex flex-col">
              <h3 className="font-medium mb-3">
                Nearby Restaurants ({restaurants.length})
              </h3>
              {restaurants.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center">
                    {userLocation ? 'No restaurants found in your area' : 'Enable location to see nearby restaurants'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {restaurants.slice(0, 10).map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                        selectedRestaurant?.id === restaurant.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleRestaurantClick(restaurant)}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        <span className="text-sm">🍽️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{restaurant.name}</h4>
                        <div className="flex items-center gap-2">
                          {restaurant.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{restaurant.rating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({restaurant.total_reviews || 0})
                              </span>
                            </div>
                          )}
                          {restaurant.distance && (
                            <span className="text-xs text-primary">
                              {formatDistance(restaurant.distance)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Sheet - Restaurant List & Details */}
      <div 
        className="lg:hidden fixed left-0 right-0 bg-background border-t rounded-t-lg shadow-lg z-50 transition-all duration-300 ease-out flex flex-col"
        style={{
          bottom: sheetStyle.bottom,
          height: sheetStyle.height,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
        </div>
        
        {/* Restaurant List */}
        {!selectedRestaurant ? (
          <div className={`overflow-y-auto ${sheetPosition === 'collapsed' ? 'h-0 overflow-hidden' : 'flex-1'}`}>
            <div className="px-4 py-2 border-b">
              <h3 className="font-medium text-sm">
                Nearby Restaurants ({restaurants.length})
              </h3>
            </div>
            {restaurants.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {userLocation ? 'No restaurants found in your area' : 'Enable location to see nearby restaurants'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors active:bg-accent"
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                      <span className="text-base">🍽️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{restaurant.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {restaurant.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{restaurant.rating}</span>
                            <span className="text-xs text-muted-foreground">
                              ({restaurant.total_reviews || 0})
                            </span>
                          </div>
                        )}
                        {restaurant.distance && (
                          <span className="text-xs text-primary">
                            {formatDistance(restaurant.distance)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Selected Restaurant Details */
          <div className={`overflow-y-auto ${sheetPosition === 'collapsed' ? 'h-0 overflow-hidden' : 'flex-1'}`}>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedRestaurant.name}</h3>
                  <div className="flex items-center gap-2">
                    {selectedRestaurant.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{selectedRestaurant.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({selectedRestaurant.total_reviews || 0})
                        </span>
                      </div>
                    )}
                    <Badge variant={selectedRestaurant.verification_status === 'verified' ? 'default' : 'secondary'}>
                      {selectedRestaurant.verification_status === 'verified' ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRestaurant(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {selectedRestaurant.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedRestaurant.description}
                </p>
              )}

              <div className="space-y-2">
                {selectedRestaurant.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedRestaurant.address}</span>
                  </div>
                )}
                
                {selectedRestaurant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${selectedRestaurant.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedRestaurant.phone}
                    </a>
                  </div>
                )}
                
                {selectedRestaurant.distance && (
                  <div className="text-sm text-primary font-medium">
                    {formatDistance(selectedRestaurant.distance)}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={handleViewRestaurant}
                >
                  View Dishes
                </Button>
                {selectedRestaurant.latitude && selectedRestaurant.longitude && (
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.latitude},${selectedRestaurant.longitude}`;
                      window.open(url, '_blank');
                    }}
                    title="Get directions"
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                )}
                {selectedRestaurant.phone && (
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`tel:${selectedRestaurant.phone}`, '_self')}
                    title="Call restaurant"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantMap;