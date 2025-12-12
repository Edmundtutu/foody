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
  ArrowLeft,
} from 'lucide-react';
import type { Restaurant } from '@/services/restaurantService';
import { useGeolocation } from '@/hooks/utils/useGeolocation';
import { formatDistance } from '@/utils/location';
import RestaurantMarker from './RestaurantMarker';
import { useRestaurants } from '@/hooks/queries/useRestaurants';
import { useNavbar } from '@/layouts/MainLayout';
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
  const { setMobileHeader, setHideMobileBottomNav } = useNavbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState([20]); // km
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [sheetHeight, setSheetHeight] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(40);
  const contentRef = React.useRef<HTMLDivElement>(null);

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

  // Setup nav-minimizer for mobile immersive experience
  useEffect(() => {
    // Hide mobile navbar for immersive experience but keep bottom nav visible
    setMobileHeader(null);

    // Cleanup on unmount
    return () => {
      setMobileHeader(undefined);
    };
  }, [setMobileHeader, setHideMobileBottomNav]);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    // Expand sheet to show details
    if (window.innerWidth < 1024) {
      setSheetHeight(60);
    }
  };

  const handleViewRestaurant = () => {
    if (selectedRestaurant) {
      onRestaurantSelect?.(selectedRestaurant);
      setSelectedRestaurant(null);
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
    
    const newHeight = Math.min(70, Math.max(25, dragStartHeight + deltaPercentage));
    setSheetHeight(newHeight);
  }, [isDragging, dragStartY, dragStartHeight]);

  const handleSheetTouchEnd = React.useCallback(() => {
    setIsDragging(false);
    
    // Snap to nearest position
    if (sheetHeight > 55) {
      setSheetHeight(70); // Expanded
    } else if (sheetHeight < 35) {
      setSheetHeight(25); // Collapsed
    } else {
      setSheetHeight(40); // Resting position
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
    if (!content || sheetHeight >= 70) return;
    
    // If user scrolls down within content, expand sheet to full height
    if (content.scrollTop > 5) {
      setSheetHeight(70);
    }
  }, [sheetHeight]);

  const handleSheetMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const deltaY = dragStartY - currentY;
    const viewportHeight = window.innerHeight;
    const deltaPercentage = (deltaY / viewportHeight) * 100;
    
    const newHeight = Math.min(70, Math.max(25, dragStartHeight + deltaPercentage));
    setSheetHeight(newHeight);
  };

  const handleSheetMouseUp = () => {
    setIsDragging(false);
    
    // Snap to nearest position
    if (sheetHeight > 55) {
      setSheetHeight(70); // Expanded
    } else if (sheetHeight < 35) {
      setSheetHeight(25); // Collapsed
    } else {
      setSheetHeight(40); // Resting position
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

  return (
    <>
      {/* MOBILE VIEW - Immersive Experience */}
      <div className="lg:hidden fixed inset-0 bg-white overflow-hidden">
        {/* Full-Bleed Map Container (60vh) */}
        <div className="relative h-[60vh] w-full">
          {/* Floating Back Button */}
          <div className="absolute top-4 left-4 z-[1000]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </Button>
          </div>

          {/* Floating Search Bar */}
          <div className="absolute top-4 left-16 right-4 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200">
              <form 
                onSubmit={(e) => e.preventDefault()} 
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-20 border-0 bg-transparent rounded-full h-12"
                />
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-9 w-9 rounded-full"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={requestLocation}
                    disabled={loading}
                    className="h-9 w-9 rounded-full"
                    title="Update location"
                  >
                    <Crosshair className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </form>
            </div>

            {/* Filters Card */}
            {showFilters && (
              <Card className="mt-2 shadow-xl">
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
          </div>

          {/* Restaurant Count Badge */}
          <div className="absolute bottom-4 right-4 z-[1000]">
            <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm shadow-lg px-3 py-1.5 border border-gray-200">
              {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
            </Badge>
          </div>

          {/* Map */}
          {restaurantsLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <MapContainer
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              center={mapCenter}
              zoom={userLocation ? 14 : 12}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
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
                    <div className="text-center">
                      <p className="font-medium">Your Location</p>
                      <p className="text-xs text-muted-foreground">You are here</p>
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
        </div>

        {/* Bottom Sheet Panel */}
        <div 
          className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out"
          style={{ 
            bottom: '64px',
            height: `${sheetHeight}vh`,
            zIndex: 45,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Sheet Handle - Draggable area */}
          <div 
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
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
            className="flex-1 overflow-y-auto"
          >
            {!selectedRestaurant ? (
              /* Restaurant List */
              <div>
                <div className="px-6 py-3 border-b sticky top-0 bg-white z-10">
                  <h3 className="font-bold text-lg">
                    Nearby Restaurants ({restaurants.length})
                  </h3>
                </div>
                {restaurants.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {userLocation ? 'No restaurants found in your area' : 'Enable location to see nearby restaurants'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {restaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        className="flex items-center gap-4 p-4 hover:bg-accent cursor-pointer transition-colors active:bg-accent"
                        onClick={() => handleRestaurantClick(restaurant)}
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate">{restaurant.name}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {restaurant.rating && (
                              <div className="flex items-center text-sm text-accent">
                                <Star className="h-3.5 w-3.5 mr-1 fill-accent" />
                                <span className="font-medium">{restaurant.rating}</span>
                              </div>
                            )}
                            {restaurant.distance && (
                              <span className="text-sm text-primary font-medium">
                                {formatDistance(restaurant.distance)}
                              </span>
                            )}
                          </div>
                          {restaurant.address && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {restaurant.address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Restaurant Details */
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">🍽️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl mb-1">{selectedRestaurant.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedRestaurant.rating && (
                        <div className="flex items-center text-accent">
                          <Star className="h-4 w-4 mr-1 fill-accent" />
                          <span className="font-semibold">{selectedRestaurant.rating}</span>
                        </div>
                      )}
                      {selectedRestaurant.distance && (
                        <span className="text-sm text-primary font-medium">
                          {formatDistance(selectedRestaurant.distance)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedRestaurant(null)}
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {selectedRestaurant.description && (
                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedRestaurant.description}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pb-4 border-b">
                  {selectedRestaurant.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{selectedRestaurant.address}</span>
                    </div>
                  )}
                  
                  {selectedRestaurant.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`tel:${selectedRestaurant.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedRestaurant.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 h-12 shadow-lg font-bold"
                    onClick={handleViewRestaurant}
                  >
                    View Dishes
                  </Button>
                  {selectedRestaurant.latitude && selectedRestaurant.longitude && (
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.latitude},${selectedRestaurant.longitude}`, '_blank');
                      }}
                      className="h-12 w-12 shadow-lg"
                      title="Get directions"
                    >
                      <Navigation className="h-5 w-5" />
                    </Button>
                  )}
                  {selectedRestaurant.phone && (
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`tel:${selectedRestaurant.phone}`, '_self')}
                      className="h-12 w-12 shadow-lg"
                      title="Call restaurant"
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW - Keep existing design */}
      <div className={`${className} hidden lg:flex flex-col h-screen`}>
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
      </div>
    </>
  );
};

export default RestaurantMap;