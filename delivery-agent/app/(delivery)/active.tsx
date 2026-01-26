import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useOrderStore } from '@/services/orderService';
import { firebaseService } from '@/services/firebaseService';
import { GPSTrackingService } from '@/services/gpsTrackingService';
import { OrderStatus } from '@/types/delivery';
import { DeliveryMap } from '@/components/DeliveryMap';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  ChevronLeft,
  AlertCircle,
  Navigation,
  Clock,
  Phone,
  MapPin,
  Store,
  User,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react-native';

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
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    if (!activeOrder) {
      router.back();
      return;
    }
    
    // Handle null rider (authentication failed)
    if (!rider) {
      router.replace('/(delivery)');
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
        riderId: rider?.riderId || '',
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

  // Agent can only proceed from PICKED_UP onwards
  // If order is ASSIGNED, agent should wait for vendor to mark as PICKED_UP
  const statusFlow: OrderStatus[] = [
    'PICKED_UP',
    'ON_THE_WAY',
    'DELIVERED',
  ];
  
  // Find current status index, defaulting to 0 (PICKED_UP) if status is ASSIGNED
  let currentStatusIndex = statusFlow.indexOf(activeOrder.status);
  if (currentStatusIndex === -1) {
    // If status is ASSIGNED, agent hasn't picked up yet - show PICKED_UP as first step
    currentStatusIndex = -1; // Will be handled in UI to show "waiting" state
  }

  const statusConfig = {
    ASSIGNED: { label: 'Assigned', color: Colors.status.assigned },
    PICKED_UP: { label: 'Picked Up', color: Colors.status.pickedUp },
    ON_THE_WAY: { label: 'On The Way', color: Colors.status.onTheWay },
    DELIVERED: { label: 'Delivered', color: Colors.status.delivered },
  };

  const getNextActionLabel = () => {
    switch (activeOrder.status) {
      case 'ASSIGNED':
        // Agent cannot mark as picked up - vendor must do this
        return 'Waiting for Pickup';
      case 'PICKED_UP':
        return 'Start Delivery';
      case 'ON_THE_WAY':
        return 'Complete Delivery';
      default:
        return '';
    }
  };

  const handleCallCustomer = () => {
    if (activeOrder?.customer.phone) {
      Linking.openURL(`tel:${activeOrder.customer.phone}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.slate[800]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{activeOrder.orderId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig[activeOrder.status].color }]}>
            <Text style={styles.statusBadgeText}>{statusConfig[activeOrder.status].label}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={Colors.error[600]} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Map Section */}
        <View style={styles.section}>
          <DeliveryMap
            currentLocation={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null}
            pickup={activeOrder.pickup}
            dropoff={activeOrder.dropoff}
            isExpanded={mapExpanded}
            onToggleExpand={() => setMapExpanded(!mapExpanded)}
          />
        </View>

        {/* Tracking Stats */}
        {location && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Navigation size={20} color={Colors.primary[500]} />
              <Text style={styles.statValue}>
                {distance !== null ? `${distance.toFixed(1)} km` : '--'}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={20} color={Colors.success[500]} />
              <Text style={styles.statValue}>{(speed * 3.6).toFixed(0)} km/h</Text>
              <Text style={styles.statLabel}>Speed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.trackingDot, { backgroundColor: isTracking ? Colors.success[500] : Colors.slate[300] }]} />
              <Text style={styles.statValue}>{isTracking ? 'Active' : 'Paused'}</Text>
              <Text style={styles.statLabel}>GPS</Text>
            </View>
          </View>
        )}

        {/* Customer & Location Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          
          <View style={styles.infoCard}>
            {/* Customer */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={18} color={Colors.primary[500]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{activeOrder.customer.name}</Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                <Phone size={18} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoDivider} />

            {/* Pickup */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconContainer, { backgroundColor: Colors.warning[50] }]}>
                <Store size={18} color={Colors.warning[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pickup Location</Text>
                <Text style={styles.infoValue}>{activeOrder.pickup.name}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            {/* Dropoff */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconContainer, { backgroundColor: Colors.success[50] }]}>
                <MapPin size={18} color={Colors.success[600]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Dropoff Location</Text>
                <Text style={styles.infoValue}>{activeOrder.dropoff.name}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          
          <View style={styles.timeline}>
            {/* Show ASSIGNED status if order is still assigned (before pickup) */}
            {activeOrder.status === 'ASSIGNED' && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <Circle
                    size={24}
                    color={Colors.status.assigned}
                    fill={Colors.status.assigned}
                  />
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: Colors.slate[200] },
                    ]}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: Colors.slate[900],
                        fontWeight: '600',
                      },
                    ]}
                  >
                    Assigned (Waiting for Pickup)
                  </Text>
                </View>
              </View>
            )}
            
            {statusFlow.map((status, idx) => {
              // Adjust index if ASSIGNED status was shown
              const adjustedIdx = activeOrder.status === 'ASSIGNED' ? idx + 1 : idx;
              const isCompleted = adjustedIdx <= currentStatusIndex && currentStatusIndex >= 0;
              const isCurrent = activeOrder.status === status;
              const config = statusConfig[status];

              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    {isCompleted ? (
                      <CheckCircle2 size={24} color={Colors.success[500]} />
                    ) : (
                      <Circle
                        size={24}
                        color={isCurrent ? config.color : Colors.slate[300]}
                        fill={isCurrent ? config.color : 'transparent'}
                      />
                    )}
                    {idx < statusFlow.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: isCompleted ? Colors.success[500] : Colors.slate[200] },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        {
                          color: isCompleted || isCurrent ? Colors.slate[900] : Colors.slate[400],
                          fontWeight: isCurrent ? '600' : '400',
                        },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {/* Only show if status is PICKED_UP or ON_THE_WAY (agent can proceed) */}
      {activeOrder.status !== 'ASSIGNED' && currentStatusIndex < statusFlow.length - 1 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => handleStatusUpdate(statusFlow[currentStatusIndex + 1])}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonText}>{getNextActionLabel()}</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Show waiting message if order is ASSIGNED (waiting for vendor to mark as PICKED_UP) */}
      {activeOrder.status === 'ASSIGNED' && (
        <View style={styles.floatingButtonContainer}>
          <View style={[styles.floatingButton, { backgroundColor: Colors.slate[400], opacity: 0.8 }]}>
            <Text style={styles.floatingButtonText}>
              Waiting for restaurant to mark as picked up
            </Text>
          </View>
        </View>
      )}

      {/* Delivered Banner */}
      {activeOrder.status === 'DELIVERED' && (
        <View style={styles.deliveredBanner}>
          <CheckCircle2 size={24} color={Colors.success[600]} />
          <Text style={styles.deliveredText}>Order Delivered Successfully!</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.slate[50],
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
    marginBottom: Spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error[500],
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error[700],
    fontWeight: Typography.fontWeight.medium,
  },
  errorDismiss: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[600],
    fontWeight: Typography.fontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
    fontWeight: Typography.fontWeight.medium,
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.slate[900],
    fontWeight: Typography.fontWeight.semibold,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.slate[100],
    marginLeft: 68,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeline: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineLine: {
    width: 2,
    height: 24,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  timelineLabel: {
    fontSize: Typography.fontSize.base,
    paddingTop: 2,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.slate[200],
  },
  floatingButton: {
    backgroundColor: Colors.primary[500],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  floatingButtonText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  deliveredBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success[50],
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.success[200],
  },
  deliveredText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success[700],
  },
});
