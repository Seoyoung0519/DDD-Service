/**
 * 카테고리 전체 보기 — 섹션(그룹) 상세 (칩 + 4열 그리드)
 */
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { APP_FONTS } from '@/src/theme/fonts';

import {
  categoryBookDetailRouteId,
  CATEGORY_BOOKS_MAX_LIMIT,
  fetchBooksByCategoryId,
  type CategoryBook,
} from '@/src/api/categoryBooks';
import {
  CATEGORY_API_LABELS,
  getBrowseGroups,
  primaryCategoryId,
  resolveCategoryApiKey,
  type BrowseChip,
  type CategoryApiKey,
} from '@/src/constants/categoryBrowse';

const SCREEN_W = Dimensions.get('window').width;
const GRID_COLS = 4;
const GRID_GAP = 12;
const GRID_PAD = 20;
const CELL_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const PLACEHOLDER = require('../assets/images/drawer/book.png');

const COLORS = {
  TEXT: '#222222',
  SUBTITLE: '#777777',
  BORDER: '#EAEAEA',
  BG: '#FFFFFF',
};

const FONTS = APP_FONTS;

function parseApiKey(raw: string | string[] | undefined): CategoryApiKey | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return resolveCategoryApiKey(v) ?? (v in CATEGORY_API_LABELS ? (v as CategoryApiKey) : null);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export default function CategoryBrowseGroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; groupTitle?: string }>();

  const apiKey = useMemo(() => parseApiKey(params.category), [params.category]);
  const groupTitle = useMemo(() => {
    const t = Array.isArray(params.groupTitle) ? params.groupTitle[0] : params.groupTitle;
    return t?.trim() ?? '';
  }, [params.groupTitle]);

  const group = useMemo(() => {
    if (!apiKey || !groupTitle) return null;
    return getBrowseGroups(apiKey).find((g) => g.title === groupTitle) ?? null;
  }, [apiKey, groupTitle]);

  const [selectedChip, setSelectedChip] = useState<BrowseChip | null>(null);
  const [books, setBooks] = useState<CategoryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (group?.chips[0]) {
      setSelectedChip(group.chips[0]);
    } else {
      setSelectedChip(null);
    }
  }, [group]);

  const loadBooks = useCallback(async (chip: BrowseChip) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchBooksByCategoryId(primaryCategoryId(chip), {
        limit: CATEGORY_BOOKS_MAX_LIMIT,
      });
      setBooks(list);
      if (list.length === 0) {
        setError('도서가 없습니다.');
      }
    } catch (e: unknown) {
      setBooks([]);
      setError(e instanceof Error ? e.message : '도서 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChip) {
      void loadBooks(selectedChip);
    }
  }, [selectedChip, loadBooks]);

  const rows = useMemo(() => chunk(books, GRID_COLS), [books]);

  const openDetail = (book: CategoryBook) => {
    router.push({
      pathname: '/BookDetailScreen',
      params: {
        bookId: categoryBookDetailRouteId(book),
        title: book.title,
        aladinItemId: book.aladinItemId,
      },
    });
  };

  const headerTitle = groupTitle || '카테고리';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {headerTitle}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {!group ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>섹션 정보가 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {group.chips.map((chip) => {
              const active = selectedChip?.label === chip.label;
              return (
                <TouchableOpacity
                  key={chip.label}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    if (selectedChip?.label !== chip.label) {
                      setSelectedChip(chip);
                    }
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loading ? (
            <ActivityIndicator style={styles.loader} size="small" color="#2C8C55" />
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {rows.map((row, rowIdx) => (
                <View key={`row-${rowIdx}`} style={styles.gridRow}>
                  {row.map((book, colIdx) => {
                    const cover = book.coverUrl ? { uri: book.coverUrl } : PLACEHOLDER;
                    return (
                      <TouchableOpacity
                        key={`${book.aladinItemId}-${rowIdx}-${colIdx}`}
                        style={styles.gridCell}
                        activeOpacity={0.85}
                        onPress={() => openDetail(book)}>
                        <ExpoImage source={cover} style={styles.cover} contentFit="cover" />
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  headerRight: { width: 24 },
  scrollContent: { paddingBottom: 32 },
  chipRow: { paddingHorizontal: GRID_PAD, gap: 8, paddingTop: 16, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#222222', borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: FONTS.REGULAR, color: '#888888' },
  chipTextActive: { fontFamily: FONTS.BOLD, fontWeight: '700', color: '#222222' },
  grid: { paddingHorizontal: GRID_PAD, gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  gridCell: { width: CELL_W },
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
  },
  bookAuthor: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginTop: 2,
  },
  loader: { marginVertical: 24 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: {
    fontSize: 14,
    color: '#C0392B',
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
  },
});
