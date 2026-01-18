import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/services/orderService';
import { ChevronLeft, Copy, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react-native';

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

  const getStatusColor = (success: boolean) => {
    return success ? '#10b981' : '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demo Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rider Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Rider ID</Text>
              <Text style={styles.value}>{rider.riderId}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{rider.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Restaurant</Text>
              <Text style={styles.value}>{rider.restaurantId}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Vehicle</Text>
              <Text style={styles.value}>{rider.vehicle}</Text>
            </View>
          </View>
        </View>

        {activeOrder && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Order</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Order ID</Text>
                  <Text style={styles.value}>{activeOrder.orderId}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={styles.value}>{activeOrder.status}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Customer</Text>
                  <Text style={styles.value}>{activeOrder.customer.name}</Text>
                </View>
              </View>
            </View>

            {lastGPSLocation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Latest GPS Update</Text>

                <View style={styles.dataCard}>
                  <View style={styles.dataRow}>
                    <View style={styles.dataLabel}>
                      <Text style={styles.label}>Latitude</Text>
                      <TouchableOpacity
                        onPress={() =>
                          copyToClipboard(
                            lastGPSLocation.lat.toString(),
                            'lat'
                          )
                        }
                      >
                        <Copy size={16} color="#2563eb" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.dataValue}>
                      {lastGPSLocation.lat.toFixed(6)}
                    </Text>
                    {copiedField === 'lat' && (
                      <CheckCircle size={16} color="#10b981" />
                    )}
                  </View>

                  <View style={styles.dataRow}>
                    <View style={styles.dataLabel}>
                      <Text style={styles.label}>Longitude</Text>
                      <TouchableOpacity
                        onPress={() =>
                          copyToClipboard(
                            lastGPSLocation.lng.toString(),
                            'lng'
                          )
                        }
                      >
                        <Copy size={16} color="#2563eb" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.dataValue}>
                      {lastGPSLocation.lng.toFixed(6)}
                    </Text>
                    {copiedField === 'lng' && (
                      <CheckCircle size={16} color="#10b981" />
                    )}
                  </View>

                  <View style={styles.dataRow}>
                    <View style={styles.dataLabel}>
                      <Text style={styles.label}>Timestamp</Text>
                    </View>
                    <Text style={styles.dataValue}>
                      {formatTimestamp(lastGPSLocation.ts)}
                    </Text>
                  </View>

                  <View style={styles.codeBlock}>
                    <Text style={styles.codeTitle}>Firebase Payload:</Text>
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

            {lastFirebaseWrite && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Last Firebase Write</Text>

                <View style={styles.statusCard}>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor: getStatusColor(
                            lastFirebaseWrite.success
                          ),
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusType}>
                        {lastFirebaseWrite.type === 'location'
                          ? 'GPS Location Update'
                          : 'Order Status Update'}
                      </Text>
                      <Text style={styles.statusTime}>
                        {formatTimestamp(lastFirebaseWrite.timestamp)}
                      </Text>
                    </View>
                    {lastFirebaseWrite.success ? (
                      <CheckCircle size={20} color="#10b981" />
                    ) : (
                      <AlertCircle size={20} color="#ef4444" />
                    )}
                  </View>

                  {lastFirebaseWrite.data && (
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeTitle}>Data Sent:</Text>
                      <Text style={styles.code}>
                        {JSON.stringify(lastFirebaseWrite.data, null, 2)}
                      </Text>
                    </View>
                  )}

                  {lastFirebaseWrite.error && (
                    <View style={styles.errorBlock}>
                      <Text style={styles.errorText}>
                        Error: {lastFirebaseWrite.error}
                      </Text>
                    </View>
                  )}

                  <View style={styles.firebasePathBlock}>
                    <Text style={styles.firebasePath}>
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
                <View style={styles.emptyCard}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={styles.emptyText}>Waiting for Firebase write...</Text>
                </View>
              </View>
            )}
          </>
        )}

        {!activeOrder && (
          <View style={styles.section}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No active delivery. Start a delivery to see real-time data.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Architecture Notes</Text>
          <View style={styles.notesCard}>
            <Text style={styles.noteText}>
              • GPS coordinates update every 5-10 seconds when ON_THE_WAY
            </Text>
            <Text style={styles.noteText}>
              • All data is pushed to Firebase Realtime DB
            </Text>
            <Text style={styles.noteText}>
              • Firebase paths: /liveLocations and /orderStatus
            </Text>
            <Text style={styles.noteText}>
              • Foreground GPS service is always active and controlled
            </Text>
            <Text style={styles.noteText}>
              • Mock orders are locally stored (no backend yet)
            </Text>
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
  label: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dataLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dataValue: {
    fontSize: 12,
    color: '#1e293b',
    fontFamily: 'monospace',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  codeBlock: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  codeTitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
  },
  code: {
    fontSize: 10,
    color: '#22c55e',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  errorBlock: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
  },
  firebasePathBlock: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#2563eb',
  },
  firebasePath: {
    fontSize: 11,
    color: '#1e40af',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 18,
  },
});
