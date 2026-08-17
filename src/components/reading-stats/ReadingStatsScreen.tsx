import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_FONTS } from '@/src/theme/fonts';

import { StatsCard } from './StatsCard';
import { DEFAULT_READING_STATS, type ReadingStatsData } from './types';

export { DEFAULT_READING_STATS };
export type { ReadingStatsData };

const { width: SCREEN_W } = Dimensions.get('window');

export type ReadingStatsScreenProps = {
  statsData?: ReadingStatsData;
};

export default function ReadingStatsScreen({
  statsData = DEFAULT_READING_STATS,
}: ReadingStatsScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            대독 통계
          </Text>
          <Text style={styles.description}>
            한 달동안 몇권의 책을 완독했는지 연속으로 대독단과 함께{'\n'}
            독서한 최대 일수를 확인해볼 수 있어요
          </Text>
        </View>

        <StatsCard data={statsData} />
      </ScrollView>
    </SafeAreaView>
  );
}

const horizontalPad = Math.max(20, Math.min(24, SCREEN_W * 0.06));

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: horizontalPad,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: APP_FONTS.BOLD,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#9CA3AF',
    fontWeight: '400',
  },
});
