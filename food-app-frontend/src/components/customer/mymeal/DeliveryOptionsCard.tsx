import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation, UtensilsCrossed, ShoppingBag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import type { DeliveryAddress, OrderType } from '@/types/delivery';

interface DeliveryOptionsCardProps {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  deliveryAddress: DeliveryAddress;
  setDeliveryAddress: (address: DeliveryAddress) => void;
  notes: string;
  setNotes: (notes: string) => void;
  deliveryFee: number;
}

const DeliveryOptionsCard: React.FC<DeliveryOptionsCardProps> = ({
  orderType,
  setOrderType,
  deliveryAddress,
  setDeliveryAddress,
  notes,
  setNotes,
  deliveryFee,
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Update a single field in the address
  const updateAddressField = useCallback(
    (field: keyof DeliveryAddress, value: string | number) => {
      setDeliveryAddress({
        ...deliveryAddress,
        [field]: value,
      });
    },
    [deliveryAddress, setDeliveryAddress]
  );

  // Get current location via GPS
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update coordinates
        setDeliveryAddress({
          ...deliveryAddress,
          lat: latitude,
          lng: longitude,
        });

        // Attempt reverse geocoding (optional - uses OpenStreetMap Nominatim)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'en' },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};

            setDeliveryAddress({
              street: [addr.road, addr.house_number].filter(Boolean).join(' ') ||
                      data.display_name?.split(',')[0] ||
                      deliveryAddress.street,
              city: addr.city || addr.town || addr.village || addr.suburb || deliveryAddress.city,
              state: addr.state || deliveryAddress.state,
              postal_code: addr.postcode || deliveryAddress.postal_code,
              country: addr.country || deliveryAddress.country,
              lat: latitude,
              lng: longitude,
              instructions: deliveryAddress.instructions,
            });
            toast.success('Location detected');
          }
        } catch {
          // Geocoding failed, but we still have coordinates
          toast.success('Coordinates captured. Enter street address manually.');
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out');
            break;
          default:
            toast.error('Failed to get location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [deliveryAddress, setDeliveryAddress]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={orderType}
          onValueChange={(value: OrderType) => setOrderType(value)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 border rounded-lg p-3">
            <RadioGroupItem value="DINE_IN" id="dine-in" />
            <Label htmlFor="dine-in" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Dine In</span>
              </div>
              <div className="text-sm text-muted-foreground">Eat at the restaurant</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 border rounded-lg p-3">
            <RadioGroupItem value="TAKEAWAY" id="takeaway" />
            <Label htmlFor="takeaway" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Takeaway</span>
              </div>
              <div className="text-sm text-muted-foreground">Pick up from restaurant - Free</div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 border rounded-lg p-3">
            <RadioGroupItem value="DELIVERY" id="delivery" />
            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Delivery</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Deliver to your address - UGX {deliveryFee.toLocaleString()}
              </div>
            </Label>
          </div>
        </RadioGroup>

        {orderType === 'DELIVERY' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Delivery Address *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-1" />
                    Use My Location
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="street" className="text-sm">
                  Street Address
                </Label>
                <Input
                  id="street"
                  placeholder="e.g., 123 Kampala Road"
                  value={deliveryAddress.street}
                  onChange={(e) => updateAddressField('street', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm">
                    City/Town
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g., Kampala"
                    value={deliveryAddress.city}
                    onChange={(e) => updateAddressField('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code" className="text-sm">
                    Postal Code
                  </Label>
                  <Input
                    id="postal_code"
                    placeholder="Optional"
                    value={deliveryAddress.postal_code || ''}
                    onChange={(e) => updateAddressField('postal_code', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions" className="text-sm">
                  Delivery Instructions
                </Label>
                <Input
                  id="instructions"
                  placeholder="e.g., Gate code, landmark, floor number..."
                  value={deliveryAddress.instructions || ''}
                  onChange={(e) => updateAddressField('instructions', e.target.value)}
                />
              </div>

              {deliveryAddress.lat && deliveryAddress.lng && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                  <MapPin className="h-3 w-3" />
                  <span>
                    GPS: {deliveryAddress.lat.toFixed(6)}, {deliveryAddress.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
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
