import React from 'react';

interface CreatePostCardProps {
  orderId: string;
  onPostCreated?: () => void;
}

const CreatePostCard: React.FC<CreatePostCardProps> = ({ orderId, onPostCreated }) => {
  // Stub implementation - this feature can be implemented later
  return null;
};

export default CreatePostCard;
