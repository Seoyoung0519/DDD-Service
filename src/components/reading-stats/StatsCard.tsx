/**
 * 대독 통계 — 연한 민트 배경 카드 + 완독 권수·연속 독서 막대
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

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
  return (
    <View style={styles.shrinkWrap}>
      <View
        style={styles.card}
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
    </View>
  );
}

const styles = StyleSheet.create({
  /** 가로 전체 대비 5pt(좌 2.5 + 우 2.5) 축소 */
  shrinkWrap: {
    marginHorizontal: 2.8,
  },
  card: {
    width: '100%',
    aspectRatio: CARD_ASPECT_WIDTH_OVER_HEIGHT,
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
});
