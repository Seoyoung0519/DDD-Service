import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getBookDetail,
  getBookDetailOrNotFound,
  hydrateBookForDetailViaSearch,
  type BookDetailResponse,
} from '../src/api/search';
import { addBookToLibraryWishlist } from '../src/api/library';
import { fetchFeed, type FeedItemOut } from '@/src/api/feed';
import { fetchBookReviews, type ReviewOut } from '@/src/api/reviews';

function reviewOutToFeedLike(r: ReviewOut): FeedItemOut {
  return {
    id: r.id,
    userId: r.userId,
    userNickname: r.userNickname,
    userAvatarUrl: r.userAvatarUrl,
    bookId: r.bookId,
    bookTitle: r.bookTitle,
    bookThumbnailUrl: r.bookThumbnailUrl,
    bookAuthor: r.bookAuthor,
    reviewId: r.id,
    reviewContent: r.content,
    createdAt: r.createdAt,
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BOOK1_COVER = require('../assets/images/drawer/book1.png');

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  PRIMARY_BLUE: '#2C3FE8', // 파란색 스트립용
  TEXT: '#222222',
  SUBTITLE: '#777777',
  BACKGROUND: '#FFFFFF',
  BORDER: '#EEEEEE',
  COVER_BG: '#F4F6FB',
  GRAY: '#999',
  DARK_BUTTON: '#222222',
};

// 폰트 패밀리
const FONTS = {
  REGULAR: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  MEDIUM: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  SEMIBOLD: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  BOLD: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
};

// 도서 상세 타입 정의
interface BookDetail {
  id: string;
  title: string;
  subTitle?: string;
  authors: string[]; // ["히가시노 게이고", "양억관 역"]
  publisher: string;
  publishedDate: string; // "2022.06.16" 형태
  category?: string; // "장르 · 소설" 등
  coverUrl: string; // 큰 표지 이미지 URL
  description: string; // 책소개
  authorDescription?: string; // 저자소개
  publisherReview?: string; // 출판사서평
  aladinLink?: string; // 알라딘 링크
}

type TabKey = 'overview' | 'reviews';

export default function BookDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookId?: string;
    book?: string;
    skipRecentBook?: string;
    /** 내 서재·완독 등에서 상세 보강(검색)용 */
    bookTitle?: string;
    bookAuthor?: string;
  }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [activeNav, setActiveNav] = useState('투데이');
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isAuthorExpanded, setIsAuthorExpanded] = useState(false);
  const [isPublisherExpanded, setIsPublisherExpanded] = useState(false);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  const [bookReviewItems, setBookReviewItems] = useState<FeedItemOut[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const loadBookReviews = useCallback(async () => {
    if (!book?.id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const data = await fetchBookReviews({ bookId: book.id, limit: 30 });
      setBookReviewItems(data.items.map(reviewOutToFeedLike));
    } catch {
      try {
        const feed = await fetchFeed({ bookId: book.id, limit: 50 });
        setBookReviewItems(feed.items.filter((i: FeedItemOut) => i.bookId === book.id));
      } catch (e2) {
        const msg = e2 instanceof Error ? e2.message : '리뷰를 불러오지 못했습니다.';
        setReviewsError(msg);
        setBookReviewItems([]);
      }
    } finally {
      setReviewsLoading(false);
    }
  }, [book?.id]);

  useEffect(() => {
    setBookReviewItems([]);
    setReviewsError(null);
  }, [book?.id]);

  useEffect(() => {
    if (activeTab !== 'reviews' || !book?.id) return;
    void loadBookReviews();
  }, [activeTab, book?.id, loadBookReviews]);

  // skipRecentBook이 true인 경우에도 데이터를 로드해야 하므로 API 호출
  // 서버 측에서 중복 저장을 방지하거나, 이미 저장된 경우 업데이트만 하도록 처리

  // 출판일 포맷팅 함수 (YYYY.MM.DD)
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      // YYYY-MM-DD 형식인 경우
      if (dateString.includes('-')) {
        return dateString.replace(/-/g, '.');
      }
      // YYYYMMDD 형식인 경우
      if (dateString.length === 8 && /^\d+$/.test(dateString)) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${year}.${month}.${day}`;
      }
      // 이미 포맷된 경우 그대로 반환
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  // API 응답을 BookDetail 타입으로 변환
  const transformBookData = (apiData: BookDetailResponse): BookDetail => {
    // categories 배열에서 첫 번째 항목 추출 (예: "국내도서>건강/취미>퍼즐/스도쿠/퀴즈")
    const category = apiData.categories && apiData.categories.length > 0 
      ? apiData.categories[0].split('>').pop() || undefined 
      : undefined;

    return {
      id: apiData.id,
      title: apiData.title,
      subTitle: undefined, // API에 없으면 undefined
      authors: apiData.authors || [],
      publisher: apiData.publisher || '',
      publishedDate: formatDate(apiData.published_date || ''),
      category: category,
      coverUrl: apiData.thumbnail_url || '',
      description: apiData.detail?.description || '',
      authorDescription: apiData.detail?.author_intro || undefined,
      publisherReview: apiData.detail?.publisher_review || undefined,
      aladinLink: apiData.aladin_link || undefined,
    };
  };

  // 도서 데이터 로드 — GET `/api/books/:id` (내 서재 bookId가 UUID일 때 404면 제목으로 검색 보강)
  useEffect(() => {
    const loadBookDetail = async () => {
      const bookId = params.bookId;
      if (!bookId) {
        setLoading(false);
        return;
      }

      const skipRecent = params.skipRecentBook === 'true';
      const titleHint =
        typeof params.bookTitle === 'string' ? params.bookTitle.trim() : '';
      const authorHint =
        typeof params.bookAuthor === 'string' && params.bookAuthor.trim().length > 0
          ? params.bookAuthor.trim()
          : undefined;

      try {
        setLoading(true);
        setError(null);

        const first = await getBookDetailOrNotFound(bookId, skipRecent);
        if (first.ok) {
          setBook(transformBookData(first.data));
          return;
        }

        if (first.status === 404 && titleHint.length > 0) {
          const resolvedId = await hydrateBookForDetailViaSearch(bookId, titleHint, authorHint);
          const response = await getBookDetail(resolvedId, skipRecent);
          setBook(transformBookData(response.data));
          return;
        }

        setBook(null);
        setError('도서 정보를 불러오는데 실패했습니다.');
      } catch (error: unknown) {
        console.error('[BookDetailScreen] 도서 상세 로드 실패:', error);
        setError('도서 정보를 불러오는데 실패했습니다.');
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    loadBookDetail();
  }, [params.bookId, params.skipRecentBook, params.bookTitle, params.bookAuthor]);

  // 뒤로가기 핸들러
  const handlePressBack = () => {
    router.back();
  };

  // 공유 핸들러
  const handlePressShare = () => {
    // TODO: 공유 기능 구현
    console.log('[BookDetail] 공유 버튼 클릭');
  };

  /**
   * 찜한 도서에 담기 — `POST` + `LIBRARY_WISHLIST_ADD_PATH` (기본 `/library/wishlist/items`, 확장 API)
   * 서랍 책장 표지는 `POST /api/reading/bookshelf` + Drawer의 책 추가 플로우 전용.
   */
  const handleAddToWishlist = () => {
    if (!book) return;
    if (isAddingToWishlist) return;
    Alert.alert('찜한 도서에 담기', '이 책을 찜한 도서(내서재) 목록에 추가할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '추가',
        onPress: () => {
          (async () => {
            try {
              setIsAddingToWishlist(true);
              const { alreadyExists } = await addBookToLibraryWishlist(book.id);

              if (alreadyExists) {
                Alert.alert('알림', '이미 찜한 도서에 있는 책입니다.');
                return;
              }

              Alert.alert('완료', '찜한 도서에 담았어요.', [
                {
                  text: '확인',
                  onPress: () => router.push('/my-library'),
                },
              ]);
            } catch (e: unknown) {
              console.error('[BookDetail] 찜하기 실패:', e);
              const message =
                e instanceof Error ? e.message : '찜한 도서에 담는 중 문제가 발생했어요.';
              Alert.alert('오류', message);
            } finally {
              setIsAddingToWishlist(false);
            }
          })();
        },
      },
    ]);
  };

  // 판매처로 바로가기 핸들러
  const handleOpenStore = async () => {
    if (!book) return;
    if (book.aladinLink) {
      // 외부 링크 열기 (Linking API 사용)
      try {
        await Linking.openURL(book.aladinLink);
      } catch (error) {
        console.error('[BookDetail] 링크 열기 실패:', error);
        Alert.alert('오류', '링크를 열 수 없습니다.');
      }
    } else {
      Alert.alert('알림', '판매처 링크가 없습니다.');
    }
  };

  // 더보기 토글 핸들러
  const toggleOverview = () => {
    setIsOverviewExpanded(!isOverviewExpanded);
  };

  const toggleAuthor = () => {
    setIsAuthorExpanded(!isAuthorExpanded);
  };

  const togglePublisher = () => {
    setIsPublisherExpanded(!isPublisherExpanded);
  };

  // 리뷰 카드 (해당 도서 공개 리뷰 — GET /reviews/book/:id, 실패 시 GET /feed?bookId= 필터)
  const ReviewCard = ({ item }: { item: FeedItemOut }) => {
    const displayName = item.userNickname?.trim() || '독서가';
    const coverUri = item.bookThumbnailUrl?.trim() || book?.coverUrl?.trim() || '';

    return (
      <View style={styles.reviewCardContainer}>
        <View style={styles.reviewUserRow}>
          <View style={styles.reviewUserLeft}>
            <View style={styles.reviewProfileImage}>
              {item.userAvatarUrl?.trim() ? (
                <ExpoImage
                  source={{ uri: item.userAvatarUrl }}
                  style={styles.reviewProfileImageInner}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={16} color="#999" />
              )}
            </View>
            <View style={styles.reviewUserInfo}>
              <Text style={styles.reviewNickname} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.reviewRoleLabel}>포스트</Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewBookImageContainer}>
          <View style={styles.reviewBookImageWrapper}>
            {coverUri ? (
              <ExpoImage
                source={{ uri: coverUri }}
                style={styles.reviewBookImage}
                contentFit="contain"
                placeholder={BOOK1_COVER}
              />
            ) : (
              <Image source={BOOK1_COVER} style={styles.reviewBookImage} resizeMode="contain" />
            )}
          </View>
        </View>

        <View style={styles.reviewTextSection}>
          <Text style={styles.reviewTitle} numberOfLines={2}>
            {item.bookTitle?.trim() || book?.title || '리뷰'}
          </Text>
          <Text style={styles.reviewContent}>{item.reviewContent}</Text>
        </View>
      </View>
    );
  };

  const renderReviewsTab = () => {
    if (reviewsLoading && bookReviewItems.length === 0) {
      return (
        <View style={styles.reviewsLoadingWrap}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }
    if (reviewsError) {
      return (
        <View style={styles.reviewsLoadingWrap}>
          <Text style={[styles.blockText, styles.blockTextMuted, { textAlign: 'center' }]}>{reviewsError}</Text>
        </View>
      );
    }
    if (bookReviewItems.length === 0) {
      return (
        <View style={styles.reviewsLoadingWrap}>
          <Text style={[styles.blockText, styles.blockTextMuted]}>아직 등록된 리뷰가 없습니다.</Text>
        </View>
      );
    }
    return (
      <View style={styles.reviewTabContainer}>
        <FlatList
          data={bookReviewItems}
          keyExtractor={(item) => item.reviewId || item.id}
          renderItem={({ item }) => <ReviewCard item={item} />}
          contentContainerStyle={styles.reviewListContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    );
  };


  // 책소개 탭 렌더링
  const renderOverviewTab = () => {
    if (!book) return null;

    const overviewText = book.description?.trim() ?? '';
    const hasOverview = overviewText.length > 0;
    const overviewEmptyMessage = '책 정보를 제공하지 않습니다.';

    return (
      <View style={styles.tabContent}>
        {/* 책소개 블록 */}
        <View style={styles.contentBlock}>
          <Text style={styles.blockTitle}>책소개</Text>
          <Text
            style={[styles.blockText, !hasOverview && styles.blockTextMuted]}
            numberOfLines={!hasOverview ? undefined : isOverviewExpanded ? undefined : 4}
            ellipsizeMode="tail">
            {hasOverview ? overviewText : overviewEmptyMessage}
          </Text>
          {hasOverview && (
            <TouchableOpacity onPress={toggleOverview} style={styles.moreButton}>
              <Text style={styles.moreButtonText}>{isOverviewExpanded ? '접기' : '더보기'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 저자 소개 블록 */}
        {book.authorDescription && (
          <View style={styles.contentBlock}>
            <Text style={styles.blockTitle}>저자 소개</Text>
            <Text
              style={styles.blockText}
              numberOfLines={isAuthorExpanded ? undefined : 4}
              ellipsizeMode="tail">
              {book.authorDescription}
            </Text>
            <TouchableOpacity onPress={toggleAuthor} style={styles.moreButton}>
              <Text style={styles.moreButtonText}>{isAuthorExpanded ? '접기' : '더보기'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 출판사서평 블록 */}
        {book.publisherReview && (
          <View style={styles.contentBlock}>
            <Text style={styles.blockTitle}>출판사서평</Text>
            <Text
              style={styles.blockText}
              numberOfLines={isPublisherExpanded ? undefined : 4}
              ellipsizeMode="tail">
              {book.publisherReview}
            </Text>
            <TouchableOpacity onPress={togglePublisher} style={styles.moreButton}>
              <Text style={styles.moreButtonText}>{isPublisherExpanded ? '접기' : '더보기'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 메인 콘텐츠 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : error || !book ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || '도서 정보를 불러올 수 없습니다.'}</Text>
        </View>
      ) : (
        <>
          {/* 상단 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePressBack} style={styles.headerButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePressShare} style={styles.headerButton} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={24} color={COLORS.TEXT} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* 표지 영역 */}
            <View style={styles.coverSection}>
              <View style={styles.coverContainer}>
                <ExpoImage
                  source={book.coverUrl ? { uri: book.coverUrl } : BOOK1_COVER}
                  style={styles.coverImage}
                  contentFit="contain"
                  placeholder={BOOK1_COVER}
                  cachePolicy="memory-disk"
                  priority="high"
                  transition={200}
                />
              </View>
            </View>

            {/* 파란색 스트립 */}
            <View style={styles.primaryStrip} />

            {/* 제목 카드 */}
            <View style={styles.titleCard}>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </Text>
              {book.subTitle && (
                <Text style={styles.bookSubTitle} numberOfLines={1}>
                  {book.subTitle}
                </Text>
              )}
              <View style={styles.authorRow}>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {book.authors.join(' / ')}
                </Text>
              </View>
              <View style={styles.bookMeta}>
                <Text style={styles.bookMetaText}>
                  {book.category && `${book.category} · `}출간일: {book.publishedDate}
                </Text>
              </View>

              {/* 탭 영역 */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                  onPress={() => setActiveTab('overview')}
                  activeOpacity={0.7}>
                  <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                    책소개
                  </Text>
                  {activeTab === 'overview' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
                  onPress={() => setActiveTab('reviews')}
                  activeOpacity={0.7}>
                  <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                    리뷰{reviewsLoading ? '' : `(${bookReviewItems.length})`}
                  </Text>
                  {activeTab === 'reviews' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              </View>

              {/* 내용 영역 */}
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'reviews' && renderReviewsTab()}
            </View>
        </ScrollView>
        </>
      )}

      {/* 하단 고정 버튼 바 */}
      <View style={styles.bottomButtonBar}>
        <TouchableOpacity
          style={styles.bottomButtonLeft}
          onPress={handleAddToWishlist}
          activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={20} color={COLORS.TEXT} style={styles.buttonIcon} />
          <Text style={styles.bottomButtonLeftText}>찜한 도서에 담기</Text>
        </TouchableOpacity>
        <View style={styles.buttonDivider} />
        <TouchableOpacity
          style={styles.bottomButtonRight}
          onPress={handleOpenStore}
          activeOpacity={0.7}>
          <Ionicons name="link-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.bottomButtonRightText}>판매처로 바로가기</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 네비게이션 바 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('투데이');
            router.push('/Drawer_1');
          }}>
          <Image
            source={TODAY_ICON}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>
            투데이
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('책읽기');
            router.push('/ReadingIntroScreen');
          }}>
          <Image
            source={READING_ICON}
            style={[styles.navIcon, activeNav === '책읽기' && { tintColor: COLORS.PRIMARY }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, activeNav === '책읽기' && styles.navLabelActive]}>
            책읽기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('검색');
            router.push('/SearchScreen_1');
          }}>
          <Image
            source={SEARCH_ICON}
            style={[styles.navIcon, activeNav === '검색' && { tintColor: COLORS.PRIMARY }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, activeNav === '검색' && styles.navLabelActive]}>검색</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('내서재');
            router.push('/my-library');
          }}>
          <Image
            source={LIBRARY_ICON}
            style={[styles.navIcon, activeNav === '내서재' && { tintColor: COLORS.PRIMARY }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, activeNav === '내서재' && styles.navLabelActive]}>
            내서재
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  // 헤더 스타일
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 70 : 30,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 스크롤 뷰
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
    flexGrow: 1,
  },
  // 표지 영역
  coverSection: {
    height: 280,
    backgroundColor: COLORS.COVER_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80, // 헤더 공간 확보
    paddingBottom: 20,
  },
  coverContainer: {
    width: SCREEN_WIDTH * 0.42,
    aspectRatio: 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  // 파란색 스트립
  primaryStrip: {
    width: '100%',
    height: 35,
    backgroundColor: COLORS.PRIMARY_BLUE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 5,
    position: 'relative',
    zIndex: 1,
  },
  // 제목 카드
  titleCard: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    marginTop: -12,
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 18,
    width: SCREEN_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    zIndex: 2,
    flex: 1, // 스크롤 영역 끝까지 확장
  },
  bookTitle: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 0,
    lineHeight: 28,
  },
  bookSubTitle: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginTop: 4,
    marginBottom: 0,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
  },
  bookAuthor: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  bookMeta: {
    marginTop: 4,
  },
  bookMetaText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#999',
  },
  // 탭 바
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabActive: {
    // 활성 탭 스타일
  },
  tabText: {
    fontSize: 15,
    fontFamily: FONTS.REGULAR,
    color: COLORS.GRAY,
    lineHeight: 20,
  },
  tabTextActive: {
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.PRIMARY,
  },
  // 로딩 컨테이너
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  // 에러 컨테이너
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
  },
  // 탭 내용
  tabContent: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 20,
  },
  // 내용 블록
  contentBlock: {
    marginBottom: 24,
  },
  blockTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  blockText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#444444',
    lineHeight: 22,
    marginBottom: 8,
  },
  blockTextMuted: {
    color: '#888888',
  },
  moreButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  moreButtonText: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
  // 리뷰 탭 컨테이너
  reviewTabContainer: {
    paddingTop: 0,
  },
  reviewListContent: {
    paddingBottom: 120, // 하단 버튼 바와 겹치지 않도록
  },
  // 리뷰 카드 컨테이너
  reviewCardContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // 상단 사용자 정보 행
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reviewProfileImageInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewNickname: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: '600',
    color: '#222',
    lineHeight: 20,
  },
  reviewRoleLabel: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#999',
    marginTop: 2,
  },
  reviewsLoadingWrap: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  // 중간 책 이미지 영역
  reviewBookImageContainer: {
    marginTop: 12,
  },
  reviewBookImageWrapper: {
    backgroundColor: '#F4F4F4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBookImage: {
    width: SCREEN_WIDTH * 0.35,
    aspectRatio: 0.7,
    borderRadius: 8,
  },
  // 하단 리뷰 텍스트 섹션
  reviewTextSection: {
    marginTop: 12,
  },
  reviewTitle: {
    fontSize: 15,
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
    lineHeight: 22,
  },
  reviewContent: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#555',
    lineHeight: 20,
  },
  // 하단 버튼 바
  bottomButtonBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  bottomButtonLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  bottomButtonRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_BUTTON,
  },
  buttonDivider: {
    width: 1,
    backgroundColor: COLORS.BORDER,
  },
  buttonIcon: {
    marginRight: 6,
  },
  bottomButtonLeftText: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT,
  },
  bottomButtonRightText: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // 하단 네비게이션 바
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

