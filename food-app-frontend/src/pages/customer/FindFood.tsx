import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Star, Flame, History, ChefHat, Pizza, Leaf, Filter, Menu, Compass } from 'lucide-react';
import DishIcon from '@/assets/icons/dish.svg?react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ResourceCard from '@/components/customer/discovery/ResourceCard';
import SeeMoreCard from '@/components/customer/discovery/SeeMoreCard';
import LocationBadge from '@/components/customer/LocationBadge';
import { useGeolocation } from '@/hooks/utils/useGeolocation';
import { reverseGeocode } from '@/utils/location';
import {
  useTopPicksResources,
  usePopularResources,
  useRecentlyOrderedResources,
  useDiscoveryResources,
  useNearbyResources,
} from '@/hooks/queries/useDiscovery';
import { usePopularTags } from '@/hooks/queries/useDishes';
import { useMeal } from '@/context/MealContext';
import { useNavbar } from '@/layouts/MainLayout';
import type { DiscoveryResource, DiscoveryFilters } from '@/types/discovery';

// Icon mapping for common tags
const tagIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'local': ChefHat,
  'local food': ChefHat,
  'traditional': ChefHat,
  'quick': Flame,
  'quick bites': Flame,
  'fast': Flame,
  'pizza': Pizza,
  'burger': Menu,
  'burgers': Menu,
  'vegan': Leaf,
  'vegetarian': Leaf,
  'healthy': Leaf,
  'spicy': Flame,
  'grilled': ChefHat,
  'popular': Star,
  'new': Star,
};

// Color mapping for tags
const tagColorMap: Record<string, string> = {
  'local': 'bg-secondary',
  'local food': 'bg-secondary',
  'traditional': 'bg-secondary',
  'quick': 'bg-primary',
  'quick bites': 'bg-primary',
  'fast': 'bg-primary',
  'pizza': 'bg-accent',
  'burger': 'bg-secondary',
  'burgers': 'bg-secondary',
  'vegan': 'bg-secondary',
  'vegetarian': 'bg-secondary',
  'healthy': 'bg-secondary',
  'spicy': 'bg-primary',
  'grilled': 'bg-secondary',
  'popular': 'bg-primary',
  'new': 'bg-accent',
};

// Default icon and color
const defaultIcon = Filter;
const defaultColor = 'bg-secondary';

// Helper function to get icon for a tag
const getTagIcon = (tag: string): React.ComponentType<{ className?: string }> => {
  const normalizedTag = tag.toLowerCase().trim();
  return tagIconMap[normalizedTag] || defaultIcon;
};

// Helper function to get color for a tag
const getTagColor = (tag: string): string => {
  const normalizedTag = tag.toLowerCase().trim();
  return tagColorMap[normalizedTag] || defaultColor;
};

// Helper function to format tag name for display
const formatTagName = (tag: string): string => {
  // Capitalize first letter of each word
  return tag
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface FilterCardProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isActive: boolean;
  onClick: () => void;
}

const FilterCard: React.FC<FilterCardProps> = ({ name, icon: Icon, color, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition duration-200 shadow-sm ${isActive
        ? `${color} text-white`
        : 'bg-card text-foreground hover:bg-accent border border-border'
      }`}
  >
    <Icon className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'text-white' : ''}`} />
    <span className="truncate max-w-[80px] sm:max-w-none">{name}</span>
  </button>
);

interface HorizontalScrollSectionProps {
  title: string;
  resources: DiscoveryResource[];
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  title,
  resources,
  icon: Icon,
  isLoading,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}) => (
  <section className="mt-6 sm:mt-8">
    <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 flex items-center px-2 sm:px-0">
      <Icon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
      {title}
    </h2>
    {isLoading ? (
      <div className="flex items-center justify-center py-4 sm:py-8">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
      </div>
    ) : (
      <div className="flex overflow-x-scroll pb-4 space-x-3 sm:space-x-4 px-2 sm:px-0 hide-scrollbar">
        {resources.length > 0 ? (
          <>
            {resources.map((resource) => (
              <div key={`${resource.type}-${resource.id}`} className="w-48 flex-shrink-0">
                <ResourceCard resource={resource} />
              </div>
            ))}
            {hasMore && onLoadMore && (
              <SeeMoreCard onClick={onLoadMore} isLoading={loadingMore} />
            )}
          </>
        ) : (
          <div className="px-2 sm:px-0 w-full">
            <p className="text-sm sm:text-base text-muted-foreground italic">
              No items available in this category right now.
            </p>
          </div>
        )}
      </div>
    )}
  </section>
);

const FindFood: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activeFilter, setActiveFilter] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('Detecting location...');
  const { location: userLocation, error: geoError, requestLocation } = useGeolocation();
  const { getItemCount } = useMeal();
  const { setMobileHeader } = useNavbar();

  // Fetch popular tags from backend
  const { data: popularTags = [], isLoading: loadingTags } = usePopularTags(10);

  // Get user's location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Get meal item count for badge
  const mealItemCount = getItemCount();

  // Nav-minimizer: Setup custom mobile header (desktop keeps default navbar)
  useEffect(() => {
    // Set custom mobile header
    setMobileHeader(
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-black text-primary">Find Food</h1>
          <Link to="/my-meal" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <DishIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            {mealItemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs p-0">
                {mealItemCount > 99 ? '99+' : mealItemCount}
              </Badge>
            )}
          </Link>
        </div>
      </header>
    );

    // Cleanup on unmount
    return () => {
      setMobileHeader(null);
    };
  }, [setMobileHeader, mealItemCount]);

  // Reverse geocode location to address
  useEffect(() => {
    if (userLocation) {
      reverseGeocode(userLocation)
        .then((address) => {
          setDeliveryAddress(address);
        })
        .catch(() => {
          setDeliveryAddress(`${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`);
        });
    } else if (geoError) {
      setDeliveryAddress('Location unavailable');
    }
  }, [userLocation, geoError]);

  // Update search params when search term changes
  useEffect(() => {
    if (searchTerm !== searchQuery) {
      if (searchTerm) {
        setSearchParams({ search: searchTerm });
      } else {
        setSearchParams({});
      }
    }
  }, [searchTerm, searchQuery, setSearchParams]);

  // Build base filters that ALWAYS include location when available
  const baseFilters: DiscoveryFilters | undefined = useMemo(() => {
    // Only create filters if location is available
    if (!userLocation) return undefined;
    
    const filters: DiscoveryFilters = {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: 20, // 20km radius
    };
    
    // Add tag filter if active (but NOT 'All Dishes')
    if (activeFilter && activeFilter !== 'All Dishes') {
      filters.tag = activeFilter;
    }
    
    return filters;
  }, [activeFilter, userLocation]);

  // Fetch unified resources ONLY for search/filter results
  const { resources: searchResults, isLoading: loadingSearch } = useDiscoveryResources(
    (searchTerm || activeFilter) && baseFilters
      ? {
        ...baseFilters,
        name: searchTerm || undefined,
      }
      : undefined
  );

  // Fetch special sections with unified resources (ONLY when showing default view)
  const showSpecialSections = !searchTerm && !activeFilter;
  
  const { 
    resources: topPicks, 
    isLoading: loadingTopPicks,
    hasMore: hasMoreTopPicks,
    loadMore: loadMoreTopPicks,
  } = useTopPicksResources(
    showSpecialSections && baseFilters ? baseFilters : undefined
  );
  const { 
    resources: popularResources, 
    isLoading: loadingPopular,
    hasMore: hasMorePopular,
    loadMore: loadMorePopular,
  } = usePopularResources(
    showSpecialSections && baseFilters ? baseFilters : undefined
  );
  const { 
    resources: recentlyOrdered, 
    isLoading: loadingRecent,
    hasMore: hasMoreRecent,
    loadMore: loadMoreRecent,
  } = useRecentlyOrderedResources(
    showSpecialSections && baseFilters ? baseFilters : undefined
  );

  // Fetch all nearby resources for Discover section (with pagination)
  const {
    resources: nearbyResources,
    isLoading: loadingNearby,
    hasMore: hasMoreNearby,
    loadMore: loadMoreNearby,
  } = useNearbyResources(
    showSpecialSections && baseFilters ? baseFilters : undefined
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Location Badge */}
      {userLocation && (
        <div className="px-3 sm:px-4 lg:px-8 mt-2">
          <LocationBadge address={deliveryAddress} onAddressChange={setDeliveryAddress} />
        </div>
      )}

      <main className="pb-10">
        {/* Search and Filter Section */}
        <div className="p-3 sm:p-4 lg:p-8 bg-card border-b border-border shadow-sm">
          {/* Search Bar */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              type="text"
              placeholder="Search what you are craving..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Filter Cards - Mobile scrollable */}
          <div className="relative">
            <div className="flex overflow-x-scroll space-x-2 pb-1 hide-scrollbar">
              <FilterCard
                name="All Dishes"
                icon={Filter}
                color="bg-muted"
                isActive={!activeFilter}
                onClick={() => {
                  setActiveFilter('');
                  setSearchTerm('');
                }}
              />
              {loadingTags ? (
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              ) : (
                popularTags.map((tag) => (
                  <FilterCard
                    key={tag}
                    name={formatTagName(tag)}
                    icon={getTagIcon(tag)}
                    color={getTagColor(tag)}
                    isActive={activeFilter === tag}
                    onClick={() => setActiveFilter(tag)}
                  />
                ))
              )}
            </div>
            {/* Gradient fade for scroll indication */}
            <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-card to-transparent pointer-events-none"></div>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-8">
          {/* Search/Filter Results */}
          {searchTerm || activeFilter ? (
            <section className="mt-6 sm:mt-8">
              <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-3 sm:mb-4 flex items-center">
                <Star className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary fill-primary" />
                Results for "{activeFilter || searchTerm}"
              </h2>
              {loadingSearch ? (
                <div className="flex items-center justify-center py-8 sm:py-10">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                  {searchResults.map((resource) => (
                    <div key={`search-${resource.type}-${resource.id}`} className="w-full">
                      <ResourceCard resource={resource} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-10 px-4">
                  <p className="text-base sm:text-lg text-muted-foreground italic">
                    Sorry, we couldn't find any items matching your search or filter.
                  </p>
                </div>
              )}
            </section>
          ) : (
            <>
              <HorizontalScrollSection
                title="Recently Ordered"
                resources={recentlyOrdered || []}
                icon={History}
                isLoading={loadingRecent}
                hasMore={hasMoreRecent}
                onLoadMore={loadMoreRecent}
              />
              <HorizontalScrollSection
                title="Top Picks for You"
                resources={topPicks || []}
                icon={Star}
                isLoading={loadingTopPicks}
                hasMore={hasMoreTopPicks}
                onLoadMore={loadMoreTopPicks}
              />
              <HorizontalScrollSection
                title="Popular Right Now"
                resources={popularResources || []}
                icon={Flame}
                isLoading={loadingPopular}
                hasMore={hasMorePopular}
                onLoadMore={loadMorePopular}
              />
              <HorizontalScrollSection
                title="Discover Nearby"
                resources={nearbyResources || []}
                icon={Compass}
                isLoading={loadingNearby}
                hasMore={hasMoreNearby}
                onLoadMore={loadMoreNearby}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default FindFood;