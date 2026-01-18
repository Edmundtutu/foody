import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useOrderStore } from '@/services/orderService';
import { firebaseService } from '@/services/firebaseService';
import { GPSTrackingService } from '@/services/gpsTrackingService';
import { Order, OrderStatus } from '@/types/delivery';
import { ChevronLeft, AlertCircle, Navigation, Clock } from 'lucide-react-native';

export default function ActiveDeliveryScreen() {
  const router = useRouter();
  const activeOrder = useOrderStore((state) => state.activeOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateGPSLocation = useOrderStore((state) => state.updateGPSLocation);
  const recordFirebaseWrite = useOrderStore((state) => state.recordFirebaseWrite);
  const rider = useOrderStore((state) => state.rider);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrder) {
      router.back();
      return;
    }

    const initializeTracking = async () => {
      try {
        const hasPermission = await GPSTrackingService.checkPermissions();

        if (!hasPermission) {
          const granted = await GPSTrackingService.requestPermissions();
          if (!granted) {
            setError('Location permissions required');
            return;
          }
        }

        const currentLocation = await GPSTrackingService.getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
          updateGPSLocation(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          );
        }

        const success = await GPSTrackingService.startForegroundTracking(
          activeOrder.orderId,
          rider,
          (loc) => {
            setLocation(loc);
            updateGPSLocation(loc.coords.latitude, loc.coords.longitude);

            if (activeOrder.dropoff) {
              const dist = GPSTrackingService.calculateDistance(
                loc.coords.latitude,
                loc.coords.longitude,
                activeOrder.dropoff.lat,
                activeOrder.dropoff.lng
              );
              setDistance(dist);
            }

            setSpeed(loc.coords.speed || 0);
          },
          (err) => {
            setError(err);
          }
        );

        if (success) {
          setIsTracking(true);
        } else {
          setError('Failed to start GPS tracking');
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    initializeTracking();

    return () => {
      GPSTrackingService.stopForegroundTracking();
      setIsTracking(false);
    };
  }, [activeOrder]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!activeOrder) return;

    try {
      updateOrderStatus(activeOrder.orderId, newStatus);

      const firebasePayload = {
        status: newStatus,
        updatedAt: Date.now(),
        riderId: rider.riderId,
      };

      const result = await firebaseService.pushStatusUpdate(
        activeOrder.orderId,
        firebasePayload
      );

      recordFirebaseWrite(
        'status',
        result.success,
        result.timestamp,
        { status: newStatus },
        result.error
      );

      if (newStatus === 'DELIVERED') {
        await GPSTrackingService.stopForegroundTracking();
        setIsTracking(false);

        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message);
      recordFirebaseWrite('status', false, Date.now(), null, err.message);
    }
  };

  if (!activeOrder) {
    return null;
  }

  const statusFlow: OrderStatus[] = [
    'ASSIGNED',
    'PICKED_UP',
    'ON_THE_WAY',
    'DELIVERED',
  ];
  const currentStatusIndex = statusFlow.indexOf(activeOrder.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeOrder.orderId}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{activeOrder.customer.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{activeOrder.customer.phone}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup</Text>
              <Text style={styles.infoValue}>{activeOrder.pickup.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dropoff</Text>
              <Text style={styles.infoValue}>{activeOrder.dropoff.name}</Text>
            </View>
          </View>
        </View>

        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Real-Time Tracking</Text>

            <View style={styles.trackingCard}>
              <View style={styles.trackingRow}>
                <View style={styles.trackingLabel}>
                  <Navigation size={16} color="#2563eb" />
                  <Text style={styles.trackingTitle}>Current Position</Text>
                </View>
                <Text style={styles.trackingValue}>
                  {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                </Text>
              </View>

              <View style={styles.trackingRow}>
                <View style={styles.trackingLabel}>
                  <Clock size={16} color="#10b981" />
                  <Text style={styles.trackingTitle}>Speed</Text>
                </View>
                <Text style={styles.trackingValue}>
                  {(speed * 3.6).toFixed(1)} km/h
                </Text>
              </View>

              {distance !== null && (
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingTitle}>Distance to Destination</Text>
                  <Text style={styles.distanceValue}>{distance.toFixed(2)} km</Text>
                </View>
              )}

              <Text style={styles.trackingNote}>
                {isTracking ? '✓ GPS is broadcasting in real-time' : '○ GPS tracking paused'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>

          <View style={styles.statusFlow}>
            {statusFlow.map((status, idx) => (
              <View key={status} style={styles.statusStep}>
                <View
                  style={[
                    styles.statusCircle,
                    {
                      backgroundColor:
                        idx <= currentStatusIndex ? '#2563eb' : '#e2e8f0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusNumber,
                      {
                        color: idx <= currentStatusIndex ? '#fff' : '#94a3b8',
                      },
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.statusLabel,
                    {
                      color: idx <= currentStatusIndex ? '#2563eb' : '#94a3b8',
                      fontWeight: idx <= currentStatusIndex ? '600' : '400',
                    },
                  ]}
                >
                  {status}
                </Text>
                {idx < statusFlow.length - 1 && (
                  <View
                    style={[
                      styles.statusLine,
                      {
                        backgroundColor:
                          idx < currentStatusIndex ? '#2563eb' : '#e2e8f0',
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <View style={styles.actionsContainer}>
            {currentStatusIndex < statusFlow.length - 1 && (
              <TouchableOpacity
                style={[styles.actionButton, styles.nextButton]}
                onPress={() =>
                  handleStatusUpdate(statusFlow[currentStatusIndex + 1])
                }
              >
                <Text style={styles.nextButtonText}>
                  {activeOrder.status === 'ASSIGNED'
                    ? 'Mark as Picked Up'
                    : activeOrder.status === 'PICKED_UP'
                      ? 'Start Delivery'
                      : 'Mark Delivered'}
                </Text>
              </TouchableOpacity>
            )}

            {activeOrder.status === 'DELIVERED' && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedText}>Order Delivered!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#991b1b',
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  trackingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  trackingRow: {
    gap: 12,
  },
  trackingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  trackingValue: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 24,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginLeft: 24,
  },
  trackingNote: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '500',
  },
  statusFlow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statusStep: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusLine: {
    height: 24,
    width: 2,
    marginVertical: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#2563eb',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  completedBanner: {
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 14,
  },
});
