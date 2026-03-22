/**
 * 투데이 상단 탭「피드」— GET /feed 타임라인 (내 리뷰 카드와 동일 레이아웃)
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchFeed, type FeedItemOut } from '@/src/api/feed';

const BOOK_FALLBACK = require('../../../assets/images/drawer/book1.png');

/** 모듈 로드 시 RN Dimensions 바인딩 (구버전/HMR에서 `Dimensions` 미정의 ReferenceError 방지) */
const SCREEN_WIDTH = Dimensions.get('window').width;

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#666666',
  META: '#888888',
  PAGE_BG: '#F5F6F8',
  CARD_BG: '#FFFFFF',
  BORDER: '#EAEAEA',
  BTN_BOOK_TEXT: '#777777',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

function FeedCard({
  item,
  onPressBook,
}: {
  item: FeedItemOut;
  onPressBook: () => void;
}) {
  const cover = item.bookThumbnailUrl?.trim()
    ? { uri: item.bookThumbnailUrl }
    : BOOK_FALLBACK;
  const displayName = item.userNickname?.trim() || '독서가';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          {item.userAvatarUrl?.trim() ? (
            <Image source={{ uri: item.userAvatarUrl }} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={26} color="#9A9A9A" />
          )}
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.userTag}>포스트</Text>
        </View>
      </View>

      <View style={styles.coverBand}>
        <Image
          source={cover}
          style={styles.coverBg}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 28 : 18}
        />
        <View style={styles.coverTint} />
        <View style={styles.coverCenterWrap}>
          <Image source={cover} style={styles.coverBook} resizeMode="cover" />
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.reviewTitle} numberOfLines={2}>
          {item.bookTitle?.trim() || '제목 없음'}
        </Text>
        <Text style={styles.reviewSnippet} numberOfLines={3}>
          {item.reviewContent}
        </Text>
      </View>

      <View style={styles.cardDivider} />
      <TouchableOpacity style={styles.bookCta} activeOpacity={0.75} onPress={onPressBook}>
        <Text style={styles.bookCtaText}>책 보기</Text>
      </TouchableOpacity>
    </View>
  );
}

export type FeedTimelineProps = {
  /** 부모에서 `activeTab === '피드'`일 때만 마운트 — 마운트 시 GET /feed 로드 */
  onPressBook: (bookId: string, bookTitle?: string, bookAuthor?: string) => void;
};

export function FeedTimeline({ onPressBook }: FeedTimelineProps) {
  const [items, setItems] = useState<FeedItemOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetchFeed({ limit: 10 });
      setItems(res.items);
      setHasMore(res.hasMore);
      setNextCursor(res.nextCursor ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '피드를 불러오지 못했습니다.';
      setListError(msg);
      setItems([]);
      setHasMore(false);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || nextCursor == null || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const res = await fetchFeed({ limit: 10, cursor: nextCursor });
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
      setNextCursor(res.nextCursor ?? null);
    } catch {
      /* 무시 — 기존 목록 유지 */
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, loading]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (listError && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{listError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void loadInitial()} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.listContent, items.length === 0 && styles.listEmpty]}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FeedCard
          item={item}
          onPressBook={() =>
            onPressBook(
              item.bookId,
              item.bookTitle?.trim() ?? '',
              item.bookAuthor?.trim() ?? '',
            )
          }
        />
      )}
      onEndReached={() => void loadMore()}
      onEndReachedThreshold={0.35}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading ? <Text style={styles.emptyListText}>아직 피드가 없습니다.</Text> : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: COLORS.PAGE_BG,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxWidth: SCREEN_WIDTH,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: COLORS.PAGE_BG,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: FONTS.REGULAR,
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
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },

  card: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECECEC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  userTag: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.META,
  },

  coverBand: {
    height: 148,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#DDD',
  },
  coverBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.25 }],
  },
  coverTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  coverCenterWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBook: {
    width: 92,
    height: 128,
    borderRadius: 6,
    backgroundColor: '#EEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  reviewTitle: {
    fontSize: 15,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 8,
    lineHeight: 21,
  },
  reviewSnippet: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: 0,
  },
  bookCta: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCtaText: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.BTN_BOOK_TEXT,
  },
});
