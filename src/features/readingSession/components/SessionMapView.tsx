import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { hasGoogleMapsApiKey } from '@/src/config/maps';
import { CommuteMapPlaceholder } from '@/src/features/readingSession/components/CommuteMapPlaceholder';
import type { AlertPoint, PlaceMarker } from '@/src/features/readingSession/types/readingSession.types';

const COLORS = {
  ORIGIN: '#1E88E5',
  DEST: '#E53935',
  TRANSFER: '#2C8C55',
  SUBTITLE: '#7A7A7A',
};

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Props = {
  mapRegion: MapRegion;
  origin: PlaceMarker | null;
  destination: PlaceMarker | null;
  transferMarkers: AlertPoint[];
};

type MapsModule = {
  MapView: React.ComponentType<Record<string, unknown>>;
  Marker: React.ComponentType<Record<string, unknown>>;
  PROVIDER_GOOGLE?: string;
};

export default function SessionMapView({
  mapRegion,
  origin,
  destination,
  transferMarkers,
}: Props) {
  const [maps, setMaps] = useState<MapsModule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapsKeyReady = hasGoogleMapsApiKey();

  useEffect(() => {
    if (!mapsKeyReady) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('react-native-maps') as MapsModule & { default: MapsModule['MapView'] };
      setMaps({
        MapView: mod.default,
        Marker: mod.Marker,
        PROVIDER_GOOGLE: mod.PROVIDER_GOOGLE,
      });
    } catch {
      setLoadError('지도 모듈을 불러올 수 없습니다.');
    }
  }, [mapsKeyReady]);

  if (!mapsKeyReady) {
    return (
      <CommuteMapPlaceholder
        origin={origin}
        destination={destination}
        transferMarkers={transferMarkers}
      />
    );
  }

  if (loadError) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{loadError}</Text>
        <Text style={styles.fallbackHint}>
          expo-location·react-native-maps 설치 후 `npm run android`로 앱을 다시 빌드해 주세요.
        </Text>
      </View>
    );
  }

  if (!maps) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator size="small" color={COLORS.TRANSFER} />
      </View>
    );
  }

  const { MapView, Marker, PROVIDER_GOOGLE } = maps;

  return (
    <MapView
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={mapRegion}
      showsUserLocation
      showsMyLocationButton
      toolbarEnabled={false}>
      {origin ? (
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          title="출발지"
          description={origin.name}
          pinColor={COLORS.ORIGIN}
        />
      ) : null}
      {destination ? (
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title="도착"
          description={destination.name}
          pinColor={COLORS.DEST}
        />
      ) : null}
      {transferMarkers.map((point) => (
        <Marker
          key={point.id}
          coordinate={{ latitude: point.lat, longitude: point.lng }}
          title={point.name}
          description={point.type === 'WALK' ? '도보' : '환승'}
          pinColor={point.type === 'WALK' ? '#757575' : COLORS.TRANSFER}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 280,
  },
  fallback: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
  },
  fallbackHint: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    lineHeight: 18,
  },
});
