import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type VerticalProgressBarProps = {
  label: string;
  current: number;
  max: number;
  /** 막대 위 수치 표기 — 예: 권, 일 */
  valueSuffix: '권' | '일';
  /** 막대 채움 색 */
  fillColor?: string;
  /** 트랙(빈 영역) 색 */
  trackColor?: string;
};

export function VerticalProgressBar({
  label,
  current,
  max,
  valueSuffix,
  fillColor = '#22C55E',
  trackColor = 'rgba(255,255,255,0.35)',
}: VerticalProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(1, Math.max(0, current / safeMax));

  return (
    <View style={styles.wrap} accessibilityRole="none">
      <Text style={styles.valueText} accessibilityLabel={`${current}${valueSuffix}`}>
        {current}
        {valueSuffix}
      </Text>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            {
              height: Math.max(4, BAR_H * ratio),
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

/** 막대 가로 두께(얇게 조정 시 BAR_W만 변경) — 기존 40pt 대비 8pt 얇게 */
const BAR_W = 34;
/** StatsCard 세로 높이와 맞춤 */
const BAR_H = 104;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  track: {
    width: BAR_W,
    height: BAR_H,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    minHeight: 4,
  },
  /** 6권 · 6일 — 가벼운 두께 */
  valueText: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
  },
  /** 완독 권수 · 연속 독서(일) — 강조 */
  label: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
  },
});
