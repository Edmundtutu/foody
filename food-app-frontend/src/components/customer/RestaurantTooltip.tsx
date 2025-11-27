import React from 'react';
import { Star, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Restaurant } from '@/services/restaurantService';

interface RestaurantTooltipProps {
  restaurant: Restaurant | null;
  position: { x: number; y: number };
  isVisible: boolean;
}

const RestaurantTooltip: React.FC<RestaurantTooltipProps> = ({ restaurant, position, isVisible }) => {
  if (!isVisible || !restaurant) return null;

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border p-3 max-w-xs pointer-events-none z-50"
      style={{
        left: position.x + 10,
        top: position.y - 100,
        transform: 'translateY(-50%)',
        zIndex: 10000
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
          <span className="text-lg">🍽️</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{restaurant.name}</h4>
          <div className="flex items-center gap-1">
            {restaurant.rating && (
              <>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">{restaurant.rating}</span>
                <span className="text-xs text-muted-foreground">
                  ({restaurant.total_reviews || 0})
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {restaurant.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground line-clamp-2">
              {restaurant.address}
            </span>
          </div>
        )}
        {restaurant.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {restaurant.phone}
            </span>
          </div>
        )}
        {restaurant.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
            {restaurant.description}
          </p>
        )}
        {restaurant.distance && (
          <div className="text-xs text-primary font-medium mt-1">
            {restaurant.distance < 1 
              ? `${Math.round(restaurant.distance * 1000)}m away`
              : `${restaurant.distance.toFixed(1)}km away`}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <Badge variant={restaurant.verification_status === 'verified' ? 'default' : 'secondary'} className="text-xs">
          {restaurant.verification_status === 'verified' ? 'Verified' : 'Unverified'}
        </Badge>
        <span className="text-xs text-primary font-medium">
          Click to view details
        </span>
      </div>
      {/* Tooltip arrow */}
      <div 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1"
        style={{ 
          width: 0, 
          height: 0, 
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid white'
        }}
      />
    </div>
  );
};

export default RestaurantTooltip;

