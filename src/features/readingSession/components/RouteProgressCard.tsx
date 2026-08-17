import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { APP_FONTS } from '@/src/theme/fonts';

import type {
  RouteProgressHeadline,
  ProgressBarSegment,
} from '@/src/features/readingSession/utils/routeProgressUtils';

const COLORS = {
  TEXT: '#222222',
  SUBTITLE: '#7A7A7A',
  PRIMARY: '#2C8C55',
  ARROW: '#1E88E5',
  WALK: '#E0E0E0',
  TRANSIT: '#2C8C55',
  ARRIVED: '#E53935',
  CARD_BG: '#F7F7F7',
  TRACK: '#E8E8E8',
};

const FONTS = APP_FONTS;

const MIN_ICON_WIDTH_PCT = 14;
const BAR_HEIGHT = 28;
const ARROW_OUTER = 30;
const ARROW_MIDDLE = 22;
const ARROW_INNER = 14;

type Props = {
  headline: RouteProgressHeadline;
  barSegments: ProgressBarSegment[];
  arrowPositionPct: number;
};

function segmentIcon(type: ProgressBarSegment['type'], color: string, size = 14) {
  if (type === 'WALK') return <Ionicons name="walk-outline" size={size} color={color} />;
  if (type === 'SUBWAY') return <Ionicons name="train-outline" size={size} color={color} />;
  return <Ionicons name="bus-outline" size={size} color={color} />;
}

function headlineIcon(headline: RouteProgressHeadline) {
  if (headline.iconType === 'DESTINATION') {
    return <Ionicons name="flag" size={22} color={COLORS.PRIMARY} />;
  }
  return segmentIcon(headline.iconType, COLORS.PRIMARY, 22);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function RouteProgressCard({
  headline,
  barSegments,
  arrowPositionPct,
}: Props) {
  const [barWidth, setBarWidth] = useState(0);
  const clampedPct = clamp(arrowPositionPct, 0, 100);
  const arrowLeft =
    barWidth > 0
      ? clamp((clampedPct / 100) * barWidth - ARROW_OUTER / 2, 0, barWidth - ARROW_OUTER)
      : 0;
  const arrowTop = (BAR_HEIGHT - ARROW_OUTER) / 2;

  return (
    <View style={styles.card}>
      <View style={styles.headlineRow}>
        <View style={styles.headlineIconWrap}>{headlineIcon(headline)}</View>
        <View style={styles.headlineTextWrap}>
          <Text style={styles.headlineTitle}>{headline.title}</Text>
          <Text style={styles.headlineSubtitle}>{headline.subtitle}</Text>
        </View>
        {headline.statusLabel ? (
          <Text style={styles.statusLabel}>{headline.statusLabel}</Text>
        ) : null}
      </View>

      {barSegments.length > 0 ? (
        <View
          style={styles.barOuter}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
          <View style={styles.barRow}>
            {barSegments.map((seg, idx) => {
              const isWalk = seg.type === 'WALK';
              const bg = isWalk ? COLORS.WALK : COLORS.TRANSIT;
              const iconColor = isWalk ? '#555555' : '#FFFFFF';
              const showIcon = seg.widthPct >= MIN_ICON_WIDTH_PCT;
              return (
                <View
                  key={`seg-${idx}`}
                  style={[styles.barSeg, { width: `${seg.widthPct}%`, backgroundColor: bg }]}>
                  {showIcon ? (
                    <View style={styles.barSegInner}>
                      {segmentIcon(seg.type, iconColor)}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {barWidth > 0 ? (
            <View
              style={[styles.arrowWrap, { left: arrowLeft, top: arrowTop }]}
              pointerEvents="none">
              <View style={styles.arrowOuter}>
                <View style={styles.arrowMiddle}>
                  <View style={styles.arrowInner}>
                    <Ionicons name="navigate" size={9} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 14,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headlineIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineTextWrap: {
    flex: 1,
    gap: 2,
  },
  headlineTitle: {
    fontSize: 15,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    lineHeight: 21,
  },
  headlineSubtitle: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    lineHeight: 18,
  },
  statusLabel: {
    fontSize: 13,
    color: COLORS.ARRIVED,
    fontFamily: FONTS.MEDIUM,
  },
  barOuter: {
    height: BAR_HEIGHT,
    position: 'relative',
  },
  barRow: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.TRACK,
  },
  barSeg: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barSegInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowWrap: {
    position: 'absolute',
    width: ARROW_OUTER,
    height: ARROW_OUTER,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 4,
  },
  arrowOuter: {
    width: ARROW_OUTER,
    height: ARROW_OUTER,
    borderRadius: ARROW_OUTER / 2,
    backgroundColor: 'rgba(30, 136, 229, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowMiddle: {
    width: ARROW_MIDDLE,
    height: ARROW_MIDDLE,
    borderRadius: ARROW_MIDDLE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowInner: {
    width: ARROW_INNER,
    height: ARROW_INNER,
    borderRadius: ARROW_INNER / 2,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
