import React, { useState } from 'react';
import { MapPin, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LocationBadgeProps {
  address: string;
  onAddressChange: (address: string) => void;
}

const LocationBadge: React.FC<LocationBadgeProps> = ({ address, onAddressChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);
  const [isVisible, setIsVisible] = useState(true);

  const handleSave = () => {
    if (tempAddress.trim()) {
      onAddressChange(tempAddress);
      setIsEditing(false);
      setTempAddress('');
    }
  };

  const handleCancel = () => {
    setTempAddress(address);
    setIsEditing(false);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-20 right-4 z-40 bg-card shadow-lg rounded-lg p-2 border border-border hover:bg-accent transition"
      >
        <MapPin size={20} className="text-primary" />
      </button>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-40 bg-card shadow-lg rounded-lg border border-border max-w-xs">
      {isEditing ? (
        <div className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-foreground">Edit Address</span>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <Input
            type="text"
            value={tempAddress}
            onChange={(e) => setTempAddress(e.target.value)}
            placeholder="Enter new address"
            className="mb-2"
            autoFocus
          />
          <Button onClick={handleSave} className="w-full" size="sm">
            Save
          </Button>
        </div>
      ) : (
        <div className="p-3 flex items-start">
          <MapPin size={16} className="text-primary mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{address}</p>
          </div>
          <button
            onClick={() => {
              setIsEditing(true);
              setTempAddress(address);
            }}
            className="ml-2 text-primary hover:text-primary/80"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationBadge;

