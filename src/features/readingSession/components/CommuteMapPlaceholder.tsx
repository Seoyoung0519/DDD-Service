import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import type { AlertPoint, PlaceMarker } from '@/src/features/readingSession/types/readingSession.types';

const COLORS = {
  ORIGIN: '#1E88E5',
  DEST: '#E53935',
  TRANSFER: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#7A7A7A',
  BG: '#EEF4F8',
  BORDER: '#D6E4EC',
};

type Props = {
  origin: PlaceMarker | null;
  destination: PlaceMarker | null;
  transferMarkers: AlertPoint[];
};

export function CommuteMapPlaceholder({ origin, destination, transferMarkers }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Ionicons name="map-outline" size={16} color={COLORS.SUBTITLE} />
        <Text style={styles.badgeText}>지도 미리보기 (API 키 없음)</Text>
      </View>

      <View style={styles.routeCol}>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.ORIGIN }]} />
          <View style={styles.rowText}>
            <Text style={styles.label}>출발</Text>
            <Text style={styles.name}>{origin?.name ?? '출발지'}</Text>
          </View>
        </View>

        {transferMarkers.map((point) => (
          <View key={point.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: COLORS.TRANSFER }]} />
            <View style={styles.rowText}>
              <Text style={styles.label}>환승</Text>
              <Text style={styles.name}>{point.name}</Text>
            </View>
          </View>
        ))}

        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.DEST }]} />
          <View style={styles.rowText}>
            <Text style={styles.label}>도착</Text>
            <Text style={styles.name}>{destination?.name ?? '도착지'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.hint}>
        지도가 보이지 않으면 Google Cloud에서 Maps SDK for Android를 켜고, API 키 제한에 패키지
        com.daedokdan.app 과 디버그 SHA-1을 등록한 뒤 Metro 재시작·앱 재빌드를 해 주세요.
        {Platform.OS === 'android' ? ' (npm run android)' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 280,
    backgroundColor: COLORS.BG,
    padding: 16,
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
  },
  routeCol: {
    gap: 10,
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    color: COLORS.SUBTITLE,
  },
  name: {
    fontSize: 14,
    color: COLORS.TEXT,
    lineHeight: 20,
  },
  hint: {
    fontSize: 11,
    color: COLORS.SUBTITLE,
    lineHeight: 16,
    marginTop: 4,
  },
});
