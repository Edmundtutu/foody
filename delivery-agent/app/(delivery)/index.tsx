import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/services/orderService';
import { GPSTrackingService } from '@/services/gpsTrackingService';
import { OrderCard } from '@/components/OrderCard';
import { Order } from '@/types/delivery';
import { MapPin, Menu } from 'lucide-react-native';

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useOrderStore((state) => state.orders);
  const acceptOrder = useOrderStore((state) => state.acceptOrder);
  const setActiveOrder = useOrderStore((state) => state.setActiveOrder);
  const rider = useOrderStore((state) => state.rider);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {rider.name}</Text>
          <Text style={styles.subtitle}>{rider.vehicle} Delivery</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(delivery)/dashboard')}
          style={styles.dashboardButton}
        >
          <Menu size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {!permissionGranted && (
        <View style={styles.permissionWarning}>
          <Text style={styles.warningTitle}>Location Permission Required</Text>
          <Text style={styles.warningText}>
            We need location access to track deliveries
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermissions}
          >
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>
              Assigned Orders ({orders.length})
            </Text>
          </View>

          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No orders assigned yet</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  dashboardButton: {
    padding: 8,
  },
  permissionWarning: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#b45309',
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  ordersSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptyState: {
    backgroundColor: '#fff',
    paddingVertical: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
