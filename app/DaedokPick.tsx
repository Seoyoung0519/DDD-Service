import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';

import { AppMenuButton } from '@/src/components/header/AppMenuButton';
import { NotificationBellButton } from '@/src/components/header/NotificationBellButton';
import { ProfileHeaderButton } from '@/src/components/header/ProfileHeaderButton';
import { ReadingStaminaSection } from '@/src/components/reading-stamina/ReadingStaminaSection';
import { PICK_CATEGORY_TO_API } from '@/src/constants/categoryBrowse';
import { pickRemoteImageUrl, remoteImageSource } from '@/src/utils/mediaUrl';
import { fetchBanners, type Banner } from '@/src/api/banners';
import { fetchEvents, type DaedokEventItem } from '@/src/api/events';
import { fetchPicks, type DaedokPickItem } from '@/src/api/picks';
import {
    fetchBookPickVideos,
    type BookPickVideoItem
} from '../src/api/bookPick';
import { fetchRankingBooks } from '../src/api/ranking';
import { hydrateBookForDetailViaSearch } from '../src/api/search';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');

const BANNER_AUTO_MS = 4000;
const BANNER_SIDE_MARGIN = 17;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_SIDE_MARGIN * 2;
/** 긴 캡션 줄바꿈 시 잘리지 않도록 여유 높이 */
const BANNER_HEIGHT = 300;

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

// 랭킹 책 이미지
const RANKING_BOOKS = {
  혼모과: require('../assets/images/daedokPick/혼모과.png'),
  팩트풀니스: require('../assets/images/drawer/book1.png'),
  가공범: require('../assets/images/daedokPick/가공범.png'),
  편안함의습격: require('../assets/images/daedokPick/편안함의습격.png'),
  호의에대하여: require('../assets/images/daedokPick/호의에대하여.png'),
  다정한사람이이긴다: require('../assets/images/daedokPick/다정한사람이이긴다.png'),
  트렌드코리아: require('../assets/images/daedokPick/트렌드코리아.png'),
  절창: require('../assets/images/daedokPick/절창.png'),
  키메라의땅: require('../assets/images/daedokPick/키메라의땅.png'),
};

// 카테고리 이미지
const CATEGORY_IMAGES = {
  소설: require('../assets/images/daedokPick/소설.png'),
  시에세이: require('../assets/images/daedokPick/에세이.png'),
  어린이: require('../assets/images/daedokPick/어린이.png'),
  만화: require('../assets/images/daedokPick/만화.png'),
  경제경영: require('../assets/images/daedokPick/경제경영.png'),
  외국어: require('../assets/images/daedokPick/외국어.png'),
  인문: require('../assets/images/daedokPick/인문.png'),
  철학: require('../assets/images/daedokPick/철학.png'),
  과학: require('../assets/images/daedokPick/과학.png'),
  사회: require('../assets/images/daedokPick/사회.png'),
  IT: require('../assets/images/daedokPick/IT.png'),
  역사: require('../assets/images/daedokPick/역사.png'),
  종교: require('../assets/images/daedokPick/종교.png'),
  여행: require('../assets/images/daedokPick/여행.png'),
  매거진: require('../assets/images/daedokPick/매거진.png'),
  라이프스타일: require('../assets/images/daedokPick/라이프스타일.png'),
  자기계발: require('../assets/images/daedokPick/자기계발.png'),
};

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
  GOLD: '#C89100',
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

// 랭킹 책 데이터 타입
interface RankingBook {
  id: string;
  rank: number;
  title: string;
  author: string;
  description: string;
  cover: any;
}

// 랭킹 책 데이터
const rankedBooks: RankingBook[] = [
  {
    id: '1',
    rank: 1,
    title: '혼모도',
    author: '성해나',
    description: '',
    cover: RANKING_BOOKS.혼모과,
  },
  {
    id: '2',
    rank: 2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬...',
    description: '',
    cover: RANKING_BOOKS.팩트풀니스,
  },
  {
    id: '3',
    rank: 3,
    title: '가공범',
    author: '히가시노 게이고 지음/...',
    description: '',
    cover: RANKING_BOOKS.가공범,
  },
  {
    id: '4',
    rank: 4,
    title: '편안함의 습격',
    author: '마이클 이스터 지음/...',
    description: '',
    cover: RANKING_BOOKS.편안함의습격,
  },
  {
    id: '5',
    rank: 5,
    title: '호의에 대하여',
    author: '문형배',
    description: '',
    cover: RANKING_BOOKS.호의에대하여,
  },
  {
    id: '6',
    rank: 6,
    title: '다정한 사람이 이긴다',
    author: '이해인',
    description: '',
    cover: RANKING_BOOKS.다정한사람이이긴다,
  },
  {
    id: '7',
    rank: 7,
    title: '트렌드 코리아 2026',
    author: '김난도, 전민영, 최지혜...',
    description: '',
    cover: RANKING_BOOKS.트렌드코리아,
  },
];

// 카테고리 데이터 타입
interface Category {
  id: string;
  name: string;
  description: string;
  icon: any;
}

// 카테고리 데이터
const categories: Category[] = [
  {
    id: 'novel',
    name: '소설',
    description: '감정, 상상, 스토리, 사랑, 성장, 인생',
    icon: CATEGORY_IMAGES.소설,
  },
  {
    id: 'poetry',
    name: '시/에세이',
    description: '시적 언어, 감성, 일상, 철학, 성찰',
    icon: CATEGORY_IMAGES.시에세이,
  },
  {
    id: 'children',
    name: '어린이',
    description: '동화, 학습, 모험, 상상력, 교육',
    icon: CATEGORY_IMAGES.어린이,
  },
  {
    id: 'comic',
    name: '만화',
    description: '웹툰, 그래픽노블, 일상, 액션, 판타지',
    icon: CATEGORY_IMAGES.만화,
  },
  {
    id: 'business',
    name: '경제/경영',
    description: '경영, 투자, 경제, 비즈니스, 리더십',
    icon: CATEGORY_IMAGES.경제경영,
  },
  {
    id: 'foreign',
    name: '외국어',
    description: '영어, 일본어, 중국어, 언어학습',
    icon: CATEGORY_IMAGES.외국어,
  },
  {
    id: 'humanities',
    name: '인문',
    description: '철학, 역사, 문화, 사회, 인문학',
    icon: CATEGORY_IMAGES.인문,
  },
  {
    id: 'philosophy',
    name: '철학',
    description: '동서양 철학, 사상, 논리, 윤리',
    icon: CATEGORY_IMAGES.철학,
  },
  {
    id: 'science',
    name: '과학',
    description: '물리, 화학, 생물, 우주, 기술',
    icon: CATEGORY_IMAGES.과학,
  },
  {
    id: 'society',
    name: '사회',
    description: '정치, 사회, 경제, 문화, 현대사',
    icon: CATEGORY_IMAGES.사회,
  },
  {
    id: 'it',
    name: 'IT',
    description: '프로그래밍, 기술, 디지털, AI, 스타트업',
    icon: CATEGORY_IMAGES.IT,
  },
  {
    id: 'history',
    name: '역사',
    description: '한국사, 세계사, 고대, 근현대사',
    icon: CATEGORY_IMAGES.역사,
  },
  {
    id: 'religion',
    name: '종교',
    description: '불교, 기독교, 종교학, 영성',
    icon: CATEGORY_IMAGES.종교,
  },
  {
    id: 'travel',
    name: '여행',
    description: '여행기, 가이드, 문화, 탐험',
    icon: CATEGORY_IMAGES.여행,
  },
  {
    id: 'magazine',
    name: '매거진',
    description: '월간지, 주간지, 특집, 트렌드',
    icon: CATEGORY_IMAGES.매거진,
  },
  {
    id: 'lifestyle',
    name: '라이프스타일',
    description: '건강, 요리, 인테리어, 패션, 취미',
    icon: CATEGORY_IMAGES.라이프스타일,
  },
  {
    id: 'selfhelp',
    name: '자기계발',
    description: '성공, 습관, 시간관리, 목표, 동기부여',
    icon: CATEGORY_IMAGES.자기계발,
  },
];

async function openBannerUrl(url: string | null) {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.error('[EventBanner] open url failed:', e);
  }
}

type PromoSlide = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  created_at: string;
  source: 'banner' | 'event';
};

function mapBannerToSlide(item: Banner & { imageUrl?: string | null; image_path?: string | null }): PromoSlide | null {
  const image = pickRemoteImageUrl(item);
  if (!image) return null;
  return {
    id: `banner-${item.id}`,
    title: item.title,
    image_url: image,
    link_url: item.link_url,
    sort_order: item.sort_order,
    created_at: item.created_at,
    source: 'banner',
  };
}

function mapEventToSlide(
  item: DaedokEventItem & { imageUrl?: string | null; image_path?: string | null },
  index: number,
): PromoSlide | null {
  const image = pickRemoteImageUrl(item);
  if (!image) return null;
  return {
    id: `event-${item.id}`,
    title: item.title,
    image_url: image,
    link_url: item.link_url,
    sort_order: 10_000 + index,
    created_at: item.starts_at,
    source: 'event',
  };
}

// 이벤트 배너 — 배너 + 진행 중 이벤트를 같은 슬라이드로 표시
function EventBanner() {
  const [banners, setBanners] = useState<PromoSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const listRef = useRef<FlatList<PromoSlide>>(null);
  const bannerCount = banners.length;

  useEffect(() => {
    let cancelled = false;

    const loadBanners = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [bannerItems, eventItems] = await Promise.all([
          fetchBanners().catch((error) => {
            console.warn('[EventBanner] banners failed:', error);
            return [] as Banner[];
          }),
          fetchEvents().catch((error) => {
            console.warn('[EventBanner] events failed:', error);
            return [] as DaedokEventItem[];
          }),
        ]);
        if (cancelled) return;

        const bannerSlides = bannerItems
          .map(mapBannerToSlide)
          .filter((item): item is PromoSlide => item != null)
          .sort(
            (left, right) =>
              left.sort_order - right.sort_order ||
              new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
          );

        const eventSlides = eventItems
          .map(mapEventToSlide)
          .filter((item): item is PromoSlide => item != null);

        setBanners([...bannerSlides, ...eventSlides]);
        setCurrentIndex(0);
        if (bannerSlides.length === 0 && eventSlides.length === 0 && bannerItems.length === 0) {
          // both empty — leave empty state; only show error if both APIs truly failed later
        }
      } catch (error) {
        if (cancelled) return;
        setBanners([]);
        setLoadError(error instanceof Error ? error.message : '배너를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadBanners();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (isPaused || bannerCount <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % bannerCount;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, BANNER_AUTO_MS);
    return () => clearInterval(id);
  }, [isPaused, bannerCount]);

  const togglePause = () => {
    setIsPaused((p) => !p);
  };

  const onScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / BANNER_WIDTH);
    if (idx >= 0 && idx < bannerCount) setCurrentIndex(idx);
  };

  const currentBanner = banners[currentIndex] ?? banners[0];

  return (
    <View style={styles.eventBanner}>
      {isLoading ? (
        <View style={styles.bannerState}>
          <ActivityIndicator size="large" color="#2C8C55" />
          <Text style={styles.bannerStateText}>배너를 불러오는 중입니다.</Text>
        </View>
      ) : loadError ? (
        <View style={styles.bannerState}>
          <Text style={styles.bannerStateText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.bannerRetryButton}
            onPress={() => setReloadKey((value) => value + 1)}>
            <Text style={styles.bannerRetryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : bannerCount === 0 ? (
        <View style={styles.bannerState}>
          <Text style={styles.bannerStateText}>현재 노출 중인 배너가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={banners}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          style={styles.eventBannerList}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, index) => ({
            length: BANNER_WIDTH,
            offset: BANNER_WIDTH * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: true });
            }, 120);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.eventBannerSlide}
              activeOpacity={item.link_url ? 0.92 : 1}
              disabled={!item.link_url}
              onPress={() => openBannerUrl(item.link_url)}>
              <ExpoImage
                source={remoteImageSource(item.image_url)}
                style={styles.eventBannerImage}
                contentFit="cover"
                cachePolicy="none"
                recyclingKey={item.id}
                onError={() => {
                  console.warn('[EventBanner] image error', item.image_url);
                }}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {currentBanner ? (
        <>
          <View style={styles.eventBannerBottomDim} pointerEvents="none" />
          <View style={styles.eventBannerControlsOverlay} pointerEvents="box-none">
            <View style={styles.eventBannerControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePause}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={isPaused ? '배너 자동 넘김 재생' : '배너 자동 넘김 일시정지'}
                accessibilityRole="button">
                <Ionicons name={isPaused ? 'play' : 'pause'} size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.slideIndicator}>
                <Text style={styles.slideIndicatorText}>
                  {currentIndex + 1}/{bannerCount}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bannerCaptionLayer} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={currentBanner.link_url ? 0.92 : 1}
              disabled={!currentBanner.link_url}
              onPress={() => openBannerUrl(currentBanner.link_url)}
              style={styles.bannerCaptionTouch}>
              <Text style={styles.bannerCaption}>{currentBanner.title}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}

/** 메인 배너 바로 아래 — GET /api/picks */
function WeeklyPickSection() {
  const router = useRouter();
  const [picks, setPicks] = useState<DaedokPickItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const items = await fetchPicks();
        if (cancelled) return;
        setPicks(
          [...items].sort(
            (a, b) =>
              a.sort_order - b.sort_order ||
              String(a.title).localeCompare(String(b.title), 'ko'),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          console.warn('[WeeklyPickSection] fetchPicks failed:', error);
          setPicks([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPick = async (pick: DaedokPickItem) => {
    if (openingId) return;
    const query = pick.title?.trim() || pick.book_isbn?.trim();
    if (!query) {
      Alert.alert('도서 정보 없음', '이 Pick에 연결된 도서 정보가 없습니다.');
      return;
    }
    try {
      setOpeningId(pick.id);
      const seedId = pick.book_isbn?.trim() || pick.id;
      const aladinId = await hydrateBookForDetailViaSearch(seedId, query);
      router.push({
        pathname: '/BookDetailScreen',
        params: { bookId: aladinId, skipRecentBook: 'true' },
      });
    } catch (error) {
      Alert.alert(
        '도서 상세 열기 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setOpeningId(null);
    }
  };

  if (!isLoading && picks.length === 0) {
    return null;
  }

  return (
    <View style={styles.weeklyPickSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleBlack}>이번주 </Text>
            <Text style={styles.sectionTitleGreen}>대독PICK</Text>
          </View>
          <Text style={styles.sectionSubtitle}>대독단이 엄선한 이번 주 추천 도서예요.</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.weeklyPickLoading}>
          <ActivityIndicator color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={picks}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={styles.weeklyPickList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.weeklyPickCard}
              activeOpacity={0.85}
              disabled={openingId === item.id}
              onPress={() => void openPick(item)}>
              {item.cover_image_url ? (
                <ExpoImage
                  source={{ uri: item.cover_image_url }}
                  style={styles.weeklyPickCover}
                  contentFit="contain"
                />
              ) : (
                <View style={[styles.weeklyPickCover, styles.weeklyPickCoverPlaceholder]}>
                  <Ionicons name="book-outline" size={28} color={COLORS.SUBTITLE} />
                </View>
              )}
              <View style={styles.weeklyPickTextBlock}>
                <Text style={styles.weeklyPickTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.weeklyPickDescription} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// 랭킹 섹션 컴포넌트
function RankingSection() {
  const router = useRouter();
  const [rankingBooks, setRankingBooks] = useState<RankingBook[]>(rankedBooks);
  const [isLoading, setIsLoading] = useState(false);
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);

        const rankings = await fetchRankingBooks();
        const mapped: RankingBook[] = rankings.map((item) => ({
          id: String(item.bookId),
          rank: item.rank,
          title: item.title,
          author: item.authors,
          description: '',
          cover: { uri: item.coverUrl },
        }));

        if (!cancelled) setRankingBooks(mapped);
      } catch (e) {
        // 실패해도 UI는 더미(초기값)로 보여주기
        console.error('[DaedokPick][RankingSection] fetchRankingBooks failed:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.rankingSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelGreen}>대독</Text>
            <Text style={styles.sectionLabelBlack}>랭킹</Text>
            <Text style={styles.dateLabel}>알라딘 기준</Text>
          </View>
          <Text style={styles.rankingDescription}>
            온라인 서점 50위 내 베스트셀러를 대독단에서 조회해보고 대독단과 함께 독서해요.
          </Text>
        </View>
      </View>

      <View style={styles.rankingList}>
        {isLoading ? (
          <Text style={{ color: COLORS.SUBTITLE, fontSize: 12, fontFamily: FONTS.REGULAR }}>
            로딩 중...
          </Text>
        ) : (
          rankingBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={styles.rankingItem}
              activeOpacity={0.7}
              disabled={openingBookId === book.id}
              onPress={async () => {
                if (openingBookId) return;
                try {
                  setOpeningBookId(book.id);
                  // 백엔드: 상세 전에 /api/search/books 로 로컬 DB 적재 필요
                  const aladinId = await hydrateBookForDetailViaSearch(book.id, book.title, book.author);
                  router.push({
                    pathname: '/BookDetailScreen',
                    params: { bookId: aladinId, skipRecentBook: 'true' },
                  });
                } catch (e: any) {
                  console.error('[DaedokPick][RankingSection] open detail failed:', e);
                  Alert.alert(
                    '도서 정보',
                    e?.message ?? '상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
                  );
                } finally {
                  setOpeningBookId(null);
                }
              }}>
              <Text style={styles.rankingNumber}>{book.rank}</Text>
              <ExpoImage source={book.cover} style={styles.rankingBookCover} contentFit="cover" />
              <View style={styles.rankingBookInfo}>
                <Text style={styles.rankingBookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.rankingBookAuthor} numberOfLines={1}>
                  {book.author}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

// Pick 영상 섹션 컴포넌트
function PickVideoSection() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [videos, setVideos] = useState<BookPickVideoItem[]>([]);

  // 현재 센터 인덱스(0..videos.length-1)
  const [centerIndex, setCenterIndex] = useState(0);

  const carouselLen = videos.length;

  const shuffleArray = <T,>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const openVideoUrl = async (url: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error('[BookPick] open url failed:', e);
    }
  };

  const goPrev = () => {
    if (carouselLen <= 1) return;
    setCenterIndex((i) => (i - 1 + carouselLen) % carouselLen);
  };

  const goNext = () => {
    if (carouselLen <= 1) return;
    setCenterIndex((i) => (i + 1) % carouselLen);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const sections = await fetchBookPickVideos();
        const validSections = (sections || []).filter((s) => (s.items || []).length > 0);
        if (validSections.length === 0) {
          throw new Error('북PICK 영상 섹션이 없습니다.');
        }

        // 요청사항: 먼저 playlistId/title로 섹션(이동진/민음)을 구분
        // 요청사항: 섹션 구분은 playlistId로 확정
        const movedjinPlaylistId =
          validSections.find((s) => /이동진/.test(s.title))?.playlistId ?? validSections[0]?.playlistId;
        const nonMovedjinSections = movedjinPlaylistId
          ? validSections.filter((s) => s.playlistId !== movedjinPlaylistId)
          : validSections;

        // 이동진을 제외한 나머지를 민음사 소스로 취급
        const pickedMinumsaSource = nonMovedjinSections;

        const movedjinItems = validSections.find((s) => s.playlistId === movedjinPlaylistId)?.items ?? [];
        const minumsaItems = pickedMinumsaSource.flatMap((s) => s.items ?? []);

        const pickedMovedjin = shuffleArray(movedjinItems).slice(0, 2);
        const pickedMinumsa = shuffleArray(minumsaItems).slice(0, 2);

        let pickedVideos = [...pickedMovedjin, ...pickedMinumsa];

        // 4개가 안 나오면 전체 아이템에서 보강
        if (pickedVideos.length < 4) {
          const allItems = validSections.flatMap((s) => s.items ?? []);
          const extra = shuffleArray(allItems).slice(0, 4 - pickedVideos.length);
          pickedVideos = [...pickedVideos, ...extra];
        }

        pickedVideos = shuffleArray(pickedVideos).slice(0, 4);

        if (!cancelled) {
          setVideos(pickedVideos);
          setCenterIndex(0);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '북PICK 로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (carouselLen <= 1) return;

    const id = setInterval(() => {
      setCenterIndex((i) => (i + 1) % carouselLen);
    }, 5000);

    return () => clearInterval(id);
  }, [carouselLen, loading]);

  const prevIndex = carouselLen > 0 ? (centerIndex - 1 + carouselLen) % carouselLen : 0;
  const centerVideo = carouselLen > 0 ? videos[centerIndex] : null;
  const nextIndex = carouselLen > 0 ? (centerIndex + 1) % carouselLen : 0;
  const prevVideo = carouselLen > 0 ? videos[prevIndex] : null;
  const nextVideo = carouselLen > 0 ? videos[nextIndex] : null;

  const handlePressMore = () => {
    router.push({ pathname: '/BookPick' });
  };

  return (
    <View style={styles.videoSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleBlack}>뭐 읽지? </Text>
            <Text style={styles.sectionTitleGreen}>북Pick</Text>
            <Text style={styles.sectionTitleBlack}> 영상</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            요즘 읽을 책이 없다고요? 출판사와 연예인들이 직접 추천하는 책들은 어떠세요?
          </Text>
        </View>
        <TouchableOpacity onPress={handlePressMore} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
      </View>

      <View style={styles.videoCarousel}>
        {/* 왼쪽 카드 */}
        {prevVideo ? (
          <TouchableOpacity
            style={styles.videoCarouselSide}
            activeOpacity={0.7}
            onPress={() => openVideoUrl(prevVideo.externalUrl)}>
            <ExpoImage
              source={{ uri: prevVideo.thumbnailUrl }}
              style={styles.videoCarouselSideImage}
              contentFit="cover"
            />

            <View style={styles.videoCarouselArrowLeft} pointerEvents="box-none">
              <TouchableOpacity
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                activeOpacity={0.8}
                onPress={goPrev}>
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.videoCardMetaOverlay}>
              <Text style={styles.videoCardMetaTitle} numberOfLines={1}>
                {prevVideo.title}
              </Text>
              <Text style={styles.videoCardMetaSub} numberOfLines={1}>
                {prevVideo.channelName}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 가운데 메인 카드 */}
        {centerVideo ? (
          <TouchableOpacity
            style={styles.videoCarouselMain}
            activeOpacity={0.9}
            onPress={() => openVideoUrl(centerVideo.externalUrl)}>
            <ExpoImage
              source={{ uri: centerVideo.thumbnailUrl }}
              style={styles.videoCarouselMainImage}
              contentFit="cover"
            />
            <View style={styles.videoPlayOverlay}>
              <View style={styles.videoPlayButton}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 오른쪽 카드 */}
        {nextVideo ? (
          <TouchableOpacity
            style={styles.videoCarouselSide}
            activeOpacity={0.7}
            onPress={() => openVideoUrl(nextVideo.externalUrl)}>
            <ExpoImage
              source={{ uri: nextVideo.thumbnailUrl }}
              style={styles.videoCarouselSideImage}
              contentFit="cover"
            />
            <View style={styles.videoCarouselArrowRight} pointerEvents="box-none">
              <TouchableOpacity
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                activeOpacity={0.8}
                onPress={goNext}>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.videoCardMetaOverlay}>
              <Text style={styles.videoCardMetaTitle} numberOfLines={1}>
                {nextVideo.title}
              </Text>
              <Text style={styles.videoCardMetaSub} numberOfLines={1}>
                {nextVideo.channelName}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.videoInfo}>
        {centerVideo ? (
          <>
            <Text style={styles.videoTitle} numberOfLines={2} ellipsizeMode="tail">
              {centerVideo.title}
            </Text>
            <Text style={styles.videoDescription}>
              {centerVideo.channelName}
            </Text>
          </>
        ) : loading ? (
          <Text style={styles.videoDescription}>로딩 중...</Text>
        ) : error ? (
          <Text style={styles.videoDescription}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

// 카테고리 섹션 컴포넌트
function CategorySection({ onPressCategory }: { onPressCategory: (categoryId: string) => void }) {
  return (
    <View style={styles.categorySection}>
      <Text style={styles.categorySectionTitle}>카테고리</Text>
      <View style={styles.categoryList}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => onPressCategory(category.id)}
            activeOpacity={0.7}>
            <View style={styles.categoryItemLeft}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>
            <Image
              source={category.icon}
              style={styles.categoryIcon}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// 푸터 컴포넌트
function AppFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerTop}>
        <Text style={styles.footerLogo}>대독단</Text>
        <View style={styles.footerSocial}>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-instagram" size={20} color={COLORS.SUBTITLE} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-youtube" size={20} color={COLORS.SUBTITLE} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.SUBTITLE} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerCompany}>(주)대독단</Text>
      <TouchableOpacity style={styles.footerBusinessInfo}>
        <Text style={styles.footerBusinessInfoText}>사업자정보확인하기</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.SUBTITLE} />
      </TouchableOpacity>

      <View style={styles.footerLinks}>
        <TouchableOpacity>
          <Text style={styles.footerLink}>이용약관</Text>
        </TouchableOpacity>
        <Text style={styles.footerLinkSeparator}>|</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>개인정보처리방침</Text>
        </TouchableOpacity>
        <Text style={styles.footerLinkSeparator}>|</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>콘텐츠 제휴문의</Text>
        </TouchableOpacity>
        <Text style={styles.footerLinkSeparator}>|</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>B2B문의</Text>
        </TouchableOpacity>
        <Text style={styles.footerLinkSeparator}>|</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>회사 소개</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerCopyright}>
        2025. DAE DOK DAN Inc. All rights reserved.
      </Text>
    </View>
  );
}

export default function DaedokPickScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('대독PICK');
  const [activeNav, setActiveNav] = useState('투데이');

  const handleCategory = (categoryId: string) => {
    const apiKey = PICK_CATEGORY_TO_API[categoryId];
    const category = categories.find((c) => c.id === categoryId);
    if (!apiKey || !category) return;
    router.push({
      pathname: '/CategorySectionsScreen',
      params: {
        pickId: categoryId,
        category: apiKey,
        title: category.name,
      },
    });
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
          <ProfileHeaderButton style={styles.headerIconButton} iconColor={COLORS.TEXT} />
          <NotificationBellButton style={styles.headerIconButton} />
          <AppMenuButton style={styles.headerIconButton} iconColor={COLORS.TEXT} />
        </View>
      </View>

      {/* 상단 탭 영역 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === '서랍장' && styles.tabActive]}
          onPress={() => router.push('/Drawer_1')}>
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
          onPress={() => {}}>
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
          onPress={() => router.push({ pathname: '/Drawer_1', params: { tab: '피드' } })}>
          <Text
            style={[
              styles.tabText,
              activeTab === '피드' ? styles.tabTextActive : styles.tabTextInactive,
            ]}>
            피드
          </Text>
          {activeTab === '피드' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* 메인 콘텐츠 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        scrollEventThrottle={16}
        nestedScrollEnabled>
        {/* 이벤트 배너 (배너 + 진행 중 이벤트) */}
        <EventBanner />

        {/* 이번주 대독PICK */}
        <WeeklyPickSection />

        {/* 대독 랭킹 섹션 */}
        <RankingSection />

        {/* Pick 영상 섹션 */}
        <PickVideoSection />

        {/* 독서 체력 섹션 */}
        <ReadingStaminaSection />

        {/* 카테고리 섹션 */}
        <CategorySection onPressCategory={handleCategory} />

        {/* 푸터 */}
        <AppFooter />
      </ScrollView>

      {/* 하단 네비게이션 바 */}
      <AppBottomNavBar>
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
      </AppBottomNavBar>
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
    top: 3,
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
  tabActive: {},
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom:5,
  },
  weeklyPickSection: {
    paddingHorizontal: 17,
    marginTop: 12,
    marginBottom: 20,
  },
  weeklyPickLoading: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyPickList: {
    paddingRight: 8,
    gap: 12,
  },
  weeklyPickCard: {
    width: Math.min(BANNER_WIDTH, 340),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginRight: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#FFFFFF',
  },
  weeklyPickCover: {
    width: 92,
    height: 128,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  weeklyPickCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyPickTextBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 6,
  },
  weeklyPickTitle: {
    fontSize: 15,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    lineHeight: 21,
  },
  weeklyPickDescription: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 18,
  },
  // 이벤트 배너 스타일 (가로 슬라이드)
  eventBanner: {
    marginHorizontal: BANNER_SIDE_MARGIN,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  eventBannerList: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
  },
  bannerState: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F3F3F3',
  },
  bannerStateText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#777777',
    textAlign: 'center',
  },
  bannerRetryButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#2C8C55',
  },
  bannerRetryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventBannerSlide: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
  },
  eventBannerImage: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 18,
  },
  /** 하단 회색 바보다 위 레이어 — 글자가 겹쳐 보이도록 */
  bannerCaptionLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: 14,
    paddingRight: 100,
    paddingBottom: 60,
    justifyContent: 'flex-end',
    zIndex: 3,
  },
  bannerCaptionTouch: {
    alignSelf: 'stretch',
    width: '100%',
  },
  bannerCaption: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    lineHeight: 26,
    flexShrink: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  eventBannerBottomDim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 118,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 1,
  },
  eventBannerControlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 16,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  eventBannerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slideIndicatorText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#FFFFFF',
  },
  // 랭킹 섹션 스타일
  rankingSection: {
    paddingHorizontal: 23,
    marginTop: 10,
    marginBottom: 45,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionLabelGreen: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  sectionLabelBlack: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  rankingDescription: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#888',
  },
  rankingList: {
    gap: 12,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  rankingNumber: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    width: 24,
    marginRight: 12,
  },
  rankingBookCover: {
    width: 70,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
  },
  rankingBookInfo: {
    flex: 1,
    marginRight: 8,
  },
  rankingBookTitle: {
    fontSize: 14,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  rankingBookAuthor: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  // 영상 섹션 스타일
  videoSection: {
    paddingHorizontal: 20,
    marginBottom: 45,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleBlack: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  sectionTitleGreen: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  videoCarousel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    gap: 8,
  },
  videoCarouselMain: {
    width: SCREEN_WIDTH * 0.6,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoCarouselMainImage: {
    width: '100%',
    height: '100%',
  },
  videoCarouselSide: {
    width: SCREEN_WIDTH * 0.15,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  videoCarouselSideImage: {
    width: '100%',
    height: '100%',
  },
  videoCarouselArrowLeft: {
    position: 'absolute',
    left: 4,
    top: 48,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCarouselArrowRight: {
    position: 'absolute',
    right: 4,
    top: 48,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: '#FFFFFF',
  },
  // 사이드 카드 하단 메타 정보 오버레이
  videoCardMetaOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  videoCardMetaTitle: {
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  videoCardMetaSub: {
    fontSize: 9,
    fontFamily: FONTS.REGULAR,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  videoInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 13,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 6,
    lineHeight: 22,
    textAlign: 'center',
  },
  videoDescription: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 14,
    textAlign: 'center',
  },
  // 카테고리 섹션 스타일
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 45,
  },
  categorySectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 20,
  },
  categoryList: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 1,
    paddingLeft: 14,
    paddingRight: 0,
    marginBottom: 0,
    minHeight: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  categoryItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#888',
    lineHeight: 18,
  },
  categoryIcon: {
    width: 72,
    height: 80,
    borderRadius: 0,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    transform: [{ rotate: '0deg' }],
    marginRight: -4,
  },
  // 푸터 스타일
  footer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    marginTop: 16,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLogo: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  footerSocial: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerCompany: {
    fontSize: 14,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  footerBusinessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerBusinessInfoText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginRight: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginHorizontal: 4,
  },
  footerLinkSeparator: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    marginHorizontal: 4,
  },
  footerCopyright: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginTop: 8,
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

