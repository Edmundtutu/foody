import React from 'react';
import type { DiscoveryResource } from '@/types/discovery';
import DishCard from './DishCard';
import ComboCard from './ComboCard';

interface ResourceCardProps {
  resource: DiscoveryResource;
}

/**
 * Universal card component that renders either a DishCard or ComboCard
 * based on the resource type. Provides polymorphic rendering for mixed
 * discovery streams.
 */
const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  if (resource.type === 'dish') {
    return <DishCard dish={resource.data} />;
  }
  
  if (resource.type === 'combo') {
    return <ComboCard combo={resource.data} />;
  }
  
  // Type guard ensures this never happens, but TypeScript needs it
  return null;
};

export default ResourceCard;
