import { useMutation, useQueryClient } from '@tanstack/react-query';
import kitchenService, { CreateEdgeData } from '@/services/kitchenService';
import { useToast } from '@/hooks/use-toast';

export function useCreateEdge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateEdgeData) => kitchenService.createEdge(data),
    onSuccess: (edge) => {
      queryClient.invalidateQueries({
        queryKey: ['kitchen', 'graph', edge.restaurant_id],
      });
      toast({
        title: 'Edge created',
        description: 'The connection has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create edge',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteEdge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (edgeId: string) => kitchenService.deleteEdge(edgeId),
    onSuccess: () => {
      // Invalidate all kitchen graph queries since we don't know which restaurant
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'graph'] });
      toast({
        title: 'Edge deleted',
        description: 'The connection has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete edge',
        variant: 'destructive',
      });
    },
  });
}

