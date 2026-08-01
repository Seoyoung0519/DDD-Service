/**
 * 카테고리 섹션 (신작/베스트) — GET /api/books/sections
 */
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  categoryBookDetailRouteId,
  fetchCategorySections,
  type CategoryBook,
  type CategorySection,
} from '@/src/api/categoryBooks';
import {
  CATEGORY_API_LABELS,
  type CategoryApiKey,
  resolveCategoryApiKey,
} from '@/src/constants/categoryBrowse';

const BOOK_W = 100;
const BOOK_H = 150;
const PLACEHOLDER = require('../assets/images/drawer/book.png');

const COLORS = {
  TEXT: '#222222',
  SUBTITLE: '#777777',
  BORDER: '#EAEAEA',
  BG: '#FFFFFF',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

function parseApiKey(raw: string | string[] | undefined): CategoryApiKey | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return resolveCategoryApiKey(v) ?? (v in CATEGORY_API_LABELS ? (v as CategoryApiKey) : null);
}

function BookCard({ book, onPress }: { book: CategoryBook; onPress: () => void }) {
  const cover = book.coverUrl ? { uri: book.coverUrl } : PLACEHOLDER;
  return (
    <TouchableOpacity style={styles.bookCard} activeOpacity={0.85} onPress={onPress}>
      <ExpoImage source={cover} style={styles.bookCover} contentFit="cover" />
      <Text style={styles.bookTitle} numberOfLines={2} ellipsizeMode="tail">
        {book.title}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1} ellipsizeMode="tail">
        {book.author}
      </Text>
    </TouchableOpacity>
  );
}

export default function CategorySectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pickId?: string; category?: string; title?: string }>();
  const apiKey = useMemo(
    () => parseApiKey(params.category ?? params.pickId),
    [params.category, params.pickId],
  );
  const displayTitle = useMemo(() => {
    const t = Array.isArray(params.title) ? params.title[0] : params.title;
    if (t?.trim()) return t.trim();
    return apiKey ? CATEGORY_API_LABELS[apiKey] : '카테고리';
  }, [params.title, apiKey]);

  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!apiKey) {
      setError('카테고리 정보가 없습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategorySections(apiKey);
      setSections(data.sections);
    } catch (e: unknown) {
      setSections([]);
      setError(e instanceof Error ? e.message : '카테고리 섹션을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const openBrowseAll = () => {
    if (!apiKey) return;
    router.push(
      `/CategoryBooksScreen?category=${apiKey}&title=${encodeURIComponent(displayTitle)}` as Href,
    );
  };

  const openSectionDetail = (section: CategorySection) => {
    if (!apiKey) return;
    router.push({
      pathname: '/CategorySectionDetailScreen',
      params: {
        category: apiKey,
        sectionTitle: section.title,
        title: displayTitle,
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
          {displayTitle}
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
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.7} onPress={openBrowseAll}>
            <Text style={styles.viewAllText}>{displayTitle} 전체 보기</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.SUBTITLE} />
          </TouchableOpacity>

          {sections.length === 0 ? (
            <Text style={styles.emptyText}>추천 도서가 없습니다.</Text>
          ) : (
            sections.map((section) => (
              <View key={section.title} style={styles.sectionBlock}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                  onPress={() => openSectionDetail(section)}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.SUBTITLE} />
                </TouchableOpacity>
                <FlatList
                  data={section.books}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, idx) => `${item.aladinItemId}-${idx}`}
                  contentContainerStyle={styles.bookRow}
                  renderItem={({ item }) => (
                    <BookCard book={item} onPress={() => openDetail(item)} />
                  )}
                />
              </View>
            ))
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
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
  },
  viewAllText: {
    fontSize: 15,
    fontFamily: FONTS.BOLD,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  sectionBlock: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  bookRow: { paddingHorizontal: 20, gap: 12 },
  bookCard: { width: BOOK_W },
  bookCover: {
    width: BOOK_W,
    height: BOOK_H,
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
    textAlign: 'center',
    marginTop: 40,
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
