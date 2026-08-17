/**
 * 카테고리 섹션 상세 (신작/베스트) — GET /api/books/sections?category=
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
  fetchCategorySectionBooks,
  type CategoryBook,
} from '@/src/api/categoryBooks';
import {
  CATEGORY_API_LABELS,
  resolveCategoryApiKey,
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

export default function CategorySectionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    pickId?: string;
    sectionTitle?: string;
    title?: string;
  }>();

  const apiKey = useMemo(
    () => parseApiKey(params.category ?? params.pickId),
    [params.category, params.pickId],
  );
  const sectionTitle = useMemo(() => {
    const t = Array.isArray(params.sectionTitle) ? params.sectionTitle[0] : params.sectionTitle;
    return t?.trim() ?? '';
  }, [params.sectionTitle]);
  const headerTitle = useMemo(() => {
    if (sectionTitle) return sectionTitle;
    const t = Array.isArray(params.title) ? params.title[0] : params.title;
    if (t?.trim()) return t.trim();
    return apiKey ? CATEGORY_API_LABELS[apiKey] : '카테고리';
  }, [sectionTitle, params.title, apiKey]);

  const [books, setBooks] = useState<CategoryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!apiKey) {
      setError('카테고리 정보가 없습니다.');
      setLoading(false);
      return;
    }
    if (!sectionTitle) {
      setError('섹션 정보가 없습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCategorySectionBooks(apiKey, sectionTitle);
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
  }, [apiKey, sectionTitle]);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Text style={styles.emptyText}>도서가 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
  scrollContent: { paddingHorizontal: GRID_PAD, paddingTop: 16, paddingBottom: 32 },
  grid: { gap: GRID_GAP },
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
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  errorText: {
    fontSize: 14,
    color: '#C0392B',
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
  },
});
