/**
 * 독서체력 — 쪽수별 추천 도서 전체 목록
 */
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadingStaminaRangeChips } from '@/src/components/reading-stamina/ReadingStaminaRangeChips';
import {
  getRangeDescription,
  staminaDetailRouteId,
  type ReadingStaminaRangeKey,
} from '@/src/components/reading-stamina/types';
import { useReadingStaminaBooks, STAMINA_DETAIL_FETCH_LIMIT } from '@/src/components/reading-stamina/useReadingStaminaBooks';

const SCREEN_W = Dimensions.get('window').width;
const GRID_COLS = 4;
const GRID_GAP = 12;
const GRID_PAD = 20;
const CELL_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const PLACEHOLDER_COVER = require('../assets/images/drawer/book.png');

const COLORS = {
  TEXT: '#222222',
  SUBTITLE: '#777777',
  BORDER: '#EAEAEA',
  BACKGROUND: '#FFFFFF',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

function parseInitialRange(raw: string | string[] | undefined): ReadingStaminaRangeKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === '200' || v === '400' || v === '400plus') return v;
  return '100';
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export default function ReadingStaminaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ range?: string }>();
  const initialRange = useMemo(() => parseInitialRange(params.range), [params.range]);
  const { range, setRange, books, loading, error } = useReadingStaminaBooks(initialRange, {
    limit: STAMINA_DETAIL_FETCH_LIMIT,
  });

  const rows = useMemo(() => chunk(books, GRID_COLS), [books]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>독서체력</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>책 쪽수</Text>

        <ReadingStaminaRangeChips
          selectedRange={range}
          onSelectRange={setRange}
          variant="outline"
        />

        <Text style={styles.rangeHint}>{getRangeDescription(range)}</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color="#2C8C55" />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : books.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>해당 쪽수 범위의 책이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.gridRow}>
                {row.map((book) => {
                  const coverSource = book.coverUrl ? { uri: book.coverUrl } : PLACEHOLDER_COVER;
                  return (
                    <TouchableOpacity
                      key={book.id}
                      style={styles.gridCell}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/BookDetailScreen',
                          params: {
                            bookId: staminaDetailRouteId(book),
                            title: book.title,
                            aladinItemId: book.aladinItemId ?? '',
                          },
                        })
                      }>
                      <ExpoImage source={coverSource} style={styles.cover} contentFit="cover" />
                      <Text style={styles.bookTitle} numberOfLines={2} ellipsizeMode="tail">
                        {book.title}
                      </Text>
                      <Text style={styles.bookAuthor} numberOfLines={1} ellipsizeMode="tail">
                        {book.author}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {row.length < GRID_COLS
                  ? Array.from({ length: GRID_COLS - row.length }).map((_, i) => (
                      <View key={`pad-${rowIdx}-${i}`} style={styles.gridCell} />
                    ))
                  : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GRID_PAD,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  rangeHint: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 20,
    marginBottom: 20,
  },
  grid: {
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  gridCell: {
    width: CELL_W,
  },
  cover: {
    width: CELL_W,
    height: CELL_W * 1.45,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    marginBottom: 6,
  },
  bookTitle: {
    fontSize: 12,
    fontFamily: FONTS.BOLD,
    fontWeight: '600',
    color: COLORS.TEXT,
    lineHeight: 16,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 14,
  },
  centerBox: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#C0392B',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
