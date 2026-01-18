import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '@/types/delivery';
import { MapPin, Phone } from 'lucide-react-native';

interface OrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onStart: (order: Order) => void;
}

export function OrderCard({ order, onAccept, onStart }: OrderCardProps) {
  const statusColors = {
    ASSIGNED: '#f59e0b',
    PICKED_UP: '#3b82f6',
    ON_THE_WAY: '#10b981',
    DELIVERED: '#8b5cf6',
  };

  const statusLabel = {
    ASSIGNED: 'Assigned',
    PICKED_UP: 'Picked Up',
    ON_THE_WAY: 'On the Way',
    DELIVERED: 'Delivered',
  };

  const isDeliverable = order.status === 'ASSIGNED' || order.status === 'PICKED_UP';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] }]}>
            <Text style={styles.statusText}>{statusLabel[order.status]}</Text>
          </View>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customer.name}</Text>
          <View style={styles.phoneRow}>
            <Phone size={14} color="#64748b" />
            <Text style={styles.phone}>{order.customer.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.locations}>
        <View style={styles.location}>
          <View style={styles.pin}>
            <MapPin size={16} color="#ef4444" />
          </View>
          <View>
            <Text style={styles.locationType}>Pickup</Text>
            <Text style={styles.locationName}>{order.pickup.name}</Text>
          </View>
        </View>

        <View style={styles.location}>
          <View style={styles.pin}>
            <MapPin size={16} color="#22c55e" />
          </View>
          <View>
            <Text style={styles.locationType}>Dropoff</Text>
            <Text style={styles.locationName}>{order.dropoff.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.items}>
        <Text style={styles.itemsTitle}>Items ({order.items.length})</Text>
        {order.items.map((item, idx) => (
          <Text key={idx} style={styles.itemText}>
            {item.qty}x {item.name}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        {order.status === 'ASSIGNED' && (
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => onAccept(order.orderId)}
          >
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          </TouchableOpacity>
        )}

        {isDeliverable && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={() => onStart(order)}
          >
            <Text style={styles.startButtonText}>
              {order.status === 'ASSIGNED' ? 'Start Delivery' : 'Continue'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  customerInfo: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    fontSize: 12,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  locations: {
    gap: 12,
    marginBottom: 12,
  },
  location: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  pin: {
    marginTop: 2,
  },
  locationType: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  locationName: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
    marginTop: 2,
  },
  items: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  itemText: {
    fontSize: 12,
    color: '#475569',
    marginVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  acceptButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 13,
  },
  startButton: {
    backgroundColor: '#2563eb',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
