/**
 * 완독 도서 — 4열 그리드, GET /library/completed
 * (내 서재 > 완독 도서 섹션 화살표로 진입)
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  InteractionManager,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';

import {
  fetchLibraryCompletedBooks,
  type CompletedBookOut,
} from '@/src/api/library';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

const SCREEN_W = Dimensions.get('window').width;

const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_TAB_ICON = require('../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  BORDER: '#EAEAEA',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

const GRID_H_PAD = 16;
const COLUMN_GAP = 14;
const ROW_GAP = 16;
const COLS = 4;
const ITEM_W = (SCREEN_W - GRID_H_PAD * 2 - COLUMN_GAP * (COLS - 1)) / COLS;
const COVER_H = Math.round(ITEM_W * 1.42);

function formatCompletedAt(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

export default function CompletedBooksScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CompletedBookOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const list = await fetchLibraryCompletedBooks();
      setItems(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '완독 도서를 불러오지 못했습니다.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        void load();
      });
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>완독 도서</Text>
        <View style={styles.topBarRight} />
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortBtn} activeOpacity={0.7}>
          <Ionicons name="swap-vertical" size={16} color={COLORS.SUBTITLE} style={styles.sortIcon} />
          <Text style={styles.sortText}>최근본순</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading && items.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void load()} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.gridList}>
            <Text style={styles.emptyText}>완독한 도서가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.gridList}>
            {chunk(items, COLS).map((row, ri) => (
              <View key={`row-${ri}`} style={styles.gridRow}>
                {row.map((item) => {
                  const completedDateLabel = formatCompletedAt(item.completedAt);
                  return (
                    <TouchableOpacity
                      key={item.bookId}
                      style={styles.bookCell}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: '/BookDetailScreen',
                          params: {
                            bookId: item.bookId,
                            skipRecentBook: 'true',
                            bookTitle: item.bookTitle ?? '',
                            bookAuthor: item.bookAuthor ?? '',
                          },
                        })
                      }>
                      {item.bookThumbnailUrl ? (
                        <Image
                          source={{ uri: item.bookThumbnailUrl }}
                          style={styles.cover}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.cover, styles.coverPlaceholder]} />
                      )}
                      <Text style={styles.bookTitle} numberOfLines={2}>
                        {item.bookTitle?.trim() || '제목 없음'}
                      </Text>
                      <Text style={styles.bookAuthor} numberOfLines={2}>
                        {item.bookAuthor?.trim() || ' '}
                      </Text>
                      {completedDateLabel ? (
                        <Text style={styles.bookDate} numberOfLines={1}>
                          완독 {completedDateLabel}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AppBottomNavBar>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/Drawer_1')}>
          <Image source={TODAY_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>투데이</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/ReadingIntroScreen')}>
          <Image source={READING_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>책읽기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/SearchScreen_1')}>
          <Image source={SEARCH_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>검색</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/my-library')}>
          <Image
            source={LIBRARY_TAB_ICON}
            style={[styles.navIcon, { tintColor: COLORS.PRIMARY }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>내서재</Text>
        </TouchableOpacity>
      </AppBottomNavBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 10,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  topBarRight: {
    width: 44,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 10,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortIcon: {
    marginRight: 4,
  },
  sortText: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  centered: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: '#FFF',
  },
  gridList: {
    paddingHorizontal: GRID_H_PAD,
  },
  gridRow: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
    marginBottom: ROW_GAP,
    justifyContent: 'flex-start',
  },
  bookCell: {
    width: ITEM_W,
  },
  cover: {
    width: ITEM_W,
    height: COVER_H,
    borderRadius: 6,
    backgroundColor: '#EEE',
    marginBottom: 8,
  },
  coverPlaceholder: {
    backgroundColor: '#D8D8D8',
  },
  bookTitle: {
    fontSize: 13,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    lineHeight: 18,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 15,
  },
  bookDate: {
    fontSize: 10,
    fontFamily: FONTS.REGULAR,
    color: '#A8A8A8',
    marginTop: 2,
    lineHeight: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.SUBTITLE,
    fontSize: 14,
    paddingVertical: 40,
    fontFamily: FONTS.REGULAR,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 50,
    height: 25,
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  navLabelActive: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },
});
