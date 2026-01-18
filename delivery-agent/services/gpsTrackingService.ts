import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { firebaseService } from './firebaseService';
import { FirebaseLocationPayload, RiderProfile, OrderStatus } from '@/types/delivery';

const LOCATION_TASK_NAME = 'background-location-task';
const TRACKING_INTERVAL = 5000;

let foregroundSubscription: Location.LocationSubscription | null = null;
let isTrackingActive = false;

export class GPSTrackingService {
  static async requestPermissions(): Promise<boolean> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    const background = await Location.requestBackgroundPermissionsAsync();

    return foreground.status === 'granted' && background.status === 'granted';
  }

  static async checkPermissions(): Promise<boolean> {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();

    return foreground.status === 'granted' && background.status === 'granted';
  }

  static async startForegroundTracking(
    orderId: string,
    rider: RiderProfile,
    onLocationUpdate: (location: Location.LocationObject) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    try {
      const hasPermission = await this.checkPermissions();

      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          onError?.('Location permissions denied');
          return false;
        }
      }

      isTrackingActive = true;

      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: TRACKING_INTERVAL,
        distanceInterval: 5,
        mayShowUserSettingsDialog: true,
      };

      foregroundSubscription = await Location.watchPositionAsync(
        locationOptions,
        async (location) => {
          if (isTrackingActive && foregroundSubscription) {
            onLocationUpdate(location);

            const payload: FirebaseLocationPayload = {
              riderId: rider.riderId,
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              speed: location.coords.speed || 0,
              bearing: location.coords.heading || 0,
              ts: Date.now(),
            };

            await firebaseService.pushLocationUpdate(orderId, payload);
          }
        }
      );

      console.log('Foreground GPS tracking started for order:', orderId);
      return true;
    } catch (error: any) {
      console.error('GPS tracking error:', error);
      onError?.(error.message);
      return false;
    }
  }

  static async stopForegroundTracking(): Promise<void> {
    if (foregroundSubscription) {
      foregroundSubscription.remove();
      foregroundSubscription = null;
    }
    isTrackingActive = false;
    console.log('Foreground GPS tracking stopped');
  }

  static isTrackingActive(): boolean {
    return isTrackingActive;
  }

  static async registerBackgroundTask(): Promise<void> {
    if (TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
      return;
    }

    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('Background location error:', error);
        return;
      }

      if (data) {
        const { locations } = data as any;
        if (locations && locations.length > 0) {
          const location = locations[locations.length - 1];
          console.log(
            'Background location update:',
            location.coords.latitude,
            location.coords.longitude
          );
        }
      }
    });
  }

  static async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Get current location error:', error);
      return null;
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
