import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DeliveryOptionsCardProps {
  deliveryType: 'pickup' | 'delivery';
  setDeliveryType: (type: 'pickup' | 'delivery') => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  deliveryFee: number;
}

const DeliveryOptionsCard: React.FC<DeliveryOptionsCardProps> = ({
  deliveryType,
  setDeliveryType,
  deliveryAddress,
  setDeliveryAddress,
  notes,
  setNotes,
  deliveryFee,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={deliveryType}
          onValueChange={(value: 'pickup' | 'delivery') => setDeliveryType(value)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 border rounded-lg p-3">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="flex-1 cursor-pointer">
              <div className="font-medium">Pickup</div>
              <div className="text-sm text-muted-foreground">Pick up from restaurant - Free</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 border rounded-lg p-3">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
              <div className="font-medium">Delivery</div>
              <div className="text-sm text-muted-foreground">
                Deliver to your address - UGX {deliveryFee.toLocaleString()}
              </div>
            </Label>
          </div>
        </RadioGroup>

        {deliveryType === 'delivery' && (
          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address *</Label>
            <Textarea
              id="address"
              placeholder="Enter your delivery address..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Special Instructions (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Special instructions, allergies, or delivery notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryOptionsCard;
