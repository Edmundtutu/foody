import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '@/types/delivery';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { MapPin, Phone, Store, ChevronRight, Package } from 'lucide-react-native';

interface OrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onStart: (order: Order) => void;
}

export function OrderCard({ order, onAccept, onStart }: OrderCardProps) {
  const statusConfig = {
    ASSIGNED: { label: 'Assigned', color: Colors.status.assigned, bgColor: Colors.warning[50] },
    PICKED_UP: { label: 'Picked Up', color: Colors.status.pickedUp, bgColor: Colors.primary[50] },
    ON_THE_WAY: { label: 'On the Way', color: Colors.status.onTheWay, bgColor: '#f3e8ff' },
    DELIVERED: { label: 'Delivered', color: Colors.status.delivered, bgColor: Colors.success[50] },
  };

  const status = statusConfig[order.status];
  const isDeliverable = order.status === 'ASSIGNED' || order.status === 'PICKED_UP';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.orderIconContainer}>
            <Package size={18} color={Colors.primary[500]} />
          </View>
          <View>
            <Text style={styles.orderId}>{order.orderId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customer.name}</Text>
          <View style={styles.phoneRow}>
            <Phone size={12} color={Colors.slate[400]} />
            <Text style={styles.phone}>{order.customer.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Locations */}
      <View style={styles.locations}>
        <View style={styles.location}>
          <View style={[styles.locationIcon, { backgroundColor: Colors.warning[50] }]}>
            <Store size={14} color={Colors.warning[600]} />
          </View>
          <View style={styles.locationContent}>
            <Text style={styles.locationType}>Pickup</Text>
            <Text style={styles.locationName}>{order.pickup.name}</Text>
          </View>
        </View>

        <View style={styles.locationConnector}>
          <View style={styles.connectorLine} />
          <View style={styles.connectorDot} />
        </View>

        <View style={styles.location}>
          <View style={[styles.locationIcon, { backgroundColor: Colors.success[50] }]}>
            <MapPin size={14} color={Colors.success[600]} />
          </View>
          <View style={styles.locationContent}>
            <Text style={styles.locationType}>Dropoff</Text>
            <Text style={styles.locationName}>{order.dropoff.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.items}>
        <Text style={styles.itemsTitle}>Order Items ({order.items.length})</Text>
        <View style={styles.itemsList}>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemQty}>
                <Text style={styles.itemQtyText}>{item.qty}x</Text>
              </View>
              <Text style={styles.itemText}>{item.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {order.status === 'ASSIGNED' && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onAccept(order.orderId)}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Accept</Text>
          </TouchableOpacity>
        )}

        {isDeliverable && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onStart(order)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {order.status === 'ASSIGNED' ? 'Start Delivery' : 'Continue'}
            </Text>
            <ChevronRight size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  orderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderId: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  customerInfo: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[800],
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.slate[100],
    marginVertical: Spacing.md,
  },
  locations: {
    gap: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContent: {
    flex: 1,
  },
  locationType: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
    fontWeight: Typography.fontWeight.medium,
  },
  locationName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[800],
    fontWeight: Typography.fontWeight.medium,
    marginTop: 1,
  },
  locationConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    paddingVertical: 2,
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.slate[200],
  },
  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.slate[300],
    marginLeft: -2,
  },
  items: {
    marginBottom: Spacing.md,
  },
  itemsTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[500],
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemQty: {
    backgroundColor: Colors.slate[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  itemQtyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[600],
  },
  itemText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[700],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
  },
});
