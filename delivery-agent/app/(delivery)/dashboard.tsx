import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/services/orderService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { 
  ChevronLeft, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Truck, 
  MapPin, 
  Navigation, 
  Database,
  Activity,
  Info
} from 'lucide-react-native';

export default function DemoDashboardScreen() {
  const router = useRouter();
  const lastGPSLocation = useOrderStore((state) => state.lastGPSLocation);
  const lastFirebaseWrite = useOrderStore((state) => state.lastFirebaseWrite);
  const activeOrder = useOrderStore((state) => state.activeOrder);
  const rider = useOrderStore((state) => state.rider);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (copiedField) {
      const timeout = setTimeout(() => setCopiedField(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copiedField]);

  const copyToClipboard = (text: string, field: string) => {
    setCopiedField(field);
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.slate[800]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Debug & Monitoring</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rider Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <User size={16} color={Colors.primary[500]} />
            </View>
            <Text style={styles.sectionTitle}>Rider Profile</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.riderHeader}>
              <View style={styles.riderAvatar}>
                <Truck size={24} color={Colors.primary[500]} />
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{rider.name}</Text>
                <Text style={styles.riderId}>{rider.riderId}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.riderDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Restaurant</Text>
                <Text style={styles.detailValue}>{rider.restaurantId}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>{rider.vehicle}</Text>
              </View>
            </View>
          </View>
        </View>

        {activeOrder && (
          <>
            {/* Active Order Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: Colors.success[50] }]}>
                  <Activity size={16} color={Colors.success[500]} />
                </View>
                <Text style={styles.sectionTitle}>Active Order</Text>
              </View>

              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderIdLabel}>{activeOrder.orderId}</Text>
                  <View style={styles.orderStatusBadge}>
                    <Text style={styles.orderStatusText}>{activeOrder.status}</Text>
                  </View>
                </View>
                <View style={styles.orderCustomer}>
                  <User size={14} color={Colors.slate[400]} />
                  <Text style={styles.orderCustomerText}>{activeOrder.customer.name}</Text>
                </View>
              </View>
            </View>

            {/* GPS Data Section */}
            {lastGPSLocation && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: Colors.primary[50] }]}>
                    <Navigation size={16} color={Colors.primary[500]} />
                  </View>
                  <Text style={styles.sectionTitle}>GPS Coordinates</Text>
                </View>

                <View style={styles.gpsCard}>
                  <View style={styles.gpsRow}>
                    <View style={styles.gpsLabel}>
                      <MapPin size={14} color={Colors.slate[500]} />
                      <Text style={styles.gpsLabelText}>Latitude</Text>
                    </View>
                    <View style={styles.gpsValueContainer}>
                      <Text style={styles.gpsValue}>
                        {lastGPSLocation.lat.toFixed(6)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(lastGPSLocation.lat.toString(), 'lat')}
                        style={styles.copyButton}
                      >
                        {copiedField === 'lat' ? (
                          <CheckCircle size={16} color={Colors.success[500]} />
                        ) : (
                          <Copy size={16} color={Colors.primary[500]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.gpsRow}>
                    <View style={styles.gpsLabel}>
                      <MapPin size={14} color={Colors.slate[500]} />
                      <Text style={styles.gpsLabelText}>Longitude</Text>
                    </View>
                    <View style={styles.gpsValueContainer}>
                      <Text style={styles.gpsValue}>
                        {lastGPSLocation.lng.toFixed(6)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(lastGPSLocation.lng.toString(), 'lng')}
                        style={styles.copyButton}
                      >
                        {copiedField === 'lng' ? (
                          <CheckCircle size={16} color={Colors.success[500]} />
                        ) : (
                          <Copy size={16} color={Colors.primary[500]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.gpsTimestamp}>
                    <Text style={styles.timestampText}>
                      Last updated: {formatTimestamp(lastGPSLocation.ts)}
                    </Text>
                  </View>

                  <View style={styles.codeBlock}>
                    <Text style={styles.codeTitle}>Firebase Payload</Text>
                    <Text style={styles.code}>
{`{
  "riderId": "${rider.riderId}",
  "lat": ${lastGPSLocation.lat.toFixed(6)},
  "lng": ${lastGPSLocation.lng.toFixed(6)},
  "speed": 0,
  "bearing": 0,
  "ts": ${lastGPSLocation.ts}
}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Firebase Write Status */}
            {lastFirebaseWrite && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: lastFirebaseWrite.success ? Colors.success[50] : Colors.error[50] }]}>
                    <Database size={16} color={lastFirebaseWrite.success ? Colors.success[500] : Colors.error[500]} />
                  </View>
                  <Text style={styles.sectionTitle}>Firebase Status</Text>
                </View>

                <View style={styles.firebaseCard}>
                  <View style={styles.firebaseStatus}>
                    <View style={[styles.statusDot, { backgroundColor: lastFirebaseWrite.success ? Colors.success[500] : Colors.error[500] }]} />
                    <View style={styles.firebaseInfo}>
                      <Text style={styles.firebaseType}>
                        {lastFirebaseWrite.type === 'location' ? 'GPS Location Update' : 'Order Status Update'}
                      </Text>
                      <Text style={styles.firebaseTime}>
                        {formatTimestamp(lastFirebaseWrite.timestamp)}
                      </Text>
                    </View>
                    {lastFirebaseWrite.success ? (
                      <CheckCircle size={20} color={Colors.success[500]} />
                    ) : (
                      <AlertCircle size={20} color={Colors.error[500]} />
                    )}
                  </View>

                  {lastFirebaseWrite.data && (
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeTitle}>Data Sent</Text>
                      <Text style={styles.code}>
                        {JSON.stringify(lastFirebaseWrite.data, null, 2)}
                      </Text>
                    </View>
                  )}

                  {lastFirebaseWrite.error && (
                    <View style={styles.errorBlock}>
                      <AlertCircle size={14} color={Colors.error[600]} />
                      <Text style={styles.errorText}>{lastFirebaseWrite.error}</Text>
                    </View>
                  )}

                  <View style={styles.pathBlock}>
                    <Text style={styles.pathLabel}>Path:</Text>
                    <Text style={styles.pathValue}>
                      {lastFirebaseWrite.type === 'location'
                        ? `/liveLocations/${activeOrder.orderId}`
                        : `/orderStatus/${activeOrder.orderId}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {!lastFirebaseWrite && (
              <View style={styles.section}>
                <View style={styles.waitingCard}>
                  <ActivityIndicator size="small" color={Colors.primary[500]} />
                  <Text style={styles.waitingText}>Waiting for Firebase write...</Text>
                </View>
              </View>
            )}
          </>
        )}

        {!activeOrder && (
          <View style={styles.section}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Activity size={32} color={Colors.slate[300]} />
              </View>
              <Text style={styles.emptyTitle}>No Active Delivery</Text>
              <Text style={styles.emptyText}>
                Start a delivery to see real-time GPS and Firebase data here
              </Text>
            </View>
          </View>
        )}

        {/* Architecture Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.success[50] }]}>
              <Info size={16} color={Colors.success[500]} />
            </View>
            <Text style={styles.sectionTitle}>Architecture Notes</Text>
          </View>
          
          <View style={styles.notesCard}>
            <View style={styles.noteItem}>
              <View style={styles.noteBullet} />
              <Text style={styles.noteText}>GPS updates every 5-10 seconds during delivery</Text>
            </View>
            <View style={styles.noteItem}>
              <View style={styles.noteBullet} />
              <Text style={styles.noteText}>All data pushed to Firebase Realtime DB</Text>
            </View>
            <View style={styles.noteItem}>
              <View style={styles.noteBullet} />
              <Text style={styles.noteText}>Paths: /liveLocations and /orderStatus</Text>
            </View>
            <View style={styles.noteItem}>
              <View style={styles.noteBullet} />
              <Text style={styles.noteText}>Foreground GPS service with lifecycle control</Text>
            </View>
            <View style={styles.noteItem}>
              <View style={styles.noteBullet} />
              <Text style={styles.noteText}>Mock orders stored locally (no backend yet)</Text>
            </View>
          </View>
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
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
  },
  riderId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[500],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.slate[100],
  },
  riderDetails: {
    flexDirection: 'row',
    padding: Spacing.base,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[800],
    fontWeight: Typography.fontWeight.semibold,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderIdLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
  },
  orderStatusBadge: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  orderStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#ffffff',
  },
  orderCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  orderCustomerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[600],
  },
  gpsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  gpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.slate[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  gpsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gpsLabelText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[600],
    fontWeight: Typography.fontWeight.medium,
  },
  gpsValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gpsValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 4,
  },
  gpsTimestamp: {
    alignItems: 'center',
  },
  timestampText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
  },
  codeBlock: {
    backgroundColor: Colors.slate[900],
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
  },
  codeTitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[400],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 11,
    color: Colors.success[500],
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  firebaseCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  firebaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  firebaseInfo: {
    flex: 1,
  },
  firebaseType: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[900],
  },
  firebaseTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
    marginTop: 2,
  },
  errorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error[700],
  },
  pathBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[500],
  },
  pathLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  pathValue: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    fontFamily: 'monospace',
    fontWeight: Typography.fontWeight.semibold,
  },
  waitingCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  waitingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[500],
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.slate[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[700],
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success[500],
    gap: Spacing.sm,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  noteBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success[500],
    marginTop: 6,
  },
  noteText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.success[700],
    lineHeight: 20,
  },
});
