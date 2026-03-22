import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBookshelfList, type BookshelfItem } from '../src/api/bookshelf';
import AddToShelfModal from './AddToShelfModal';
import {
  fetchKeyrings,
  generateKeyring,
  KeyringGenerateNotFoundError,
  KeyringInvalidTokenError,
  type Keyring,
} from '@/src/services/keyring/keyringService';
import { FeedTimeline } from '@/src/components/feed/FeedTimeline';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 이미지 경로 (app 바로 아래에 있으므로 한 단계만 올라감)
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON = require('../assets/images/drawer/bell.png');
const KEYRING_IMAGE = require('../assets/images/drawer/빈키링.png');
const BOOK1_COVER = require('../assets/images/drawer/book1.png');
const BOOK2_COVER = require('../assets/images/drawer/book2.png');
const BOOKSHELF_IMAGE = require('../assets/images/drawer/bookshelf.png');
const ADD_BOOK_ICON = require('../assets/images/drawer/addbook.png');

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  SECTION_BG: '#F5F1E8',
  BORDER: '#EAEAEA',
  GRAY: '#999',
  PROGRESS_BG: '#E5E5E5',
};

// 폰트 패밀리 (Pretendard 대신 시스템 폰트 사용)
const FONTS = {
  REGULAR: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  MEDIUM: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'sans-serif',
  }),
  SEMIBOLD: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'sans-serif',
  }),
  BOLD: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'sans-serif',
  }),
};

// 책 데이터 타입
interface Book {
  id: string;
  cover: any;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  progress: number;
}

// 샘플 책 데이터
const sampleBooks: Book[] = [
  {
    id: '1',
    cover: BOOK2_COVER,
    title: '용의자X의헌신',
    author: '히가시노 게이고...',
    currentPage: 240,
    totalPages: 459,
    progress: 0.45,
  },
  {
    id: '2',
    cover: BOOK1_COVER,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로..',
    currentPage: 31,
    totalPages: 320,
    progress: 0.1,
  },
];

// 책장 이미지 배열
const bookshelfImages = [
  BOOKSHELF_IMAGE,
  BOOKSHELF_IMAGE,
  BOOKSHELF_IMAGE,
];

export default function HomeShelf() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('서랍장');
  const [activeNav, setActiveNav] = useState('투데이');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [bookshelfItems, setBookshelfItems] = useState<BookshelfItem[]>([]);
  const [readingBooks, setReadingBooks] = useState<BookshelfItem[]>([]);
  const [completedBooks, setCompletedBooks] = useState<BookshelfItem[]>([]);
  const [currentShelfIndex, setCurrentShelfIndex] = useState(0);
  const [latestKeyring, setLatestKeyring] = useState<Keyring | null>(null);
  const [isGeneratingKeyring, setIsGeneratingKeyring] = useState(false);


  // 책장 목록 불러오기
  const loadBookshelf = async () => {
    try {
      const res = await getBookshelfList();
      // API 응답 구조: { reading: [], planned: [], completed: [], dropped: [] }
      const plannedBooks = res.data?.planned || [];
      const readingBooksData = res.data?.reading || [];
      const completedBooksData = res.data?.completed || [];
      
      setBookshelfItems(plannedBooks);
      setReadingBooks(readingBooksData);
      setCompletedBooks(completedBooksData);
    } catch (err) {
      console.error('[Drawer_1] 책장 목록 불러오기 실패:', err);
      setBookshelfItems([]);
      setReadingBooks([]);
      setCompletedBooks([]);
    }
  };

  /** GET /keyrings — 목록의 image_path(→ imageUrl)로 미리보기. 생성 직후엔 preferKeyringId 로 맞춤 */
  const loadKeyrings = async (options?: { preferKeyringId?: string }) => {
    try {
      const keyrings = await fetchKeyrings();
      if (keyrings && keyrings.length > 0) {
        const preferred = options?.preferKeyringId
          ? keyrings.find((k) => k.keyringId === options.preferKeyringId) ?? keyrings[0]
          : keyrings[0];
        setLatestKeyring(preferred);
      } else {
        setLatestKeyring(null);
      }
    } catch (err) {
      if (err instanceof KeyringInvalidTokenError) {
        if (__DEV__) {
          console.warn(
            '[Drawer_1] 키링 API가 JWT를 거부했습니다. 로그인 서버와 키링 호스트의 토큰 검증 설정을 맞추거나, 다시 로그인해 보세요.',
          );
        }
      } else {
        console.error('[Drawer_1] 키링 목록 불러오기 실패:', err);
      }
      setLatestKeyring(null);
    }
  };

  const handleGenerateKeyring = async () => {
    if (!completedBooks || completedBooks.length === 0) {
      Alert.alert('키링 생성', '완독한 책이 없습니다. 먼저 책을 완독해 주세요.');
      return;
    }

    if (isGeneratingKeyring) {
      return;
    }

    // 가장 최근에 완독한 책을 기준으로 키링 생성
    const sorted = [...completedBooks].sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

    const target = sorted[0];
    if (!target.bookId?.trim()) {
      Alert.alert('키링 생성', '완독한 책의 bookId가 없어 키링을 만들 수 없습니다.');
      return;
    }

    try {
      setIsGeneratingKeyring(true);
      // 1) 완독 책 기반 생성 (POST /badges/keyring — 본문 키는 book_id 또는 bookId, src/config/api.ts 참고)
      const result = await generateKeyring({ bookId: target.bookId });
      // 2) 화면 이미지는 GET /keyrings 목록의 image_path 기준으로 갱신
      await loadKeyrings({ preferKeyringId: result.keyringId });
      Alert.alert('키링 생성 완료', '가장 최근에 완독한 책으로 키링을 생성했어요.');
    } catch (err: any) {
      if (err instanceof KeyringInvalidTokenError) {
        if (__DEV__) {
          console.warn('[Drawer_1] 키링 생성: Invalid token (서버 JWT 설정 확인)');
        }
        Alert.alert(
          '키링을 불러올 수 없어요',
          '로그인이 만료되었거나 키링 서버와 연동 설정이 맞지 않을 수 있어요. 다시 로그인한 뒤 시도해 주세요.',
        );
      } else if (err instanceof KeyringGenerateNotFoundError) {
        if (__DEV__) {
          console.warn('[Drawer_1] 키링 생성 404 — POST /badges/keyring 없음. 호스트:', err.baseUrl);
        }
        Alert.alert(
          '키링 생성 API를 찾을 수 없어요',
          '백엔드에 POST /badges/keyring 가 배포되어 있지 않거나, 키링 서버 주소(EXPO_PUBLIC_KEYRING_API_BASE_URL)가 다를 수 있어요.\n\n목록 조회(GET /keyrings)만 되는 환경이면 생성은 서버 배포 후 이용할 수 있어요.',
        );
      } else {
        console.error('[Drawer_1] 키링 생성 실패:', err);
        Alert.alert('키링 생성 실패', err?.message || '키링을 생성하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGeneratingKeyring(false);
    }
  };

  // 페이지에 포커스될 때마다 책장·키링 (전환 애니메이션 후 로드로 체감 지연 완화)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        loadBookshelf();
        loadKeyrings();
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // 책 추가 성공 시 책장 상태 갱신
  const handleAddedBook = (item: BookshelfItem) => {
    console.log('[Drawer_1] 책 추가됨:', {
      title: item.title,
      coverUrl: item.coverUrl,
      hasCoverUrl: !!item.coverUrl,
    });
    // 즉시 로컬 상태 업데이트
    setBookshelfItems((prev) => {
      if (!prev || !Array.isArray(prev)) {
        return [item];
      }
      const exists = prev.some((b) => b.bookId === item.bookId);
      if (exists) return prev;
      return [...prev, item];
    });
    // 서버 반영을 위해 약간의 딜레이 후 목록 다시 불러오기
    setTimeout(() => {
      loadBookshelf();
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ExpoImage source={BUS_LOGO} style={styles.logoIcon} contentFit="contain" />
          <Text style={styles.logoText}>대독단</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <ExpoImage source={BELL_ICON} style={styles.bellIcon} contentFit="contain" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>0</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="menu" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 상단 탭 영역 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === '서랍장' && styles.tabActive]}
          onPress={() => setActiveTab('서랍장')}>
          <Text
            style={[
              styles.tabText,
              activeTab === '서랍장' ? styles.tabTextActive : styles.tabTextInactive,
            ]}>
            서랍장
          </Text>
          {activeTab === '서랍장' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === '대독PICK' && styles.tabActive]}
          onPress={() => router.push('/DaedokPick')}>
          <Text
            style={[
              styles.tabText,
              activeTab === '대독PICK' ? styles.tabTextActive : styles.tabTextInactive,
            ]}>
            대독PICK
          </Text>
          {activeTab === '대독PICK' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === '피드' && styles.tabActive]}
          onPress={() => setActiveTab('피드')}>
          <Text
            style={[
              styles.tabText,
              activeTab === '피드' ? styles.tabTextActive : styles.tabTextInactive,
            ]}>
            피드
          </Text>
          {activeTab === '피드' && <View style={[styles.tabIndicator, styles.tabIndicatorFeed]} />}
        </TouchableOpacity>
      </View>

      {/* 메인 콘텐츠: 피드 탭이면 GET /feed 타임라인만 (투데이) */}
      {activeTab === '피드' ? (
        <FeedTimeline
          onPressBook={(bookId, bookTitle, bookAuthor) => {
            router.push({
              pathname: '/BookDetailScreen',
              params: {
                bookId,
                skipRecentBook: 'true',
                bookTitle: bookTitle ?? '',
                bookAuthor: bookAuthor ?? '',
              },
            });
          }}
        />
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 슬라이딩 섹션: 책최몇? / 책 선반 */}
        <View style={styles.slidingSectionContainer}>
          <FlatList
            ref={flatListRef}
            data={[0, 1]} // 두 개의 페이지
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.toString()}
            onMomentumScrollEnd={(event) => {
              const pageIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentPageIndex(pageIndex);
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH }}>
                {item === 0 ? (
                  // 첫 번째 페이지: 책최몇?
                  <View style={styles.keyringSection}>
                    <Text style={styles.keyringTitle}>책최몇? 너 책키링 최대 몇 개야?</Text>
                    <Text style={styles.keyringSubtitle}>
                      당신이 책 보석함에 등록한 책들 중 완독한 책이 키링으로 기록됩니다. 책 장르별로 참
                      장식이 달라지니 모으는 재미가 있을 거예요!
                    </Text>
                    <View style={styles.keyringImageContainer}>
                      <ExpoImage
                        source={
                          latestKeyring?.imageUrl
                            ? { uri: latestKeyring.imageUrl }
                            : KEYRING_IMAGE
                        }
                        style={styles.keyringImage}
                        contentFit="contain"
                      />
                      {!latestKeyring?.imageUrl && (
                        <Text style={styles.keyringEmptyText}>아직 완독한 책이 없어요!</Text>
                      )}
                      <View style={styles.keyringActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={handleGenerateKeyring}
                          disabled={isGeneratingKeyring}
                        >
                          <Ionicons
                            name={isGeneratingKeyring ? 'time-outline' : 'sparkles-outline' as any}
                            size={20}
                            color={COLORS.TEXT}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="download-outline" size={20} color={COLORS.TEXT} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="share-outline" size={20} color={COLORS.TEXT} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* 페이지 인디케이터 도트 */}
                    <View style={styles.pagination}>
                      <View
                        style={[
                          styles.paginationDot,
                          currentPageIndex === 0 && styles.paginationDotActive,
                        ]}
                      />
                      <View
                        style={[
                          styles.paginationDot,
                          currentPageIndex === 1 && styles.paginationDotActive,
                        ]}
                      />
                    </View>
                  </View>
                ) : (
                  // 두 번째 페이지: 책 선반
                  <View style={styles.vaultSection}>
                    {/* 제목과 책 추가 버튼 */}
                    <View style={styles.vaultHeader}>
                      <Text style={styles.vaultTitle}>당신의 소중한 책 보석함</Text>
                      <TouchableOpacity
                        style={styles.addBookButton}
                        onPress={() => setIsSearchModalVisible(true)}
                        activeOpacity={0.7}>
                        <ExpoImage source={ADD_BOOK_ICON} style={styles.addBookIcon} contentFit="contain" />
                      </TouchableOpacity>
                    </View>

                    {/* 서브 텍스트 */}
                    <Text style={styles.vaultSubtitle}>
                      읽고 있거나 읽을 예정인 책을 오른쪽 아이콘을 눌러 등록해보세요.{'\n'}
                      아래 책장에 책이 하나 하나 쌓일거예요!
                    </Text>

                    {/* 책장 이미지 영역 */}
                    <View style={styles.bookshelfContainer}>
                      {/* 좌측 화살표 */}
                      <TouchableOpacity
                        style={[styles.navArrow, styles.navArrowLeft]}
                        onPress={() => {
                          if (currentShelfIndex > 0) {
                            setCurrentShelfIndex(currentShelfIndex - 1);
                          }
                        }}
                        activeOpacity={0.7}
                        disabled={currentShelfIndex === 0}>
                        <Ionicons 
                          name="chevron-back" 
                          size={18} 
                          color={currentShelfIndex === 0 ? COLORS.BORDER : COLORS.SUBTITLE} 
                        />
                      </TouchableOpacity>

                      {/* 책장 이미지 */}
                      <View style={styles.bookshelfWrapper}>
                        <ExpoImage
                          source={bookshelfImages[currentShelfIndex % bookshelfImages.length]}
                          style={styles.bookshelfImage}
                          contentFit="contain"
                        />
                        {/* 책장 위에 책 표지 배치 */}
                        {bookshelfItems && Array.isArray(bookshelfItems) && bookshelfItems.length > 0 && (() => {
                          const BOOKS_PER_SHELF = 18;
                          const startIndex = currentShelfIndex * BOOKS_PER_SHELF;
                          const endIndex = startIndex + BOOKS_PER_SHELF;
                          const currentShelfBooks = bookshelfItems.slice(startIndex, endIndex);
                          
                          return (
                            <View style={styles.booksOnShelf}>
                              {currentShelfBooks.map((item, index) => {
                                // 책장의 3개 선반에 책을 배치 (각 선반당 최대 6권)
                                const shelfIndex = Math.floor(index / 6); // 0, 1, 2 (상단, 중간, 하단)
                                const bookIndexOnShelf = index % 6; // 0, 1, 2, 3, 4, 5
                                // 선반 위치 조정 (책장 이미지의 검은색 사각형 슬롯 위치에 맞춤)
                                const shelfTop = shelfIndex === 0 ? 42 : shelfIndex === 1 ? 100 : 158; // 각 선반의 Y 위치 (3번째 행: 192 -> 180으로 조정)
                                // 책장 너비를 고려하여 한 행에 6개씩 균등 배치
                                const bookshelfWidth = SCREEN_WIDTH * 0.9; // bookshelfWrapper의 width
                                const bookWidth = 32; // 책 너비 (검은색 사각형 크기에 맞춤)
                                const bookHeight = 46; // 책 높이 (검은색 사각형 크기에 맞춤)
                                const totalBooksWidth = bookWidth * 6; // 6개 책의 총 너비
                                const spacing = (bookshelfWidth - totalBooksWidth) / 7; // 양쪽 여백 + 책 사이 간격
                                
                                // 모든 행에 동일한 leftOffset 적용
                                const leftOffset = -12;
                                
                                // 모든 행에 동일한 X축 정렬 로직 적용
                                let bookLeft = spacing + bookIndexOnShelf * (bookWidth + spacing) + leftOffset;
                                
                                // 오른쪽 3개 책(인덱스 3, 4, 5)의 간격 조정 - 모든 행에 동일하게 적용
                                if (bookIndexOnShelf >= 3) {
                                  // 오른쪽 3개 책의 간격을 좁히기 (각각 3px씩 왼쪽으로 이동)
                                  const rightOffset = (bookIndexOnShelf - 2) * -3; // 3번째: -3px, 4번째: -6px, 5번째: -9px
                                  bookLeft += rightOffset;
                                }
                                
                                return (
                                  <View
                                    key={item.userBookId || item.bookId}
                                    style={[
                                      styles.bookOnShelfItem,
                                      {
                                        top: shelfTop,
                                        left: bookLeft,
                                      },
                                    ]}>
                                    {item.coverUrl ? (
                                      <ExpoImage
                                        source={{ uri: item.coverUrl }}
                                        style={styles.bookOnShelfCover}
                                        contentFit="cover"
                                        cachePolicy="memory-disk"
                                        priority="normal"
                                        transition={200}
                                        onError={(error) => {
                                          console.error('[Drawer_1] 책 표지 로드 실패:', item.title, item.coverUrl, error);
                                        }}
                                      />
                                    ) : (
                                      <View style={[styles.bookOnShelfCover, styles.bookOnShelfPlaceholder]}>
                                        <Text style={styles.bookOnShelfPlaceholderText}>표지</Text>
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })()}
                      </View>

                      {/* 우측 화살표 */}
                      <TouchableOpacity
                        style={[styles.navArrow, styles.navArrowRight]}
                        onPress={() => {
                          const BOOKS_PER_SHELF = 18;
                          const maxShelfIndex = Math.ceil((bookshelfItems.length || 0) / BOOKS_PER_SHELF) - 1;
                          if (currentShelfIndex < maxShelfIndex) {
                            setCurrentShelfIndex(currentShelfIndex + 1);
                          }
                        }}
                        activeOpacity={0.7}
                        disabled={(() => {
                          const BOOKS_PER_SHELF = 18;
                          const maxShelfIndex = Math.ceil((bookshelfItems.length || 0) / BOOKS_PER_SHELF) - 1;
                          return currentShelfIndex >= maxShelfIndex;
                        })()}>
                        <Ionicons 
                          name="chevron-forward" 
                          size={18} 
                          color={(() => {
                            const BOOKS_PER_SHELF = 18;
                            const maxShelfIndex = Math.ceil((bookshelfItems.length || 0) / BOOKS_PER_SHELF) - 1;
                            return currentShelfIndex >= maxShelfIndex ? COLORS.BORDER : COLORS.SUBTITLE;
                          })()} 
                        />
                      </TouchableOpacity>
                    </View>
                    {/* 페이지 인디케이터 도트 */}
                    <View style={styles.pagination}>
                      <View
                        style={[
                          styles.paginationDot,
                          currentPageIndex === 0 && styles.paginationDotActive,
                        ]}
                      />
                      <View
                        style={[
                          styles.paginationDot,
                          currentPageIndex === 1 && styles.paginationDotActive,
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          />
        </View>

        {/* 고정 섹션: 책 진도율 */}
        <View style={styles.bookSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>책 진도율</Text>
            <Text style={styles.sectionSubtitle}>진행 중인 책</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookList}>
            {readingBooks.length > 0 ? (
              readingBooks.map((item) => {
                const totalPages = item.pageCount || item.endPage || 0;
                const currentPage = item.currentPage || 0;
                // 전체 페이지 수 대비 읽은 페이지 수로 진행률 계산
                const progress = totalPages > 0 ? currentPage / totalPages : 0;
                const authors = Array.isArray(item.authors) ? item.authors.join(', ') : item.authors || '저자 미상';
                
                return (
                  <View key={item.userBookId || item.bookId} style={styles.bookCard}>
                    {item.coverUrl ? (
                      <ExpoImage
                        source={{ uri: item.coverUrl }}
                        style={styles.bookCover}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        priority="normal"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.bookCover, { backgroundColor: COLORS.PROGRESS_BG, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 12, color: COLORS.SUBTITLE, fontFamily: FONTS.REGULAR }}>표지</Text>
                      </View>
                    )}
                    <Text style={styles.bookTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {authors}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.bookPages}>
                      {currentPage}/{totalPages} 페이지
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={{ paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontFamily: FONTS.REGULAR, color: COLORS.SUBTITLE }}>진행 중인 책이 없습니다.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>
      )}

      {/* 책 추가 모달 (검색 기능 포함) */}
      <AddToShelfModal
        visible={isSearchModalVisible}
        onClose={() => {
          setIsSearchModalVisible(false);
        }}
        onSelectAndAdd={handleAddedBook}
      />

      {/* 하단 네비게이션 바 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveNav('투데이')}>
          <Image
            source={TODAY_ICON}
            style={[
              styles.navIcon,
              activeNav === '투데이' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '투데이' && styles.navLabelActive,
            ]}>
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
            style={[
              styles.navIcon,
              activeNav === '책읽기' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '책읽기' && styles.navLabelActive,
            ]}>
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
            style={[
              styles.navIcon,
              activeNav === '검색' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '검색' && styles.navLabelActive,
            ]}>
            검색
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('내서재');
            router.push('/my-library');
          }}>
          <Image
            source={LIBRARY_ICON}
            style={[
              styles.navIcon,
              activeNav === '내서재' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '내서재' && styles.navLabelActive,
            ]}>
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
  header: {
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoIcon: {
    width: 34,
    height: 34,
  },
  logoText: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellIcon: {
    width: 22,
    height: 22,
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: -5,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 23,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.BACKGROUND,
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    paddingTop: 13,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  tab: {
    flex: 0.9,
    alignItems: 'center',
    paddingBottom: 5,
  },
  tabActive: {
    // Active state handled by indicator
  },
  tabText: {
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    marginBottom: 4,
  },
  tabTextActive: {
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  tabTextInactive: {
    color: COLORS.GRAY,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '70%',
    height: 2.5,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 1,
  },
  /** 피드 탭 — 시안: 굵은 검정 밑줄 */
  tabIndicatorFeed: {
    backgroundColor: '#111111',
    height: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  slidingSectionContainer: {
    position: 'relative',
  },
  keyringSection: {
    backgroundColor: COLORS.SECTION_BG,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
    marginTop: 0,
  },
  keyringTitle: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 12,
    textAlign: 'center',
  },
  keyringSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 20,
    marginBottom: 15,
  },
  keyringImageContainer: {
    alignItems: 'center',
    marginTop: -1,
    marginBottom: 12,
    position: 'relative',
  },
  keyringImage: {
    width: '100%',
    height: 280,
    maxWidth: 350,
  },
  keyringEmptyText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
  },
  keyringActions: {
    position: 'absolute',
    bottom: -43,
    right: -2,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  paginationDot: {
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
  },
  paginationDotActive: {
    backgroundColor: COLORS.TEXT,
    width: 18,
  },
  // 책 보석함 섹션 스타일
  vaultSection: {
    backgroundColor: COLORS.SECTION_BG,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
    marginTop: 0,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  vaultTitle: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  addBookButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBookIcon: {
    width: 20,
    height: 20,
  },
  vaultSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  bookshelfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    position: 'relative',
  },
  bookshelfWrapper: {
    width: '90%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookshelfImage: {
    width: '100%',
    height: 280,
    maxWidth: 400,
  },
  booksOnShelf: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bookOnShelfItem: {
    position: 'absolute',
    width: 32,
    height: 46,
  },
  bookOnShelfCover: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bookOnShelfPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookOnShelfPlaceholderText: {
    fontSize: 8,
    color: '#999',
    fontFamily: FONTS.REGULAR,
  },
  navArrow: {
    width: 25,
    height: 25,
    borderRadius: 14,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navArrowLeft: {
    marginRight: 2,
  },
  navArrowRight: {
    marginLeft: 2,
  },
  bookSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
    backgroundColor: COLORS.BACKGROUND,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  bookList: {
    paddingRight: 15,
    paddingBottom: 10,
  },
  bookCard: {
    width: 130,
    marginRight: 15,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: 12,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },
  bookCover: {
    width: '95%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.PROGRESS_BG,
  },
  bookTitle: {
    fontSize: 14,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.PROGRESS_BG,
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  bookPages: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginBottom: 0,
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
  // 검색 모달 스타일
  searchModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  searchModal: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.75,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  searchModalContent: {
    padding: 20,
  },
  searchModalTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 8,
  },
  searchModalDescription: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  searchModalSearchContainer: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchModalIcon: {
    marginRight: 8,
  },
  searchModalInput: {
    flex: 1,
    color: COLORS.TEXT,
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    padding: 0,
  },
  searchModalResultsContainer: {
    maxHeight: 350,
  },
  searchModalLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchModalResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  searchModalResultItemSelected: {
    backgroundColor: '#F5FBF5',
  },
  searchModalResultCover: {
    width: 48,
    height: 64,
    borderRadius: 4,
    marginRight: 12,
  },
  searchModalResultInfo: {
    flex: 1,
  },
  searchModalResultTitle: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  searchModalResultMeta: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginTop: 4,
  },
  searchModalRadioContainer: {
    marginLeft: 8,
  },
  searchModalRadioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
  },
  searchModalRadioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#48A648',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#48A648',
  },
  searchModalEmptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchModalEmptyText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  searchModalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    height: 48,
  },
  searchModalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchModalCancelButtonText: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: '#555',
  },
  searchModalAddButton: {
    flex: 1,
    backgroundColor: '#5AA83A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchModalAddButtonText: {
    fontSize: 15,
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: '600',
    color: COLORS.BACKGROUND,
  },
  searchModalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

