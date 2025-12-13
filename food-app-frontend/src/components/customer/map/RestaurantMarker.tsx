import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import type { Restaurant } from '@/services/restaurantService';
import L from 'leaflet';

// Create custom icon for restaurant markers
const restaurantIcon = L.divIcon({
  className: 'restaurant-marker',
  html: `
    <div style="
      background-color: #ef4444;
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 16px;
      ">🍽️</div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

interface RestaurantMarkerProps {
  restaurant: Restaurant;
  onMarkerClick: (restaurant: Restaurant) => void;
}

const RestaurantMarker: React.FC<RestaurantMarkerProps> = ({ restaurant, onMarkerClick }) => {
  if (!restaurant.latitude || !restaurant.longitude) {
    return null;
  }

  return (
    <Marker
      position={[restaurant.latitude, restaurant.longitude]}
      icon={restaurantIcon}
      eventHandlers={{
        click: () => onMarkerClick(restaurant),
      }}
    >
      <Popup>
        <div className="text-center p-2 min-w-[150px]">
          <h4 className="font-semibold text-sm mb-1">{restaurant.name}</h4>
          {restaurant.rating && (
            <div className="text-xs text-muted-foreground">
              ⭐ {restaurant.rating} ({restaurant.total_reviews || 0})
            </div>
          )}
          {restaurant.distance && (
            <div className="text-xs text-primary mt-1">
              {restaurant.distance < 1 
                ? `${Math.round(restaurant.distance * 1000)}m away`
                : `${restaurant.distance.toFixed(1)}km away`}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default RestaurantMarker;

