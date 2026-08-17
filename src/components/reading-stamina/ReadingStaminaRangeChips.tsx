import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APP_FONTS } from '@/src/theme/fonts';

import {
  PAGE_RANGE_OPTIONS,
  type ReadingStaminaRangeKey,
} from '@/src/components/reading-stamina/types';

const FONTS = APP_FONTS;

type Props = {
  selectedRange: ReadingStaminaRangeKey;
  onSelectRange: (range: ReadingStaminaRangeKey) => void;
  /** 상세 페이지: 선택 칩은 테두리 강조 */
  variant?: 'pill' | 'outline';
};

export function ReadingStaminaRangeChips({
  selectedRange,
  onSelectRange,
  variant = 'pill',
}: Props) {
  const isOutline = variant === 'outline';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}>
      {PAGE_RANGE_OPTIONS.map((range) => {
        const active = selectedRange === range.key;
        return (
          <TouchableOpacity
            key={range.key}
            style={[
              isOutline ? styles.outlineButton : styles.pillButton,
              active && (isOutline ? styles.outlineButtonActive : styles.pillButtonActive),
            ]}
            onPress={() => onSelectRange(range.key)}
            activeOpacity={0.7}>
            <Text
              style={[
                isOutline ? styles.outlineText : styles.pillText,
                active && (isOutline ? styles.outlineTextActive : styles.pillTextActive),
              ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    gap: 10,
    paddingRight: 18,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 28,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillButtonActive: {
    backgroundColor: '#222222',
  },
  pillText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#555555',
  },
  pillTextActive: {
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonActive: {
    borderColor: '#222222',
    borderWidth: 1.5,
  },
  outlineText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#888888',
  },
  outlineTextActive: {
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#222222',
  },
});
