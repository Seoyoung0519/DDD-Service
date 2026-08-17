/**
 * 내 리뷰 — 내 서재에서 진입, GET `/reviews/my`
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { APP_FONTS } from '@/src/theme/fonts';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';

import { deleteMyReview, fetchMyReviews, type ReviewOut } from '@/src/api/reviews';
import type { MyReviewListItem } from '@/src/data/myReviews';

const BOOK_FALLBACK = require('../assets/images/drawer/book1.png');

function reviewOutToCardItem(r: ReviewOut): MyReviewListItem {
  return {
    id: r.id,
    userName: r.userNickname?.trim() || '나',
    userTag: '포스트',
    avatar: r.userAvatarUrl ? { uri: r.userAvatarUrl } : null,
    bookCover: r.bookThumbnailUrl ? { uri: r.bookThumbnailUrl } : BOOK_FALLBACK,
    reviewTitle: r.bookTitle?.trim() || '제목 없음',
    reviewSnippet: r.content,
    bookIdForDetail: r.bookId,
    bookAuthorForDetail: r.bookAuthor?.trim() ?? '',
  };
}

const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_TAB_ICON = require('../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#666666',
  META: '#888888',
  PAGE_BG: '#F5F6F8',
  CARD_BG: '#FFFFFF',
  BORDER: '#EAEAEA',
  BTN_BOOK_TEXT: '#777777',
  DELETE_MODAL_OVERLAY: 'rgba(0, 0, 0, 0.5)',
  DELETE_MODAL_CANCEL_BG: '#D1D5DB',
};

const FONTS = APP_FONTS;

function ReviewCard({
  item,
  onPressBook,
  onPressMore,
}: {
  item: MyReviewListItem;
  onPressBook: () => void;
  onPressMore: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          {item.avatar ? (
            <Image source={item.avatar} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={26} color="#9A9A9A" />
          )}
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={styles.userTag}>{item.userTag}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={onPressMore}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.coverBand}>
        <Image
          source={item.bookCover}
          style={styles.coverBg}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 28 : 18}
        />
        <View style={styles.coverTint} />
        <View style={styles.coverCenterWrap}>
          <Image source={item.bookCover} style={styles.coverBook} resizeMode="cover" />
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.reviewTitle} numberOfLines={2}>
          {item.reviewTitle}
        </Text>
        <Text style={styles.reviewSnippet} numberOfLines={3}>
          {item.reviewSnippet}
        </Text>
      </View>

      <View style={styles.cardDivider} />
      <TouchableOpacity style={styles.bookCta} activeOpacity={0.75} onPress={onPressBook}>
        <Text style={styles.bookCtaText}>책 보기</Text>
      </TouchableOpacity>
    </View>
  );
}

const SCREEN_W = Dimensions.get('window').width;

export default function MyReviewsScreen() {
  const router = useRouter();

  const [reviews, setReviews] = useState<MyReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetchMyReviews({ limit: 20 });
      setReviews(res.items.map(reviewOutToCardItem));
      setHasMore(res.hasMore);
      setNextCursor(res.nextCursor ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '리뷰 목록을 불러오지 못했습니다.';
      setListError(msg);
      setReviews([]);
      setHasMore(false);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadInitial();
    }, [loadInitial]),
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || nextCursor == null || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const res = await fetchMyReviews({ limit: 20, cursor: nextCursor });
      setReviews((prev) => [...prev, ...res.items.map(reviewOutToCardItem)]);
      setHasMore(res.hasMore);
      setNextCursor(res.nextCursor ?? null);
    } catch {
      /* 다음 페이지 실패는 조용히 — 목록은 유지 */
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, loading]);

  const handleViewBook = useCallback(
    (bookId: string, bookTitle?: string, bookAuthor?: string) => {
      router.push({
        pathname: '/BookDetailScreen',
        params: {
          bookId,
          skipRecentBook: 'true',
          bookTitle: bookTitle ?? '',
          bookAuthor: bookAuthor ?? '',
        },
      });
    },
    [router],
  );

  const openDeleteModal = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  const confirmDeleteReview = useCallback(async () => {
    if (!deleteTargetId || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      await deleteMyReview(deleteTargetId);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '리뷰를 삭제하지 못했습니다.';
      Alert.alert('삭제 실패', msg);
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTargetId, deleteSubmitting]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>내 리뷰</Text>
        <View style={styles.topBarRight} />
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortBtn} activeOpacity={0.7}>
          <Ionicons name="swap-vertical" size={16} color={COLORS.SUBTITLE} style={styles.sortIcon} />
          <Text style={styles.sortText}>최근본순</Text>
        </TouchableOpacity>
      </View>

      {loading && reviews.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : listError && reviews.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{listError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadInitial()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, reviews.length === 0 && styles.scrollEmpty]}
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReviewCard
              item={item}
              onPressBook={() =>
                handleViewBook(item.bookIdForDetail, item.reviewTitle, item.bookAuthorForDetail)
              }
              onPressMore={() => openDeleteModal(item.id)}
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
            !loading ? (
              <Text style={styles.emptyListText}>작성한 리뷰가 없습니다.</Text>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={deleteTargetId !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeDeleteModal}>
        <Pressable style={styles.deleteModalOverlay} onPress={closeDeleteModal}>
          <Pressable style={styles.deleteModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.deleteModalBody}>
              <Text style={styles.deleteModalTitle}>리뷰 삭제하기</Text>
              <Text style={styles.deleteModalMessage}>
                정말 과거에 쓰신 리뷰를 삭제하시겠습니까?{'\n'}
                삭제하시면 다시 되돌릴 수 없습니다.
              </Text>
            </View>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalBtnCancel}
                activeOpacity={0.88}
                onPress={closeDeleteModal}>
                <Text style={styles.deleteModalBtnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalBtnDelete, deleteSubmitting && styles.deleteModalBtnDisabled]}
                activeOpacity={0.88}
                onPress={() => void confirmDeleteReview()}
                disabled={deleteSubmitting}>
                {deleteSubmitting ? (
                  <ActivityIndicator size="small" color="#222222" />
                ) : (
                  <Text style={styles.deleteModalBtnDeleteText}>삭제</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    backgroundColor: COLORS.CARD_BG,
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
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: COLORS.PAGE_BG,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 48,
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
  moreBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
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

  bottomNav: {
    flexDirection: 'row',
    minHeight: 100,
    backgroundColor: COLORS.CARD_BG,
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

  /* 리뷰 삭제 확인 모달 */
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.DELETE_MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteModalCard: {
    width: SCREEN_W * 0.85,
    maxWidth: 360,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  deleteModalBody: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.REGULAR,
    color: '#666666',
    textAlign: 'center',
  },
  deleteModalActions: {
    flexDirection: 'row',
    height: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  deleteModalBtnCancel: {
    flex: 1,
    backgroundColor: COLORS.DELETE_MODAL_CANCEL_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalBtnCancelText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: '#222222',
  },
  deleteModalBtnDelete: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
  },
  deleteModalBtnDisabled: {
    opacity: 0.65,
  },
  deleteModalBtnDeleteText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
