import React from 'react';

interface NotificationListProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ open, onClose }) => {
  if (!open) return null;
  
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <h3 className="font-semibold mb-2">Notifications</h3>
      <p className="text-sm text-gray-500">No new notifications</p>
    </div>
  );
};
