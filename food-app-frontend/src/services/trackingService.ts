import { ref, onValue, off, DatabaseReference, Unsubscribe } from 'firebase/database';
import { getFirebaseDatabase } from '@/config/firebase';
import type { LiveLocation, OrderStatusUpdate, DeliveryStatus } from '@/types/delivery';

/**
 * Tracking service for real-time delivery location and status updates via Firebase
 */
class TrackingService {
    private locationListeners: Map<string, Unsubscribe> = new Map();
    private statusListeners: Map<string, Unsubscribe> = new Map();

    /**
     * Subscribe to live location updates for an order
     * @param orderId The order ID to track
     * @param callback Callback function called with location updates
     * @returns Unsubscribe function
     */
    subscribeToLocation(
        orderId: string,
        callback: (location: LiveLocation | null) => void
    ): () => void {
        // Clean up existing listener for this order if any
        this.unsubscribeFromLocation(orderId);

        try {
            const database = getFirebaseDatabase();
            const locationRef = ref(database, `liveLocations/${orderId}`);

            const unsubscribe = onValue(
                locationRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        callback({
                            lat: data.lat,
                            lng: data.lng,
                            heading: data.heading,
                            speed: data.speed,
                            timestamp: data.ts || data.timestamp,
                            agent_id: data.riderId || data.agent_id,
                        });
                    } else {
                        callback(null);
                    }
                },
                (error) => {
                    console.error('Firebase location subscription error:', error);
                    callback(null);
                }
            );

            this.locationListeners.set(orderId, unsubscribe);

            return () => this.unsubscribeFromLocation(orderId);
        } catch (error) {
            console.error('Failed to subscribe to location:', error);
            return () => {};
        }
    }

    /**
     * Unsubscribe from location updates for an order
     */
    unsubscribeFromLocation(orderId: string): void {
        const unsubscribe = this.locationListeners.get(orderId);
        if (unsubscribe) {
            unsubscribe();
            this.locationListeners.delete(orderId);
        }
    }

    /**
     * Subscribe to order status updates
     * @param orderId The order ID to track
     * @param callback Callback function called with status updates
     * @returns Unsubscribe function
     */
    subscribeToStatus(
        orderId: string,
        callback: (status: OrderStatusUpdate | null) => void
    ): () => void {
        // Clean up existing listener
        this.unsubscribeFromStatus(orderId);

        try {
            const database = getFirebaseDatabase();
            const statusRef = ref(database, `orderStatus/${orderId}`);

            const unsubscribe = onValue(
                statusRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        callback({
                            status: data.status as DeliveryStatus,
                            updated_at: data.updatedAt || data.updated_at,
                            eta_minutes: data.eta_minutes,
                        });
                    } else {
                        callback(null);
                    }
                },
                (error) => {
                    console.error('Firebase status subscription error:', error);
                    callback(null);
                }
            );

            this.statusListeners.set(orderId, unsubscribe);

            return () => this.unsubscribeFromStatus(orderId);
        } catch (error) {
            console.error('Failed to subscribe to status:', error);
            return () => {};
        }
    }

    /**
     * Unsubscribe from status updates for an order
     */
    unsubscribeFromStatus(orderId: string): void {
        const unsubscribe = this.statusListeners.get(orderId);
        if (unsubscribe) {
            unsubscribe();
            this.statusListeners.delete(orderId);
        }
    }

    /**
     * Clean up all subscriptions
     */
    cleanup(): void {
        this.locationListeners.forEach((unsubscribe) => unsubscribe());
        this.locationListeners.clear();

        this.statusListeners.forEach((unsubscribe) => unsubscribe());
        this.statusListeners.clear();
    }

    /**
     * Get Firebase paths for an order (for debugging/reference)
     */
    getFirebasePaths(orderId: string): { location: string; status: string } {
        return {
            location: `liveLocations/${orderId}`,
            status: `orderStatus/${orderId}`,
        };
    }
}

export const trackingService = new TrackingService();
export default trackingService;
