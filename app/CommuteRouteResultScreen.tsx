/**
 * 길찾기 결과 — POST /api/commute/routes 결과(최적+대안) 중 선택 + 상세 + 읽기 세션 시작
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type CommuteRouteJson, type CommuteRouteSegment } from '@/src/api/readingSession';
import {
  consumeCommuteRouteResult,
  type CommuteRouteResultPayload,
} from '@/src/state/commuteRouteResult';
import { setCommuteReadingRecommend } from '@/src/state/commuteReadingRecommend';
import { extractCommuteEndpointCoordsFromRoute } from '@/src/utils/commuteRouteEndpoints';

/** UI에서 '대안' 문구만 제거 (경로 칩·상세 헤더) */
function stripAltLabel(tag?: string | null): string {
  if (tag == null) return '';
  return String(tag).replace(/대안/g, '').replace(/\s+/g, ' ').trim();
}

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222',
  SUBTITLE: '#7A7A7A',
  BORDER: '#EAEAEA',
  WALK: '#E0E0E0',
  TRANSIT: '#2196F3',
  ORIGIN_DOT: '#2C8C55',
  DEST_DOT: '#E53935',
  BG: '#FFFFFF',
};

const FONTS = {
  BOLD: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

export default function CommuteRouteResultScreen() {
  const router = useRouter();
  const [data, setData] = useState<CommuteRouteResultPayload | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    const p = consumeCommuteRouteResult();
    if (!p) {
      router.back();
      return;
    }
    setData(p);
    setSelectedRouteId(p.selectedRouteId);
  }, [router]);

  const selectedRoute: CommuteRouteJson | null = useMemo(() => {
    if (!data || !selectedRouteId) return null;
    return data.routes.find((r) => r.id === selectedRouteId) ?? data.routes[0] ?? null;
  }, [data, selectedRouteId]);

  const totalMinutes = selectedRoute?.totalMinutes ?? 0;
  const segments: CommuteRouteSegment[] = selectedRoute?.segments ?? [];
  const selectedSummaryTag = useMemo(() => {
    if (!selectedRoute) return '';
    return stripAltLabel(selectedRoute.tag ?? '경로');
  }, [selectedRoute]);

  const onNextToRecommend = () => {
    if (!data?.sessionDraft) {
      Alert.alert('알림', '로그인 정보가 없어 분량 추천을 받을 수 없습니다.');
      return;
    }
    if (data.isFallback) {
      Alert.alert(
        '알림',
        '예시 경로입니다. 통근 경로 조회가 성공한 뒤 다시 시도해 주세요.',
        [{ text: '확인', onPress: () => router.back() }],
      );
      return;
    }
    if (!selectedRouteId || !selectedRoute) return;

    /** 장소 검색 좌표가 없을 때 경로 segments의 정류장 좌표로 보강 (세션 API body용) */
    const fromRoute = extractCommuteEndpointCoordsFromRoute(selectedRoute);

    setCommuteReadingRecommend({
      userId: data.sessionDraft.userId,
      bookId: data.sessionDraft.bookId,
      userBookId: data.sessionDraft.userBookId,
      originPlaceId: data.originPlaceId,
      destinationPlaceId: data.destinationPlaceId,
      selectedRouteId,
      availableMinutes: selectedRoute.totalMinutes,
      originLat: data.originLat ?? fromRoute.originLat ?? undefined,
      originLng: data.originLng ?? fromRoute.originLng ?? undefined,
      destinationLat: data.destinationLat ?? fromRoute.destinationLat ?? undefined,
      destinationLng: data.destinationLng ?? fromRoute.destinationLng ?? undefined,
    });
    /** 책읽기 메인(ReadingSession_1)을 스택 최하단에 두고, 그 위에 분량 추천 모달을 띄움 */
    router.replace({
      pathname: '/ReadingSession_1',
      params: { hidePickModal: '1' },
    });
  };

  const canGoNext =
    Boolean(data?.sessionDraft) && !data?.isFallback && Boolean(selectedRoute);

  if (!data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>불러오는 중…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="뒤로">
          <Ionicons name="chevron-back" size={26} color={COLORS.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>검색 결과</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {data.warningMessage ? (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={20} color="#B45309" />
            <Text style={styles.warningText}>{data.warningMessage}</Text>
          </View>
        ) : null}

        <View style={styles.odCard}>
          <View style={styles.odRow}>
            <View style={[styles.odDot, { backgroundColor: COLORS.ORIGIN_DOT }]} />
            <Text style={styles.odText} numberOfLines={2}>
              {data.departureLabel}
            </Text>
          </View>
          <View style={styles.odDivider} />
          <View style={styles.odRow}>
            <View style={[styles.odDot, { backgroundColor: COLORS.DEST_DOT }]} />
            <Text style={styles.odText} numberOfLines={2}>
              {data.arrivalLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>경로 선택</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.routePickerScroll}
          contentContainerStyle={styles.routePickerContent}>
          {data.routes.map((r) => {
            const active = r.id === selectedRouteId;
            return (
              <Pressable
                key={r.id}
                onPress={() => setSelectedRouteId(r.id)}
                style={[styles.routeChip, active && styles.routeChipActive]}>
                <Text style={[styles.routeChipTag, active && styles.routeChipTagActive]}>
                  {r.tag ?? '경로'}
                </Text>
                <Text style={[styles.routeChipTime, active && styles.routeChipTimeActive]}>
                  {r.totalMinutes}분
                </Text>
                {r.transfers != null ? (
                  <Text style={styles.routeChipSub}>환승 {r.transfers}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>검색 결과</Text>

        {selectedRoute ? (
          <View style={styles.routeCard}>
            <View style={styles.routeSummaryRow}>
              {selectedSummaryTag ? (
                <Text style={styles.routeTag}>{selectedSummaryTag}</Text>
              ) : null}
              <Text style={styles.routeTotalTime}>{totalMinutes}분</Text>
            </View>
            {selectedRoute.fare != null && Number.isFinite(selectedRoute.fare) ? (
              <Text style={styles.fareText}>요금 약 {selectedRoute.fare.toLocaleString()}원</Text>
            ) : null}

            {segments.length > 0 && totalMinutes > 0 && (
              <View style={styles.barBlock}>
                <View style={styles.barRow}>
                  {segments.map((seg, idx) => {
                    const pct = (seg.minutes / totalMinutes) * 100;
                    const isWalk = seg.type === 'WALK';
                    const bg = isWalk ? COLORS.WALK : COLORS.TRANSIT;
                    const iconColor = isWalk ? '#555555' : '#FFFFFF';
                    return (
                      <View
                        key={idx}
                        style={[styles.barSeg, { width: `${pct}%`, backgroundColor: bg }]}>
                        <View style={styles.barSegInner}>
                          {seg.type === 'WALK' ? (
                            <Ionicons name="walk-outline" size={15} color={iconColor} />
                          ) : seg.type === 'SUBWAY' ? (
                            <Ionicons name="train-outline" size={15} color={iconColor} />
                          ) : (
                            <Ionicons name="bus-outline" size={15} color={iconColor} />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <Text style={styles.stepsHeading}>경로</Text>
            {segments.map((seg, idx) => {
              const isLast = idx === segments.length - 1;
              const detail =
                seg.type === 'WALK'
                  ? `도보 ${seg.minutes}분`
                  : seg.type === 'SUBWAY'
                    ? `${seg.line ?? '지하철'} · ${seg.minutes}분`
                    : seg.busNo
                      ? `노선 ${seg.busNo} · ${seg.minutes}분`
                      : `${seg.minutes}분`;

              return (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepIconWrap}>
                      {seg.type === 'WALK' ? (
                        <Ionicons name="walk-outline" size={22} color={COLORS.SUBTITLE} />
                      ) : seg.type === 'SUBWAY' ? (
                        <Ionicons name="train-outline" size={22} color={COLORS.TRANSIT} />
                      ) : (
                        <Ionicons name="bus-outline" size={22} color={COLORS.TRANSIT} />
                      )}
                    </View>
                    {!isLast ? <View style={styles.stepConnector} /> : null}
                  </View>
                  <View style={styles.stepBody}>
                    {seg.type === 'BUS' && (
                      <Text style={styles.busLineBadge}>{seg.line ?? '간선'}</Text>
                    )}
                    <Text style={styles.stepFromTo}>
                      {seg.from} → {seg.to}
                    </Text>
                    <Text style={styles.stepDetail}>{detail}</Text>
                    {isLast && seg.type !== 'WALK' && (
                      <View style={styles.getOffRow}>
                        <View style={styles.getOffDot} />
                        <Text style={styles.getOffText}>하차</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            !canGoNext && styles.primaryBtnDisabled,
            pressed && canGoNext && { opacity: 0.9 },
          ]}
          onPress={onNextToRecommend}
          disabled={!canGoNext}>
          <Text style={styles.primaryBtnText}>다음</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.SUBTITLE,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  headerRight: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    fontFamily: FONTS.REGULAR,
  },
  odCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    backgroundColor: COLORS.BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  odRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
  },
  odDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  odText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  odDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.BORDER,
    marginVertical: 8,
    marginLeft: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 12,
  },
  routePickerScroll: {
    marginBottom: 20,
    maxHeight: 120,
  },
  routePickerContent: {
    gap: 10,
    paddingRight: 8,
  },
  routeChip: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 100,
    backgroundColor: '#FAFAFA',
  },
  routeChipActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#E8F5E9',
  },
  routeChipTag: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.MEDIUM,
  },
  routeChipTagActive: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  routeChipTime: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginTop: 4,
    fontFamily: FONTS.BOLD,
  },
  routeChipTimeActive: {
    color: COLORS.PRIMARY,
  },
  routeChipSub: {
    fontSize: 11,
    color: COLORS.SUBTITLE,
    marginTop: 4,
  },
  routeCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.BORDER,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#FAFAFA',
  },
  routeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  routeTag: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.MEDIUM,
  },
  routeTotalTime: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  fareText: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    marginBottom: 12,
    fontFamily: FONTS.REGULAR,
  },
  barBlock: {
    marginBottom: 18,
  },
  barRow: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    minHeight: 22,
  },
  barSeg: {
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  barSegInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  stepsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 12,
    fontFamily: FONTS.BOLD,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 16,
  },
  /** 아이콘 열 + 본문 높이만큼 늘어나는 세로 연결선(한 줄로 이어지는 느낌) */
  stepRail: {
    width: 32,
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E8E8',
  },
  stepConnector: {
    flex: 1,
    width: 2,
    minHeight: 8,
    marginTop: 4,
    backgroundColor: '#D0D5DD',
    borderRadius: 1,
  },
  stepBody: {
    flex: 1,
  },
  busLineBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TRANSIT,
    marginBottom: 4,
    fontFamily: FONTS.MEDIUM,
  },
  stepFromTo: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
    fontFamily: FONTS.MEDIUM,
  },
  stepDetail: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  getOffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  getOffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.SUBTITLE,
  },
  getOffText: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.MEDIUM,
  },
  primaryBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#BDBDBD',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.BOLD,
  },
});
