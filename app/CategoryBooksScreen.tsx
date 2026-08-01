/**
 * 단일 카테고리 도서 — GET /api/books/category?categoryId=
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
  type BrowseGroup,
  type CategoryApiKey,
} from '@/src/constants/categoryBrowse';

const SCREEN_W = Dimensions.get('window').width;
const GRID_COLS = 4;
const GRID_GAP = 12;
const GRID_PAD = 20;
const CELL_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const PREVIEW_BOOK_COUNT = 4;

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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function BookRowPreview({
  books,
  onPressBook,
}: {
  books: CategoryBook[];
  onPressBook: (book: CategoryBook) => void;
}) {
  const preview = books.slice(0, PREVIEW_BOOK_COUNT);

  return (
    <View style={styles.previewRow}>
      {preview.map((book, idx) => {
        const cover = book.coverUrl ? { uri: book.coverUrl } : PLACEHOLDER;
        return (
          <TouchableOpacity
            key={`${book.aladinItemId}-${idx}`}
            style={styles.gridCell}
            activeOpacity={0.85}
            onPress={() => onPressBook(book)}>
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
      {preview.length < PREVIEW_BOOK_COUNT
        ? Array.from({ length: PREVIEW_BOOK_COUNT - preview.length }).map((_, i) => (
            <View key={`pad-${i}`} style={styles.gridCell} />
          ))
        : null}
    </View>
  );
}

function BookGrid({
  books,
  onPressBook,
}: {
  books: CategoryBook[];
  onPressBook: (book: CategoryBook) => void;
}) {
  const rows = useMemo(() => chunk(books, GRID_COLS), [books]);

  return (
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
                onPress={() => onPressBook(book)}>
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
  );
}

const CategoryGroupBlock = React.memo(function CategoryGroupBlock({
  group,
  selectedChip,
  books,
  loading,
  error,
  previewMode,
  onSelectChip,
  onPressBook,
  onPressArrow,
}: {
  group: BrowseGroup;
  selectedChip: BrowseChip;
  books: CategoryBook[];
  loading: boolean;
  error: string | null;
  previewMode: boolean;
  onSelectChip: (groupTitle: string, chip: BrowseChip) => void;
  onPressBook: (book: CategoryBook) => void;
  onPressArrow?: () => void;
}) {
  return (
    <View style={styles.groupBlock}>
      {previewMode ? (
        <TouchableOpacity
          style={styles.groupHeader}
          activeOpacity={0.7}
          onPress={onPressArrow}
          disabled={!onPressArrow}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
      ) : (
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{group.title}</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {group.chips.map((chip) => {
          const active = selectedChip.label === chip.label;
          return (
            <TouchableOpacity
              key={chip.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelectChip(group.title, chip)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={styles.groupLoader} size="small" color="#2C8C55" />
      ) : error ? (
        <Text style={styles.groupError}>{error}</Text>
      ) : books.length === 0 ? (
        <Text style={styles.groupEmpty}>도서가 없습니다.</Text>
      ) : previewMode ? (
        <BookRowPreview books={books} onPressBook={onPressBook} />
      ) : (
        <BookGrid books={books} onPressBook={onPressBook} />
      )}
    </View>
  );
});

export default function CategoryBooksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; pickId?: string; title?: string }>();
  const apiKey = useMemo(
    () => parseApiKey(params.category ?? params.pickId),
    [params.category, params.pickId],
  );
  const displayTitle = useMemo(() => {
    const t = Array.isArray(params.title) ? params.title[0] : params.title;
    if (t?.trim()) return t.trim();
    return apiKey ? CATEGORY_API_LABELS[apiKey] : '카테고리';
  }, [params.title, apiKey]);

  const groups = useMemo(() => (apiKey ? getBrowseGroups(apiKey) : []), [apiKey]);
  const multiSection = groups.length >= 2;

  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, BrowseChip>>({});
  const [booksByGroup, setBooksByGroup] = useState<Record<string, CategoryBook[]>>({});
  const [loadingByGroup, setLoadingByGroup] = useState<Record<string, boolean>>({});
  const [errorByGroup, setErrorByGroup] = useState<Record<string, string | null>>({});

  const loadGroupBooks = useCallback(async (groupTitle: string, chip: BrowseChip) => {
    setLoadingByGroup((prev) => ({ ...prev, [groupTitle]: true }));
    setErrorByGroup((prev) => ({ ...prev, [groupTitle]: null }));
    try {
      const list = await fetchBooksByCategoryId(primaryCategoryId(chip), {
        limit: CATEGORY_BOOKS_MAX_LIMIT,
      });
      setBooksByGroup((prev) => ({ ...prev, [groupTitle]: list }));
    } catch (e: unknown) {
      setBooksByGroup((prev) => ({ ...prev, [groupTitle]: [] }));
      setErrorByGroup((prev) => ({
        ...prev,
        [groupTitle]: e instanceof Error ? e.message : '도서 목록을 불러오지 못했습니다.',
      }));
    } finally {
      setLoadingByGroup((prev) => ({ ...prev, [groupTitle]: false }));
    }
  }, []);

  useEffect(() => {
    const initial: Record<string, BrowseChip> = {};
    const nextBooks: Record<string, CategoryBook[]> = {};
    const nextLoading: Record<string, boolean> = {};
    const nextError: Record<string, string | null> = {};

    for (const g of groups) {
      if (g.chips[0]) {
        initial[g.title] = g.chips[0];
        void loadGroupBooks(g.title, g.chips[0]);
      }
    }

    setSelectedByGroup(initial);
    setBooksByGroup(nextBooks);
    setLoadingByGroup(nextLoading);
    setErrorByGroup(nextError);
  }, [groups, loadGroupBooks]);

  const handleSelectChip = useCallback(
    (groupTitle: string, chip: BrowseChip) => {
      setSelectedByGroup((prev) => {
        if (prev[groupTitle]?.label === chip.label) return prev;
        return { ...prev, [groupTitle]: chip };
      });
      void loadGroupBooks(groupTitle, chip);
    },
    [loadGroupBooks],
  );

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

  const openGroupDetail = (group: BrowseGroup) => {
    if (!apiKey) return;
    router.push({
      pathname: '/CategoryBrowseGroupDetailScreen',
      params: {
        category: apiKey,
        groupTitle: group.title,
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {groups.map((group) => {
          const chip = selectedByGroup[group.title] ?? group.chips[0];
          if (!chip) return null;
          return (
            <CategoryGroupBlock
              key={group.title}
              group={group}
              selectedChip={chip}
              books={booksByGroup[group.title] ?? []}
              loading={loadingByGroup[group.title] ?? false}
              error={errorByGroup[group.title] ?? null}
              previewMode={multiSection}
              onSelectChip={handleSelectChip}
              onPressBook={openDetail}
              onPressArrow={() => openGroupDetail(group)}
            />
          );
        })}
      </ScrollView>
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
  groupBlock: { marginTop: 20 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PAD,
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  previewRow: {
    flexDirection: 'row',
    paddingHorizontal: GRID_PAD,
    gap: GRID_GAP,
  },
  chipRow: { paddingHorizontal: GRID_PAD, gap: 8, paddingBottom: 12 },
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
  groupLoader: { marginVertical: 24 },
  groupError: {
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: GRID_PAD,
    fontSize: 13,
    color: '#C0392B',
    fontFamily: FONTS.REGULAR,
  },
  groupEmpty: {
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
});
