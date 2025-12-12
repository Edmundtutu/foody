import React from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantMap from '@/components/customer/RestaurantMap';
import type { Restaurant } from '@/services/restaurantService';

const Restaurants: React.FC = () => {
  const navigate = useNavigate();

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    // Navigate to restaurant details page
    navigate(`/restaurants/${restaurant.id}`);
  };

  return (
    <div className="min-h-screen lg:p-4">
      <div className="max-w-7xl mx-auto lg:space-y-6">        
        <RestaurantMap
          onRestaurantSelect={handleRestaurantSelect}
          className="h-screen lg:h-[600px]"
        />
      </div>
    </div>
  );
};

export default Restaurants;

