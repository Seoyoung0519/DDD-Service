/**
 * 진행 중인 도서 — GET /library/in-progress
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
  fetchLibraryInProgressBooks,
  type InProgressBookOut,
} from '@/src/api/library';

const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_TAB_ICON = require('../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#888888',
  META: '#888888',
  PAGE_BG: '#FFFFFF',
  CARD_BG: '#FFFFFF',
  BORDER: '#E8E8E8',
  PROGRESS_TRACK: '#ECECEC',
  /** 진행 막대 채움 — 초록 */
  PROGRESS_FILL: '#2C8C55',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

function formatProgressPct(p: number): string {
  const x = Math.min(100, Math.max(0, p));
  if (Math.abs(x - Math.round(x)) < 1e-6) return `${Math.round(x)}%`;
  return `${x.toFixed(1)}%`;
}

function ProgressBookCard({
  item,
  onPress,
}: {
  item: InProgressBookOut;
  onPress: () => void;
}) {
  const pct = Math.min(100, Math.max(0, item.progressPercent));
  const title = item.bookTitle?.trim() || '제목 없음';
  const author = item.bookAuthor?.trim() || '';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}>
      {item.bookThumbnailUrl ? (
        <Image source={{ uri: item.bookThumbnailUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {author || ' '}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <View style={styles.progressMetaRow}>
          <Text style={styles.pageCount}>
            {item.endPage != null && item.endPage > 0
              ? `${item.currentPage}/${item.endPage} 페이지`
              : `${item.currentPage} 페이지`}
          </Text>
          <Text style={styles.percentText}>{formatProgressPct(item.progressPercent)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BooksInProgressScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InProgressBookOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const list = await fetchLibraryInProgressBooks();
      setItems(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '진행 중인 도서를 불러오지 못했습니다.';
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

  const count = items.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>진행 중인 도서</Text>
        <View style={styles.topBarRight} />
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          현재 진행 중인 도서는 <Text style={styles.summaryHighlight}>{count}권</Text>입니다!
        </Text>
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortBtn} activeOpacity={0.7}>
          <Ionicons name="swap-vertical" size={16} color={COLORS.SUBTITLE} style={styles.sortIcon} />
          <Text style={styles.sortText}>최근본순</Text>
        </TouchableOpacity>
      </View>

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
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>진행 중인 도서가 없습니다.</Text>
            </View>
          ) : (
            items.map((item) => (
              <ProgressBookCard
                key={item.userBookId}
                item={item}
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
                }
              />
            ))
          )}
        </ScrollView>
      )}

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
    backgroundColor: COLORS.PAGE_BG,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 10,
    minHeight: 48,
    backgroundColor: COLORS.PAGE_BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
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

  summaryRow: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
  },
  summaryHighlight: {
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.PRIMARY,
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

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.SUBTITLE,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.BORDER,
    padding: 12,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cover: {
    width: 72,
    height: 104,
    borderRadius: 6,
    backgroundColor: '#EEE',
    marginRight: 14,
  },
  coverPlaceholder: {
    backgroundColor: '#E8E8E8',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
    lineHeight: 22,
  },
  bookAuthor: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.PROGRESS_TRACK,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.PROGRESS_FILL,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageCount: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  percentText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },

  bottomNav: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: COLORS.PAGE_BG,
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
    color: COLORS.META,
  },
  navLabelActive: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },
});
