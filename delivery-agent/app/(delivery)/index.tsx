import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/services/orderService';
import { GPSTrackingService } from '@/services/gpsTrackingService';
import { OrderCard } from '@/components/OrderCard';
import { Order } from '@/types/delivery';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { MapPin, Menu, Truck, AlertTriangle, Package } from 'lucide-react-native';

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useOrderStore((state) => state.orders);
  const acceptOrder = useOrderStore((state) => state.acceptOrder);
  const setActiveOrder = useOrderStore((state) => state.setActiveOrder);
  const rider = useOrderStore((state) => state.rider);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const hasPermission = await GPSTrackingService.checkPermissions();
      setPermissionGranted(hasPermission);
      setLoading(false);
    };

    checkPermissions();
  }, []);

  const handleAcceptOrder = (orderId: string) => {
    acceptOrder(orderId);
  };

  const handleStartDelivery = (order: Order) => {
    setActiveOrder(order);
    router.push('/(delivery)/active');
  };

  const handleRequestPermissions = async () => {
    setLoading(true);
    const granted = await GPSTrackingService.requestPermissions();
    setPermissionGranted(granted);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, would fetch from API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Truck size={20} color={Colors.primary[500]} />
          </View>
          <View>
            <Text style={styles.greeting}>Hello, {rider.name}</Text>
            <Text style={styles.subtitle}>{rider.vehicle} • Ready to deliver</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(delivery)/dashboard')}
          style={styles.dashboardButton}
        >
          <Menu size={24} color={Colors.slate[700]} />
        </TouchableOpacity>
      </View>

      {/* Permission Warning */}
      {!permissionGranted && (
        <View style={styles.permissionWarning}>
          <View style={styles.warningIconContainer}>
            <AlertTriangle size={20} color={Colors.warning[600]} />
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Location Permission Required</Text>
            <Text style={styles.warningText}>
              We need location access to track deliveries and show your position to customers.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestPermissions}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Orders List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MapPin size={18} color={Colors.primary[500]} />
            </View>
            <Text style={styles.sectionTitle}>Assigned Orders</Text>
            <View style={styles.orderCountBadge}>
              <Text style={styles.orderCountText}>{orders.length}</Text>
            </View>
          </View>

          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Package size={48} color={Colors.slate[300]} />
              </View>
              <Text style={styles.emptyStateTitle}>No Orders Yet</Text>
              <Text style={styles.emptyStateText}>
                New orders will appear here when they're assigned to you
              </Text>
            </View>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onAccept={handleAcceptOrder}
                onStart={handleStartDelivery}
              />
            ))
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[500],
    marginTop: 2,
  },
  dashboardButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionWarning: {
    flexDirection: 'row',
    backgroundColor: Colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning[500],
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    gap: Spacing.md,
  },
  warningIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.warning[700],
    marginBottom: 4,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning[600],
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  permissionButton: {
    backgroundColor: Colors.warning[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.sm,
  },
  content: {
    flex: 1,
  },
  ordersSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
  },
  orderCountBadge: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  orderCountText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyState: {
    backgroundColor: Colors.card,
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.slate[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[700],
    marginBottom: Spacing.xs,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.slate[500],
    fontWeight: Typography.fontWeight.medium,
  },
});
