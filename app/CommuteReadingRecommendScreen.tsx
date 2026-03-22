/**
 * 통근 분량 추천 — 모달형 UI, POST /api/reading/recommend/commute 후 읽기 세션 시작
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  recommendCommuteReading,
  startReadingSession,
  type CommuteReadingRecommendation,
} from '@/src/api/readingSession';
import {
  consumeCommuteReadingRecommend,
  type CommuteReadingRecommendPayload,
} from '@/src/state/commuteReadingRecommend';

const { width: SCREEN_W } = Dimensions.get('window');

const COLORS = {
  PRIMARY: '#2C8C55',
  NEXT_GREEN: '#2C8C55',
  TEXT: '#222',
  SUBTITLE: '#7A7A7A',
  BORDER: '#E0E0E0',
  BG: '#FFFFFF',
  /** 책읽기 화면 위 반투명 검정 레이어 */
  DIM_LAYER: 'rgba(0, 0, 0, 0.52)',
  BTN_OUTLINE: '#000000',
  BTN_NEXT_DISABLED_BG: '#E8E8E8',
  BTN_NEXT_DISABLED_BORDER: '#D0D0D0',
  BTN_NEXT_DISABLED_TEXT: '#9E9E9E',
  FOOTER_HINT: '#9E9E9E',
};

const FONTS = {
  BOLD: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

export default function CommuteReadingRecommendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ctx, setCtx] = useState<CommuteReadingRecommendPayload | null>(null);
  const [rec, setRec] = useState<CommuteReadingRecommendation | null>(null);
  const [fetching, setFetching] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const p = consumeCommuteReadingRecommend();
    if (!p) {
      router.back();
      return;
    }
    setCtx(p);
  }, [router]);

  const loadRecommend = useCallback(async (payload: CommuteReadingRecommendPayload) => {
    setFetching(true);
    try {
      const data = await recommendCommuteReading({
        userId: payload.userId,
        bookId: payload.bookId,
        userBookId: payload.userBookId,
        originPlaceId: payload.originPlaceId,
        destinationPlaceId: payload.destinationPlaceId,
        selectedRouteId: payload.selectedRouteId,
        originLat: payload.originLat ?? null,
        originLng: payload.originLng ?? null,
        destinationLat: payload.destinationLat ?? null,
        destinationLng: payload.destinationLng ?? null,
      });
      setRec(data);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e != null && 'message' in e
          ? String((e as { message: unknown }).message)
          : '분량 추천을 불러오지 못했습니다.';
      Alert.alert('분량 추천 실패', msg, [{ text: '확인', onPress: () => router.back() }]);
    } finally {
      setFetching(false);
    }
  }, [router]);

  useEffect(() => {
    if (!ctx) return;
    void loadRecommend(ctx);
  }, [ctx, loadRecommend]);

  const onPrev = () => {
    router.back();
  };

  const onNext = async () => {
    if (!ctx || !rec || fetching || starting) return;
    if (rec.isAlreadyCompleted) {
      Alert.alert('알림', '이미 완독한 책입니다.');
      return;
    }

    try {
      setStarting(true);
      /**
       * place/route id는 `rec.meta`가 아니라 `ctx` 사용.
       * API가 meta에 snake_case만 주면 meta.originPlaceId는 undefined → 세션 body에 null이 들어감.
       */
      await startReadingSession({
        userId: ctx.userId,
        userBookId: rec.userBookId,
        bookId: rec.bookId,
        startPage: rec.startPage,
        endPage: rec.endPage,
        plannedPages: rec.pagesToRead,
        sessionType: 'commute',
        originPlaceId: ctx.originPlaceId,
        destinationPlaceId: ctx.destinationPlaceId,
        selectedRouteId: ctx.selectedRouteId,
        originLat: ctx.originLat ?? null,
        originLng: ctx.originLng ?? null,
        destinationLat: ctx.destinationLat ?? null,
        destinationLng: ctx.destinationLng ?? null,
      });
      Alert.alert('읽기 세션 시작', '독서를 시작해 보세요.', [
        { text: '확인', onPress: () => router.replace('/Drawer_1') },
      ]);
    } catch (e: unknown) {
      Alert.alert(
        '세션 시작 실패',
        typeof e === 'object' && e != null && 'message' in e
          ? String((e as { message: unknown }).message)
          : '읽기 세션을 시작하지 못했습니다.',
      );
    } finally {
      setStarting(false);
    }
  };

  const canNext =
    Boolean(ctx && rec && !fetching && !starting && !rec.isAlreadyCompleted);

  const authorsLine =
    rec && Array.isArray(rec.authors) ? rec.authors.join(', ') : '';

  const travelMinutes = rec?.availableMinutes ?? ctx?.availableMinutes ?? 0;
  const titleText = fetching
    ? '추천할 책 쪽수를 산정중입니다...'
    : '추천할 책 쪽수를 확인해 주세요';

  if (!ctx) {
    return (
      <View style={styles.rootTransparent}>
        <View
          style={[
            styles.dimLayer,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}>
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rootTransparent}>
      <View
        style={[
          styles.dimLayer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}>
        <View style={styles.centerWrap}>
        <View style={[styles.modalCard, { maxWidth: Math.min(SCREEN_W - 40, 400) }]}>
          {/* 상단: 이전 / 시작하기 */}
          <View style={styles.topBtnRow}>
            <View style={styles.topBtnSpacer} />
            <View style={styles.topBtnGroup}>
              <Pressable
                onPress={onPrev}
                style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="이전">
                <Text style={styles.btnOutlineText}>이전</Text>
              </Pressable>
              <Pressable
                onPress={onNext}
                disabled={!canNext}
                style={({ pressed }) => [
                  styles.btnNext,
                  canNext ? styles.btnNextFilled : styles.btnNextDisabled,
                  canNext && pressed && { opacity: 0.88 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="시작하기">
                {starting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={canNext ? styles.btnNextFilledText : styles.btnNextTextDisabled}>
                    시작하기
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          <Text style={styles.modalTitle}>{titleText}</Text>

          {/* 2열: 읽을 책 | 이동·추천 */}
          <View style={styles.twoCol}>
            <View style={styles.colLeft}>
              <Text style={styles.colLabel}>읽을 책</Text>
              {fetching ? (
                <View style={styles.coverLoading}>
                  <ActivityIndicator size="small" color={COLORS.SUBTITLE} />
                </View>
              ) : rec?.coverUrl ? (
                <Image
                  source={{ uri: rec.coverUrl }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                  <Ionicons name="book-outline" size={36} color={COLORS.SUBTITLE} />
                </View>
              )}
              {!fetching && rec ? (
                <>
                  <Text style={styles.bookTitle} numberOfLines={3}>
                    {rec.title}
                  </Text>
                  {authorsLine ? (
                    <Text style={styles.bookAuthor} numberOfLines={2}>
                      {authorsLine}
                    </Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.bookTitleMuted} numberOfLines={2}>
                    불러오는 중…
                  </Text>
                </>
              )}
            </View>

            <View style={styles.colDivider} />

            <View style={styles.colRight}>
              <View style={styles.colRightTravelBlock}>
                <Text style={styles.colLabelCenter}>이동 시간</Text>
                <Text style={styles.travelMinutes}>{travelMinutes}분</Text>
              </View>
              <View style={styles.colRightRecommendBlock}>
                <Text style={styles.colLabelCenter}>추천 쪽수</Text>
                {fetching ? (
                  <Text style={styles.pagesPlaceholder}>---</Text>
                ) : rec ? (
                  <Text style={styles.pagesValue}>{rec.pagesToRead}쪽</Text>
                ) : (
                  <Text style={styles.pagesPlaceholder}>---</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.footerDivider} />
          <Text style={styles.footerHint}>
            이동시간과 독서 속도, 책 장르를 고려하여 주어진 시간동안 완독 가능한 쪽수를 추천합니다
          </Text>

          {!fetching && rec?.isAlreadyCompleted ? (
            <View style={styles.warnRow}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#92400E"
                style={styles.warnIcon}
              />
              <Text style={styles.warnText}>이미 완독 처리된 책입니다.</Text>
            </View>
          ) : null}
        </View>
        </View>
      </View>
    </View>
  );
}

const COVER_W = 100;
const COVER_H = 144;

const styles = StyleSheet.create({
  rootTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dimLayer: {
    flex: 1,
    backgroundColor: COLORS.DIM_LAYER,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.BG,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  topBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  topBtnSpacer: {
    flex: 1,
  },
  topBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: COLORS.BTN_OUTLINE,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  btnNext: {
    marginLeft: 10,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 시작하기 — 초록 배경 */
  btnNextFilled: {
    backgroundColor: COLORS.NEXT_GREEN,
    borderWidth: 1,
    borderColor: COLORS.NEXT_GREEN,
  },
  btnNextFilledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.MEDIUM,
  },
  btnNextDisabled: {
    backgroundColor: COLORS.BTN_NEXT_DISABLED_BG,
    borderWidth: 1,
    borderColor: COLORS.BTN_NEXT_DISABLED_BORDER,
  },
  btnNextTextDisabled: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.BTN_NEXT_DISABLED_TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    fontFamily: FONTS.BOLD,
    lineHeight: 24,
  },
  twoCol: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: COVER_H + 80,
  },
  colLeft: {
    flex: 1,
    paddingRight: 4,
  },
  colRight: {
    flex: 1,
    paddingLeft: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  /** 이동 시간(라벨+값) — 아래로 살짝 내림 */
  colRightTravelBlock: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 28,
  },
  /** 추천 쪽수(라벨+값) — 위 블록과 간격 */
  colRightRecommendBlock: {
    width: '100%',
    alignItems: 'center',
    marginTop: 38,
    paddingTop: 12,
  },
  colLabelCenter: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.MEDIUM,
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  colDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: 10,
    alignSelf: 'stretch',
  },
  colLabel: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.MEDIUM,
    marginBottom: 8,
  },
  cover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 6,
    backgroundColor: '#EEE',
    marginBottom: 10,
  },
  coverLoading: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    lineHeight: 20,
  },
  bookTitleMuted: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    marginTop: 4,
    fontFamily: FONTS.REGULAR,
  },
  travelMinutes: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
  },
  pagesPlaceholder: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.BOLD,
    letterSpacing: 1,
    textAlign: 'center',
  },
  pagesValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.BORDER,
    marginTop: 20,
    marginBottom: 12,
  },
  footerHint: {
    fontSize: 11,
    color: COLORS.FOOTER_HINT,
    lineHeight: 16,
    fontFamily: FONTS.REGULAR,
  },
  warnIcon: {
    marginRight: 8,
  },
  warnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  warnText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontFamily: FONTS.REGULAR,
  },
});
