import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, User, Clock, Phone } from 'lucide-react';
import trackingService from '@/services/trackingService';
import type { LiveLocation, DeliveryStatus, Agent } from '@/types/delivery';
import { DELIVERY_STATUS_CONFIG } from '@/types/delivery';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different markers
const createIcon = (color: string, emoji: string) => {
    return L.divIcon({
        className: 'custom-delivery-marker',
        html: `
            <div style="
                background-color: ${color};
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            ">
                ${emoji}
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
};

const pickupIcon = createIcon('#22c55e', '🏪'); // Green - Restaurant
const dropoffIcon = createIcon('#ef4444', '📍'); // Red - Delivery location
const courierIcon = createIcon('#3b82f6', '🛵'); // Blue - Courier

interface DeliveryMapProps {
    orderId: string;
    pickupLocation?: { lat: number; lng: number; name?: string };
    dropoffLocation?: { lat: number; lng: number; name?: string };
    agent?: Agent | null;
    deliveryStatus?: DeliveryStatus;
    showHeader?: boolean;
    className?: string;
    height?: string;
}

/**
 * Component to auto-fit map bounds when locations change
 */
const MapBoundsHandler: React.FC<{
    pickup?: { lat: number; lng: number };
    dropoff?: { lat: number; lng: number };
    courierLocation?: LiveLocation | null;
}> = ({ pickup, dropoff, courierLocation }) => {
    const map = useMap();

    useEffect(() => {
        const points: [number, number][] = [];

        if (pickup) points.push([pickup.lat, pickup.lng]);
        if (dropoff) points.push([dropoff.lat, dropoff.lng]);
        if (courierLocation) points.push([courierLocation.lat, courierLocation.lng]);

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [map, pickup, dropoff, courierLocation]);

    return null;
};

/**
 * Real-time delivery tracking map component
 * Shows pickup location, delivery location, and live courier position
 */
const DeliveryMap: React.FC<DeliveryMapProps> = ({
    orderId,
    pickupLocation,
    dropoffLocation,
    agent,
    deliveryStatus = 'PENDING',
    showHeader = true,
    className = '',
    height = '300px',
}) => {
    const [courierLocation, setCourierLocation] = useState<LiveLocation | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Default center (use dropoff if available, then pickup, then Kampala)
    const defaultCenter: [number, number] = dropoffLocation
        ? [dropoffLocation.lat, dropoffLocation.lng]
        : pickupLocation
            ? [pickupLocation.lat, pickupLocation.lng]
            : [0.3211264, 32.5910528]; // Kampala

    // Subscribe to live location updates
    useEffect(() => {
        if (!orderId) return;

        // Only track if order is in active delivery states
        const activeStates: DeliveryStatus[] = ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'];
        if (!activeStates.includes(deliveryStatus)) {
            return;
        }

        const unsubscribe = trackingService.subscribeToLocation(orderId, (location) => {
            if (location) {
                setCourierLocation(location);
                setLastUpdate(new Date(location.timestamp));
                setIsConnected(true);
            } else {
                setIsConnected(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [orderId, deliveryStatus]);

    // Calculate route polyline points
    const routePoints: [number, number][] = [];
    if (pickupLocation) routePoints.push([pickupLocation.lat, pickupLocation.lng]);
    if (courierLocation) routePoints.push([courierLocation.lat, courierLocation.lng]);
    if (dropoffLocation) routePoints.push([dropoffLocation.lat, dropoffLocation.lng]);

    const statusConfig = DELIVERY_STATUS_CONFIG[deliveryStatus];

    return (
        <Card className={className}>
            {showHeader && (
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            Live Tracking
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {isConnected && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Live
                                </Badge>
                            )}
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                                {statusConfig.label}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            )}
            <CardContent className={showHeader ? '' : 'p-0'}>
                <div className="space-y-3">
                    {/* Map Container */}
                    <div
                        className="rounded-lg overflow-hidden border"
                        style={{ height }}
                    >
                        <MapContainer
                            center={defaultCenter}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Auto-fit bounds */}
                            <MapBoundsHandler
                                pickup={pickupLocation}
                                dropoff={dropoffLocation}
                                courierLocation={courierLocation}
                            />

                            {/* Pickup Location Marker */}
                            {pickupLocation && (
                                <Marker
                                    position={[pickupLocation.lat, pickupLocation.lng]}
                                    icon={pickupIcon}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <strong>Pickup</strong>
                                            <br />
                                            {pickupLocation.name || 'Restaurant'}
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Dropoff Location Marker */}
                            {dropoffLocation && (
                                <Marker
                                    position={[dropoffLocation.lat, dropoffLocation.lng]}
                                    icon={dropoffIcon}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <strong>Delivery</strong>
                                            <br />
                                            {dropoffLocation.name || 'Delivery Address'}
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Courier Location Marker (Live) */}
                            {courierLocation && (
                                <Marker
                                    position={[courierLocation.lat, courierLocation.lng]}
                                    icon={courierIcon}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <strong>{agent?.name || 'Delivery Agent'}</strong>
                                            {courierLocation.speed && (
                                                <>
                                                    <br />
                                                    Speed: {Math.round(courierLocation.speed * 3.6)} km/h
                                                </>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Route Polyline */}
                            {routePoints.length > 1 && (
                                <Polyline
                                    positions={routePoints}
                                    color="#3b82f6"
                                    weight={3}
                                    opacity={0.7}
                                    dashArray="10, 10"
                                />
                            )}
                        </MapContainer>
                    </div>

                    {/* Agent Info */}
                    {agent && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{agent.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    {agent.fleet_kind}
                                    {lastUpdate && (
                                        <>
                                            <span>•</span>
                                            <Clock className="h-3 w-3" />
                                            Updated {formatTimeAgo(lastUpdate)}
                                        </>
                                    )}
                                </div>
                            </div>
                            {agent.phone_number && (
                                <a
                                    href={`tel:${agent.phone_number}`}
                                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                    <Phone className="h-4 w-4" />
                                    Call
                                </a>
                            )}
                        </div>
                    )}

                    {/* Status Message */}
                    <div className="text-sm text-muted-foreground text-center">
                        {getStatusMessage(deliveryStatus, agent?.name)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Format time ago
 */
function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}

/**
 * Get status message based on delivery status
 */
function getStatusMessage(status: DeliveryStatus, agentName?: string): string {
    const name = agentName || 'Your delivery agent';
    switch (status) {
        case 'PENDING':
            return 'Looking for a delivery agent...';
        case 'ASSIGNED':
            return `${name} is heading to the restaurant`;
        case 'PICKED_UP':
            return `${name} has picked up your order`;
        case 'ON_THE_WAY':
            return `${name} is on the way to you`;
        case 'DELIVERED':
            return 'Your order has been delivered!';
        default:
            return '';
    }
}

/**
 * Loading skeleton for DeliveryMap
 */
export const DeliveryMapSkeleton: React.FC<{ height?: string }> = ({ height = '300px' }) => (
    <Card>
        <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
            <Skeleton className="w-full rounded-lg" style={{ height }} />
            <Skeleton className="h-14 w-full mt-3" />
        </CardContent>
    </Card>
);

export default DeliveryMap;
