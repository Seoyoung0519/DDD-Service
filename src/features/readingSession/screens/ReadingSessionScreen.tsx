import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmEndSessionModal } from '@/src/features/readingSession/components/ConfirmEndSessionModal';
import SessionMapView from '@/src/features/readingSession/components/SessionMapView';
import { DemoLocationControls } from '@/src/features/readingSession/components/DemoLocationControls';
import { RouteProgressCard } from '@/src/features/readingSession/components/RouteProgressCard';
import { useReadingSession } from '@/src/features/readingSession/hooks/useReadingSession';
import type { LatLng } from '@/src/features/readingSession/types/readingSession.types';

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#7A7A7A',
  BORDER: '#E8E8E8',
  BG: '#FFFFFF',
  TOGGLE_BG: '#F2F2F2',
  TOGGLE_ACTIVE: '#3D3D3D',
  CARD_BG: '#F7F7F7',
};

const FONTS = {
  BOLD: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

type ViewMode = 'timer' | 'map';

function buildMapRegion(points: LatLng[]) {
  if (points.length === 0) {
    return {
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max((maxLat - minLat) * 1.6, 0.01);
  const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.01);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export default function ReadingSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('timer');
  const [confirmEndVisible, setConfirmEndVisible] = useState(false);

  const {
    state,
    beginningFinishFlow,
    remainingLabel,
    startTimeLabel,
    relativeTimeLabel,
    beginFinishFlow,
    transferMarkers,
    routeProgress,
    isDemoLocation,
    demoStepIndex,
    demoTotalSteps,
    advanceDemoLocation,
  } = useReadingSession();

  const mapPoints = React.useMemo(() => {
    const pts: LatLng[] = [];
    if (state.origin) pts.push(state.origin);
    if (state.destination) pts.push(state.destination);
    if (state.currentLocation) pts.push(state.currentLocation);
    transferMarkers.forEach((m) => pts.push({ lat: m.lat, lng: m.lng }));
    return pts;
  }, [state.origin, state.destination, state.currentLocation, transferMarkers]);

  const mapRegion = React.useMemo(() => buildMapRegion(mapPoints), [mapPoints]);

  const onBack = () => {
    if (!state.isSessionActive) {
      router.back();
      return;
    }
    Alert.alert('독서 세션', '세션을 중단하고 나가시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '중단하기',
        style: 'destructive',
        onPress: () => setConfirmEndVisible(true),
      },
    ]);
  };

  const onStopPress = () => {
    setConfirmEndVisible(true);
  };

  const onConfirmEnd = () => {
    setConfirmEndVisible(false);
    void beginFinishFlow();
  };

  if (!state.permissionsReady && !state.locationError) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>독서 세션을 준비하는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로">
          <Ionicons name="chevron-back" size={28} color={COLORS.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>
          대독단과 <Text style={styles.headerAccent}>독서</Text>하기
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setViewMode('timer')}
          style={[styles.toggleBtn, viewMode === 'timer' && styles.toggleBtnActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'timer' }}>
          <Text style={[styles.toggleText, viewMode === 'timer' && styles.toggleTextActive]}>
            타이머
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('map')}
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'map' }}>
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            지도
          </Text>
        </Pressable>
      </View>

      {viewMode === 'timer' ? (
        <View style={styles.timerBody}>
          <Text style={styles.sectionLabel}>남은 독서 시간</Text>
          <Text style={styles.countdown}>{remainingLabel}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>독서 시작 시간</Text>
              <Text style={styles.statValue}>{startTimeLabel}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>목표 쪽수</Text>
              <Text style={styles.statValueBold}>{state.plannedPages}쪽</Text>
            </View>
          </View>

          <View style={styles.stopArea}>
            <Text style={styles.stopLabel}>일시 중지</Text>
            <Pressable
              onPress={onStopPress}
              disabled={beginningFinishFlow}
              style={({ pressed }) => [
                styles.stopButton,
                pressed && { opacity: 0.85 },
                beginningFinishFlow && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="독서 세션 일시 중지">
              {beginningFinishFlow ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="pause" size={34} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.mapScroll}
          contentContainerStyle={styles.mapScrollContent}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.mapSectionTitle}>현재 나의 위치</Text>
          {isDemoLocation ? (
            <DemoLocationControls
              currentStep={demoStepIndex}
              totalSteps={demoTotalSteps}
              onAdvance={advanceDemoLocation}
            />
          ) : null}
          <View style={styles.mapCard}>
            <SessionMapView
              mapRegion={mapRegion}
              origin={state.origin}
              destination={state.destination}
              transferMarkers={transferMarkers}
            />
          </View>

          {state.routeSegments.length > 0 ? (
            <RouteProgressCard
              headline={routeProgress.headline}
              barSegments={routeProgress.barSegments}
              arrowPositionPct={routeProgress.arrowPositionPct}
            />
          ) : null}

          <Text style={styles.alertSectionTitle}>이동 알림</Text>
          {state.movementAlerts.length === 0 ? (
            <View style={styles.alertCard}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.SUBTITLE} />
              <Text style={styles.alertEmptyText}>
                환승·도착 지점 근처에 도달하면 이 목록과 휴대폰 알림으로 안내합니다.
                {isDemoLocation ? ' 데모 모드에서는 「다음 지점으로 이동」으로 테스트할 수 있습니다.' : ''}
              </Text>
            </View>
          ) : (
            state.movementAlerts.map((alert, index) => (
              <View
                key={alert.id}
                style={[styles.alertCard, index > 0 && styles.alertCardMuted]}>
                <Ionicons
                  name={
                    alert.kind === 'DESTINATION'
                      ? 'flag'
                      : alert.kind === 'WALK'
                        ? 'walk-outline'
                        : 'train-outline'
                  }
                  size={22}
                  color={index === 0 ? COLORS.PRIMARY : COLORS.SUBTITLE}
                />
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertTitle, index > 0 && styles.alertTitleMuted]}>
                    {alert.body}
                  </Text>
                  <Text style={styles.alertTime}>{relativeTimeLabel(alert.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <ConfirmEndSessionModal
        visible={confirmEndVisible}
        onCancel={() => setConfirmEndVisible(false)}
        onConfirm={onConfirmEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  headerAccent: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  headerSpacer: {
    width: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.TOGGLE_BG,
    borderRadius: 24,
    padding: 4,
    marginTop: 8,
    marginBottom: 20,
  },
  toggleBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.TOGGLE_ACTIVE,
  },
  toggleText: {
    fontSize: 15,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  toggleTextActive: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  timerBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 15,
    color: COLORS.SUBTITLE,
    marginBottom: 8,
    fontFamily: FONTS.REGULAR,
  },
  countdown: {
    fontSize: 56,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    letterSpacing: 1,
    marginBottom: 36,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    marginBottom: 6,
    fontFamily: FONTS.REGULAR,
  },
  statValue: {
    fontSize: 18,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
  },
  statValueBold: {
    fontSize: 20,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  stopArea: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 32,
  },
  stopLabel: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    marginBottom: 12,
    fontFamily: FONTS.REGULAR,
  },
  stopButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapScroll: {
    flex: 1,
  },
  mapScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mapSectionTitle: {
    fontSize: 15,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    marginBottom: 10,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 20,
  },
  alertSectionTitle: {
    fontSize: 15,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    marginBottom: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  alertCardMuted: {
    opacity: 0.72,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    lineHeight: 20,
  },
  alertTitleMuted: {
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  alertTime: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  alertEmptyText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    lineHeight: 20,
  },
});
