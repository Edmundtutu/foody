import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Navigation, MapPin, Store, Maximize2, Minimize2, Map, AlertTriangle } from 'lucide-react-native';
import { Colors, BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { LocationWithName } from '@/types/delivery';

// Conditionally import react-native-maps to handle Expo Go compatibility
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (e) {
  // react-native-maps not available (Expo Go without dev build)
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface DeliveryMapProps {
  currentLocation: { lat: number; lng: number } | null;
  pickup: LocationWithName;
  dropoff: LocationWithName;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showRoute?: boolean;
}

// Fallback component when maps aren't available
function MapPlaceholder({
  currentLocation,
  pickup,
  dropoff,
  isExpanded,
  onToggleExpand,
}: DeliveryMapProps) {
  const mapHeight = isExpanded ? height * 0.5 : 200;

  return (
    <View style={[styles.container, styles.placeholderContainer, { height: mapHeight }]}>
      <View style={styles.placeholderContent}>
        <View style={styles.placeholderIconContainer}>
          <Map size={32} color={Colors.slate[400]} />
        </View>
        <Text style={styles.placeholderTitle}>Map Preview</Text>
        <Text style={styles.placeholderSubtitle}>
          Maps require a development build
        </Text>
        
        {/* Location Cards */}
        <View style={styles.locationCardsContainer}>
          {/* Pickup */}
          <View style={styles.locationCard}>
            <View style={[styles.locationIcon, { backgroundColor: Colors.warning[100] }]}>
              <Store size={14} color={Colors.warning[600]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationName} numberOfLines={1}>{pickup.name}</Text>
              <Text style={styles.locationCoords}>
                {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* Route indicator */}
          <View style={styles.routeIndicator}>
            <View style={styles.routeDot} />
            <View style={styles.routeLine} />
            <View style={styles.routeDot} />
          </View>

          {/* Dropoff */}
          <View style={styles.locationCard}>
            <View style={[styles.locationIcon, { backgroundColor: Colors.success[100] }]}>
              <MapPin size={14} color={Colors.success[600]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationName} numberOfLines={1}>{dropoff.name}</Text>
              <Text style={styles.locationCoords}>
                {dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Current location indicator */}
        {currentLocation && (
          <View style={styles.currentLocationCard}>
            <View style={[styles.locationIcon, { backgroundColor: Colors.primary[100] }]}>
              <Navigation size={14} color={Colors.primary[600]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Your Location</Text>
              <Text style={styles.locationCoords}>
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Expand/Collapse button */}
      {onToggleExpand && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={onToggleExpand}
          activeOpacity={0.7}
        >
          {isExpanded ? (
            <Minimize2 size={18} color={Colors.slate[600]} />
          ) : (
            <Maximize2 size={18} color={Colors.slate[600]} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export function DeliveryMap({
  currentLocation,
  pickup,
  dropoff,
  isExpanded = false,
  onToggleExpand,
  showRoute = true,
}: DeliveryMapProps) {
  // If MapView is not available, show placeholder
  if (!MapView) {
    return (
      <MapPlaceholder
        currentLocation={currentLocation}
        pickup={pickup}
        dropoff={dropoff}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        showRoute={showRoute}
      />
    );
  }

  const mapRef = useRef<typeof MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fit map to show all markers
  const fitToMarkers = () => {
    if (!mapRef.current || !mapReady) return;

    const coordinates = [
      { latitude: pickup.lat, longitude: pickup.lng },
      { latitude: dropoff.lat, longitude: dropoff.lng },
    ];

    if (currentLocation) {
      coordinates.push({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      });
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 60,
        right: 60,
        bottom: 60,
        left: 60,
      },
      animated: true,
    });
  };

  useEffect(() => {
    if (mapReady) {
      setTimeout(fitToMarkers, 500);
    }
  }, [mapReady, currentLocation]);

  // Center on current location
  const centerOnCurrentLocation = () => {
    if (!mapRef.current || !currentLocation) return;

    mapRef.current.animateToRegion({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };

  // Get initial region
  const getInitialRegion = () => {
    if (currentLocation) {
      return {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: LATITUDE_DELTA * 2,
        longitudeDelta: LONGITUDE_DELTA * 2,
      };
    }

    // Center between pickup and dropoff
    return {
      latitude: (pickup.lat + dropoff.lat) / 2,
      longitude: (pickup.lng + dropoff.lng) / 2,
      latitudeDelta: LATITUDE_DELTA * 4,
      longitudeDelta: LONGITUDE_DELTA * 4,
    };
  };

  // Generate route points (simple straight line for demo)
  const getRouteCoordinates = () => {
    const coordinates = [];
    
    if (currentLocation) {
      coordinates.push({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      });
    }
    
    coordinates.push(
      { latitude: pickup.lat, longitude: pickup.lng },
      { latitude: dropoff.lat, longitude: dropoff.lng }
    );

    return coordinates;
  };

  const mapHeight = isExpanded ? height * 0.5 : 200;

  return (
    <View style={[styles.container, { height: mapHeight }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={getInitialRegion()}
        onMapReady={() => setMapReady(true)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        {/* Route line */}
        {showRoute && Polyline && (
          <Polyline
            coordinates={getRouteCoordinates()}
            strokeColor={Colors.primary[500]}
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}

        {/* Pickup marker */}
        {Marker && (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerIcon, styles.pickupMarker]}>
                <Store size={16} color="#ffffff" />
              </View>
              <View style={styles.markerPin} />
            </View>
          </Marker>
        )}

        {/* Dropoff marker */}
        {Marker && (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerIcon, styles.dropoffMarker]}>
                <MapPin size={16} color="#ffffff" />
              </View>
              <View style={[styles.markerPin, { backgroundColor: Colors.success[500] }]} />
            </View>
          </Marker>
        )}

        {/* Current location marker */}
        {currentLocation && Marker && (
          <Marker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
              <View style={styles.currentLocationRing} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        {onToggleExpand && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onToggleExpand}
            activeOpacity={0.7}
          >
            {isExpanded ? (
              <Minimize2 size={20} color={Colors.slate[700]} />
            ) : (
              <Maximize2 size={20} color={Colors.slate[700]} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.controlButton}
          onPress={fitToMarkers}
          activeOpacity={0.7}
        >
          <MapPin size={20} color={Colors.slate[700]} />
        </TouchableOpacity>

        {currentLocation && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnCurrentLocation}
            activeOpacity={0.7}
          >
            <Navigation size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning[500] }]} />
          <Text style={styles.legendText}>Pickup</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success[500] }]} />
          <Text style={styles.legendText}>Dropoff</Text>
        </View>
        {currentLocation && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary[500] }]} />
            <Text style={styles.legendText}>You</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.slate[100],
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  pickupMarker: {
    backgroundColor: Colors.warning[500],
  },
  dropoffMarker: {
    backgroundColor: Colors.success[500],
  },
  markerPin: {
    width: 3,
    height: 8,
    backgroundColor: Colors.warning[500],
    marginTop: -2,
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary[500],
    borderWidth: 3,
    borderColor: '#ffffff',
    ...Shadows.base,
  },
  currentLocationRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[100],
    opacity: 0.5,
  },
  controls: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    gap: Spacing.sm,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.base,
  },
  legend: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[600],
    fontWeight: Typography.fontWeight.medium,
  },
  // Placeholder styles
  placeholderContainer: {
    backgroundColor: Colors.slate[50],
    borderWidth: 1,
    borderColor: Colors.slate[200],
    borderStyle: 'dashed',
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  placeholderIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.slate[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[700],
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.slate[500],
    marginBottom: Spacing.md,
  },
  locationCardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  locationCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    minWidth: 100,
    maxWidth: 130,
    ...Shadows.sm,
  },
  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.slate[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[800],
    marginTop: 2,
  },
  locationCoords: {
    fontSize: 9,
    color: Colors.slate[400],
    fontFamily: 'monospace',
    marginTop: 2,
  },
  routeIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.slate[300],
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.slate[300],
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  expandButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
});
