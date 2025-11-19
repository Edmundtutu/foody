import { useMutation, useQueryClient } from '@tanstack/react-query';
import kitchenService from '@/services/kitchenService';
import type { CreateNodeData, MoveNodeData } from '@/services/kitchenService';
import { useToast } from '@/hooks/use-toast';

export function useCreateNode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateNodeData) => kitchenService.createNode(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['kitchen', 'graph', variables.restaurant_id],
      });
      toast({
        title: 'Node created',
        description: 'The node has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create node',
        variant: 'destructive',
      });
    },
  });
}

export function useMoveNode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: MoveNodeData }) =>
      kitchenService.moveNode(nodeId, data),
    onSuccess: (node) => {
      queryClient.invalidateQueries({
        queryKey: ['kitchen', 'graph', node.restaurant_id],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to move node',
        variant: 'destructive',
      });
    },
  });
}

export function useToggleNode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (nodeId: string) => kitchenService.toggleNode(nodeId),
    onSuccess: (node) => {
      queryClient.invalidateQueries({
        queryKey: ['kitchen', 'graph', node.restaurant_id],
      });
      toast({
        title: 'Node availability updated',
        description: `Node is now ${node.available ? 'available' : 'unavailable'}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle node',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteNode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (nodeId: string) => kitchenService.deleteNode(nodeId),
    onSuccess: () => {
      // Invalidate all kitchen graph queries since we don't know which restaurant
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'graph'] });
      toast({
        title: 'Node deleted',
        description: 'The node has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete node',
        variant: 'destructive',
      });
    },
  });
}

