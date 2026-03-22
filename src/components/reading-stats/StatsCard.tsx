/**
 * 대독 통계 — 연한 민트 배경 카드 + 막대 UI, 탭 시 뒤집혀 요약 문구 표시
 */
import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ReadingStatsData } from './types';
import { VerticalProgressBar } from './VerticalProgressBar';

/** 배경 카드 — PNG 대신 연한 민트 */
const MINT_CARD_BG = '#E8F5EF';
const MINT_CARD_BORDER = 'rgba(22, 163, 74, 0.12)';

export type StatsCardProps = {
  data: ReadingStatsData;
};

/** 카드 전체 비율 (RN aspectRatio = width/height). 값을 키울수록 세로가 짧아짐 */
const CARD_ASPECT_WIDTH_OVER_HEIGHT = 1 / 0.65;

export function StatsCard({ data }: StatsCardProps) {
  const flip = useRef(new Animated.Value(0)).current;
  const flipped = useRef(false);

  const frontRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const handlePress = useCallback(() => {
    const toValue = flipped.current ? 0 : 1;
    flipped.current = !flipped.current;
    Animated.spring(flip, {
      toValue,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [flip]);

  return (
    <View style={styles.shrinkWrap}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="대독 통계 카드"
        accessibilityHint="탭하면 앞면과 뒷면이 전환됩니다">
        <View style={styles.flipContainer}>
          {/* 앞면 */}
          <Animated.View
            style={[
              styles.face,
              styles.faceFront,
              {
                transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
              },
            ]}>
            <View
              style={styles.root}
              accessibilityRole="summary"
              accessibilityLabel="대독 통계 완독 권수와 연속 독서 일수">
              <View style={styles.bgMint} />
              <View style={styles.barsLayer} pointerEvents="box-none">
                <VerticalProgressBar
                  label="완독 권수"
                  current={data.booksRead}
                  max={data.maxBooksRead}
                  valueSuffix="권"
                  fillColor="#16A34A"
                  trackColor="rgba(255,255,255,0.45)"
                />
                <VerticalProgressBar
                  label="연속 독서(일)"
                  current={data.streakDays}
                  max={data.maxStreakDays}
                  valueSuffix="일"
                  fillColor="#16A34A"
                  trackColor="rgba(255,255,255,0.45)"
                />
              </View>
            </View>
          </Animated.View>

          {/* 뒷면 — 앞면과 동일 배경·동일 크기 */}
          <Animated.View
            style={[
              styles.face,
              styles.faceBack,
              {
                transform: [{ perspective: 1000 }, { rotateY: backRotate }],
              },
            ]}>
            <View style={styles.root}>
              <View style={styles.bgMint} />
              <View style={styles.backTextLayer} pointerEvents="none">
                <Text style={styles.backText}>
                  이번 한달 간 연속으로{' '}
                  <Text style={styles.backTextAccent}>
                    {data.streakDays}일
                  </Text>
                  을 대독단과{'\n'}
                  함께 하고{' '}
                  <Text style={styles.backTextAccent}>
                    {data.booksRead}권
                  </Text>
                  을 완독했어요!
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  /** 가로 전체 대비 5pt(좌 2.5 + 우 2.5) 축소 */
  shrinkWrap: {
    marginHorizontal: 2.8,
  },
  flipContainer: {
    width: '100%',
    aspectRatio: CARD_ASPECT_WIDTH_OVER_HEIGHT,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  faceFront: {
    zIndex: 2,
  },
  faceBack: {
    zIndex: 1,
  },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  bgMint: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: MINT_CARD_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MINT_CARD_BORDER,
  },
  barsLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  backTextLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  backText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    ...Platform.select({
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  /** 뒷면 — 일수·권수만 초록 강조 */
  backTextAccent: {
    color: '#16A34A',
    fontWeight: '800',
  },
});
