import {
  ref,
  set,
  update,
  onValue,
  off,
  get,
  DatabaseReference,
} from 'firebase/database';
import { database } from '@/config/firebase';
import {
  FirebaseLocationPayload,
  FirebaseStatusPayload,
  LiveLocation,
  OrderStatusUpdate,
} from '@/types/delivery';

class FirebaseService {
  private locationListeners: Map<string, any> = new Map();
  private statusListeners: Map<string, any> = new Map();

  async pushLocationUpdate(
    orderId: string,
    payload: FirebaseLocationPayload
  ): Promise<{ success: boolean; timestamp: number; error?: string }> {
    try {
      const locationRef = ref(database, `liveLocations/${orderId}`);
      const timestamp = Date.now();

      await set(locationRef, {
        ...payload,
        ts: timestamp,
      });

      return {
        success: true,
        timestamp,
      };
    } catch (error: any) {
      console.error('Firebase location push error:', error);
      return {
        success: false,
        timestamp: Date.now(),
        error: error.message,
      };
    }
  }

  async pushStatusUpdate(
    orderId: string,
    payload: FirebaseStatusPayload
  ): Promise<{ success: boolean; timestamp: number; error?: string }> {
    try {
      const statusRef = ref(database, `orderStatus/${orderId}`);
      const timestamp = Date.now();

      await set(statusRef, {
        ...payload,
        updatedAt: timestamp,
      });

      return {
        success: true,
        timestamp,
      };
    } catch (error: any) {
      console.error('Firebase status push error:', error);
      return {
        success: false,
        timestamp: Date.now(),
        error: error.message,
      };
    }
  }

  onLiveLocation(
    orderId: string,
    callback: (location: LiveLocation | null) => void
  ): () => void {
    const locationRef = ref(database, `liveLocations/${orderId}`);

    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as LiveLocation);
      } else {
        callback(null);
      }
    });

    this.locationListeners.set(orderId, unsubscribe);

    return () => {
      unsubscribe();
      this.locationListeners.delete(orderId);
    };
  }

  onOrderStatus(
    orderId: string,
    callback: (status: OrderStatusUpdate | null) => void
  ): () => void {
    const statusRef = ref(database, `orderStatus/${orderId}`);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as OrderStatusUpdate);
      } else {
        callback(null);
      }
    });

    this.statusListeners.set(orderId, unsubscribe);

    return () => {
      unsubscribe();
      this.statusListeners.delete(orderId);
    };
  }

  async getRiderStatus(riderId: string): Promise<any> {
    try {
      const riderRef = ref(database, `riders/${riderId}`);
      const snapshot = await get(riderRef);

      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Firebase rider status error:', error);
      return null;
    }
  }

  async updateRiderOnlineStatus(
    riderId: string,
    online: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const riderRef = ref(database, `riders/${riderId}`);

      await update(riderRef, {
        status: online ? 'online' : 'offline',
        lastSeen: Date.now(),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  removeAllListeners(): void {
    this.locationListeners.forEach((unsubscribe) => unsubscribe());
    this.statusListeners.forEach((unsubscribe) => unsubscribe());
    this.locationListeners.clear();
    this.statusListeners.clear();
  }
}

export const firebaseService = new FirebaseService();
