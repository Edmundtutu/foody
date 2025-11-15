import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Package } from 'lucide-react';
import { DynamicInventoryFlow } from '@/components/vendor/inventory/DynamicInventoryFlow';
import { useQuery } from '@tanstack/react-query';
import kitchenService from '@/services/kitchenService';
import restaurantService from '@/services/restaurantService';
import { useAuth } from '@/context/AuthContext';

const VendorKitchen: React.FC = () => {
  const { user } = useAuth();

  // Load current vendor's first restaurant as the active restaurant
  const { data: restaurants } = useQuery({
    enabled: !!user,
    queryKey: ['vendorRestaurants', user?.id],
    queryFn: () => restaurantService.getRestaurantsByOwner(user!.id),
    staleTime: 30_000,
  });

  const activeRestaurantId = useMemo(
    () => restaurants?.[0]?.id as string | undefined,
    [restaurants]
  );

  const { data: graph, isLoading } = useQuery({
    enabled: !!activeRestaurantId,
    queryKey: ['kitchenGraph', activeRestaurantId],
    queryFn: () => kitchenService.getGraph(activeRestaurantId!),
    staleTime: 10_000,
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Dish
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-8">
          {!activeRestaurantId ? (
            <>
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No restaurant found</h3>
              <p className="text-muted-foreground mb-4">Create a restaurant to manage your menu.</p>
            </>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : !graph || (graph.nodes?.length ?? 0) + (graph.edges?.length ?? 0) === 0 ? (
            <>
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Start your menu</h3>
              <p className="text-muted-foreground mb-4">Add dishes and organize your menu.</p>
              <DynamicInventoryFlow shopId={activeRestaurantId} initialGraph={{ categories: [], nodes: [], edges: [] }} />
            </>
          ) : (
            <DynamicInventoryFlow shopId={activeRestaurantId} initialGraph={graph} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorKitchen;