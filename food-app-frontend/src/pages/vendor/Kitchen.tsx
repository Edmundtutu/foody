import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Package, AlertCircle } from 'lucide-react';
import { KitchenGraphBoard } from '@/components/vendor/kitchen-graph';
import { useKitchenGraph } from '@/hooks/queries/useKitchenGraph';
import { useVendor } from '@/context/VendorContext';
import { Skeleton } from '@/components/ui/skeleton';

const VendorKitchen: React.FC = () => {
  const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();

  const handleJumpToCreate = () => {
    const target = document.getElementById('vendor-kitchen-create-node');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const { data: graph, isLoading, isError, error, refetch, isFetching } = useKitchenGraph(restaurantId);

  // Loading state
  if (vendorLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No restaurant found
  if (!hasRestaurant || !restaurantId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Kitchen Graph</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No restaurant found</h3>
            <p className="text-muted-foreground mb-4">Create a restaurant to manage your menu.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error loading graph
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Kitchen Graph</h1>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load kitchen graph</h3>
            <p className="text-muted-foreground text-center mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading the kitchen graph'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state or render graph
  const isEmpty = !graph || (graph.nodes?.length ?? 0) + (graph.edges?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kitchen Graph</h1>
          <p className="text-muted-foreground mt-1">Visualize and manage your menu structure</p>
        </div>
        <Button disabled={!restaurantId} onClick={handleJumpToCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </div>
      
      <Card>
        <CardContent className="space-y-6 p-4 lg:p-6">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 px-4 py-10 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No graph data yet</h3>
              <p className="text-muted-foreground mb-4">
                Once your backend serves nodes and edges, they will appear in the visualization below.
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                We removed the previous hard-coded UI and will re-introduce interactive controls in the upcoming phases.
              </p>
            </div>
          )}

          <KitchenGraphBoard
            graph={graph}
            onRefresh={refetch}
            isRefreshing={isFetching}
            restaurantId={restaurantId}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorKitchen;