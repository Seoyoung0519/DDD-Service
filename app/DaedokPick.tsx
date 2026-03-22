import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
  fetchBookPickVideos,
  type BookPickVideoItem
} from '../src/api/bookPick';
import { fetchRankingBooks } from '../src/api/ranking';
import { hydrateBookForDetailViaSearch } from '../src/api/search';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON = require('../assets/images/drawer/bell.png');

/** 상단 홍보 배너 — 이미지 + 캡션 + 링크 */
type PromoBannerItem = {
  id: string;
  image: number;
  caption: string;
  url: string;
};

const PROMO_BANNERS: PromoBannerItem[] = [
  {
    id: 'sibf-2026',
    image: require('../assets/images/daedokPick/banner/서울국제도서전_배너.png'),
    caption: '2026 국제도서전\n놓치지말기',
    url: 'https://sibf.kr/page/11',
  },
  {
    id: 'literature-forum-2026',
    image: require('../assets/images/daedokPick/banner/2026 한국문학 비평포럼_배너.png'),
    caption: '2026 한국문학 비평포럼이 열린대!',
    url: 'https://www.readinggroup.or.kr/board/culture_view.php?m=read&b=B_1_6&bn=1454',
  },
];

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
  외국어: require('../assets/images/drawer/book2.png'), // TODO: 외국어 카테고리 이미지
  인문: require('../assets/images/daedokPick/인문.png'),
  철학: require('../assets/images/daedokPick/철학.png'),
  과학: require('../assets/images/daedokPick/과학.png'),
  사회: require('../assets/images/drawer/book1.png'), // TODO: 사회 카테고리 이미지
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

async function openBannerUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.error('[EventBanner] open url failed:', e);
  }
}

// 이벤트 배너 — 가로 슬라이드 + 4초 자동 / 일시정지 토글
function EventBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const listRef = useRef<FlatList<PromoBannerItem>>(null);
  const bannerCount = PROMO_BANNERS.length;

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

  const currentBanner = PROMO_BANNERS[currentIndex] ?? PROMO_BANNERS[0];

  return (
    <View style={styles.eventBanner}>
      <FlatList
        ref={listRef}
        data={PROMO_BANNERS}
        keyExtractor={(_, index) => `banner-${index}`}
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
            activeOpacity={0.92}
            onPress={() => openBannerUrl(item.url)}>
            <ExpoImage source={item.image} style={styles.eventBannerImage} contentFit="cover" />
          </TouchableOpacity>
        )}
      />

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

      {/* 회색 하단바와 겹치되, 글자는 더 앞 레이어(zIndex)에 표시 */}
      <View style={styles.bannerCaptionLayer} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => openBannerUrl(currentBanner.url)}
          style={styles.bannerCaptionTouch}>
          <Text style={styles.bannerCaption}>{currentBanner.caption}</Text>
        </TouchableOpacity>
      </View>
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

// BookItem 인터페이스
interface BookItem {
  id: string;
  title: string;
  author: string;
  coverSource: any;
  pageCount: number;
}

// ReadingStaminaSection Props
interface ReadingStaminaSectionProps {
  books?: BookItem[];
  onChangeSelectedBook?: (book: BookItem) => void;
}

// 독서 체력 섹션 컴포넌트
function ReadingStaminaSection({ books: propsBooks, onChangeSelectedBook }: ReadingStaminaSectionProps = {}) {
  const ITEM_WIDTH = SCREEN_WIDTH * 0.2;
  const ITEM_SPACING = 8;
  const ITEM_HEIGHT = 220;

  const [selectedRange, setSelectedRange] = useState<'100' | '200' | '400' | '400plus'>('100');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [initialScrollIndex, setInitialScrollIndex] = useState(0);

  // 샘플 책 데이터 (props가 없을 경우 사용)
  // 각 쪽수 범위별로 여러 책을 포함
  const sampleBooks: BookItem[] = [
    // ≤ 100쪽 범위
    { id: '1', title: '멍청해지기전에읽는 뇌과학', author: '이인아', coverSource: RANKING_BOOKS.다정한사람이이긴다, pageCount: 80 },
    { id: '2', title: '어른 수업', author: '작가명', coverSource: RANKING_BOOKS.편안함의습격, pageCount: 95 },
    { id: '3', title: '짧은 에세이 모음', author: '에세이스트', coverSource: RANKING_BOOKS.혼모과, pageCount: 70 },
    { id: '4', title: '단편 소설집', author: '소설가', coverSource: RANKING_BOOKS.가공범, pageCount: 85 },
    { id: '5', title: '일상의 기록', author: '작가명', coverSource: RANKING_BOOKS.절창, pageCount: 60 },
    { id: '6', title: '생각의 단편', author: '철학자', coverSource: RANKING_BOOKS.키메라의땅, pageCount: 90 },
    
    // 101~200쪽 범위
    { id: '7', title: '주영도', author: '억새, 바람흘눕히다.', coverSource: RANKING_BOOKS.혼모과, pageCount: 120 },
    { id: '8', title: '녹색 절벽의 신자들', author: '조계은', coverSource: RANKING_BOOKS.호의에대하여, pageCount: 150 },
    { id: '9', title: '트렌드 코리아', author: '작가명', coverSource: RANKING_BOOKS.트렌드코리아, pageCount: 110 },
    { id: '10', title: '중편 소설 모음', author: '소설가', coverSource: RANKING_BOOKS.편안함의습격, pageCount: 180 },
    { id: '11', title: '인생의 교훈', author: '작가명', coverSource: RANKING_BOOKS.다정한사람이이긴다, pageCount: 140 },
    { id: '12', title: '에세이집', author: '에세이스트', coverSource: RANKING_BOOKS.가공범, pageCount: 160 },
    { id: '13', title: '자기계발의 길', author: '멘토', coverSource: RANKING_BOOKS.절창, pageCount: 130 },
    { id: '14', title: '철학 에세이', author: '철학자', coverSource: RANKING_BOOKS.키메라의땅, pageCount: 170 },
    
    // 201~400쪽 범위
    { id: '15', title: '장편 소설 1', author: '소설가', coverSource: RANKING_BOOKS.혼모과, pageCount: 250 },
    { id: '16', title: '역사 논픽션', author: '역사가', coverSource: RANKING_BOOKS.호의에대하여, pageCount: 300 },
    { id: '17', title: '과학 교양서', author: '과학자', coverSource: RANKING_BOOKS.트렌드코리아, pageCount: 280 },
    { id: '18', title: '경제 경영서', author: '경제학자', coverSource: RANKING_BOOKS.편안함의습격, pageCount: 320 },
    { id: '19', title: '인문학 강의', author: '인문학자', coverSource: RANKING_BOOKS.다정한사람이이긴다, pageCount: 350 },
    { id: '20', title: '사회 비평서', author: '사회학자', coverSource: RANKING_BOOKS.가공범, pageCount: 240 },
    { id: '21', title: '문학 평론집', author: '평론가', coverSource: RANKING_BOOKS.절창, pageCount: 270 },
    { id: '22', title: '철학 입문서', author: '철학자', coverSource: RANKING_BOOKS.키메라의땅, pageCount: 310 },
    { id: '23', title: '문화 분석서', author: '문화비평가', coverSource: RANKING_BOOKS.혼모과, pageCount: 290 },
    { id: '24', title: '심리학 개론', author: '심리학자', coverSource: RANKING_BOOKS.호의에대하여, pageCount: 360 },
    
    // > 400쪽 범위
    { id: '25', title: '대작 소설 1', author: '소설가', coverSource: RANKING_BOOKS.트렌드코리아, pageCount: 450 },
    { id: '26', title: '역사 대작', author: '역사가', coverSource: RANKING_BOOKS.편안함의습격, pageCount: 520 },
    { id: '27', title: '철학 대작', author: '철학자', coverSource: RANKING_BOOKS.다정한사람이이긴다, pageCount: 480 },
    { id: '28', title: '문학 대작', author: '소설가', coverSource: RANKING_BOOKS.가공범, pageCount: 600 },
    { id: '29', title: '과학 대작', author: '과학자', coverSource: RANKING_BOOKS.절창, pageCount: 550 },
    { id: '30', title: '인문학 대작', author: '인문학자', coverSource: RANKING_BOOKS.키메라의땅, pageCount: 500 },
    { id: '31', title: '시리즈 소설 1', author: '소설가', coverSource: RANKING_BOOKS.혼모과, pageCount: 480 },
    { id: '32', title: '전기 대작', author: '전기작가', coverSource: RANKING_BOOKS.호의에대하여, pageCount: 650 },
  ];

  const books = propsBooks || sampleBooks;

  // 쪽수 범위에 따라 책 필터링 (baseBooks)
  const baseBooks = books.filter((book) => {
    switch (selectedRange) {
      case '100':
        return book.pageCount <= 100;
      case '200':
        return book.pageCount > 100 && book.pageCount <= 200;
      case '400':
        return book.pageCount > 200 && book.pageCount <= 400;
      case '400plus':
        return book.pageCount > 400;
      default:
        return true;
    }
  });

  // 무한 캐러셀을 위한 가상 배열 설정
  const DATA_LENGTH = baseBooks.length;
  const VIRTUAL_LENGTH = DATA_LENGTH > 0 ? DATA_LENGTH * 1000 : 0;
  const INITIAL_INDEX = DATA_LENGTH > 0 ? Math.floor(VIRTUAL_LENGTH / 2) : 0;

  // 가상 인덱스에서 실제 데이터를 가져오는 함수
  const getItem = (virtualIndex: number): BookItem | null => {
    if (DATA_LENGTH === 0) return null;
    const realIndex = virtualIndex % DATA_LENGTH;
    return baseBooks[realIndex];
  };

  // 가상 배열 생성
  const virtualBooks = Array.from({ length: VIRTUAL_LENGTH }, (_, i) => ({
    ...getItem(i)!,
    id: `virtual-${i}`,
  }));

  // filteredBooks는 가상 배열 (하위 호환성을 위해)
  const filteredBooks = virtualBooks;

  // 초기 스크롤 인덱스 설정
  useEffect(() => {
    if (DATA_LENGTH > 0 && initialScrollIndex === 0) {
      setInitialScrollIndex(INITIAL_INDEX);
    }
  }, [DATA_LENGTH]);

  // 쪽수 범위 설명 문구
  const getRangeDescription = () => {
    switch (selectedRange) {
      case '100':
        return '짧은 시간에 집중해서 읽고 싶을 때 추천해요. (에세이, 단편집, 단편소설)';
      case '200':
        return '하루 종일 읽기 좋은 분량이에요. (중편소설, 에세이집)';
      case '400':
        return '주말에 몰아서 읽기 좋은 책들이에요. (장편소설, 논픽션)';
      case '400plus':
        return '여유롭게 천천히 읽어보세요. (대작, 시리즈)';
      default:
        return '';
    }
  };

  // 필터 변경 핸들러
  const handleRangeChange = (range: '100' | '200' | '400' | '400plus') => {
    setSelectedRange(range);
    // scrollX 애니메이션 값 리셋
    scrollX.setValue(0);
    // 새로운 초기 인덱스 계산
    const newDataLength = books.filter((book) => {
      switch (range) {
        case '100':
          return book.pageCount <= 100;
        case '200':
          return book.pageCount > 100 && book.pageCount <= 200;
        case '400':
          return book.pageCount > 200 && book.pageCount <= 400;
        case '400plus':
          return book.pageCount > 400;
        default:
          return true;
      }
    }).length;
    if (newDataLength > 0) {
      const newVirtualLength = newDataLength * 1000;
      const newInitialIndex = Math.floor(newVirtualLength / 2);
      setInitialScrollIndex(newInitialIndex);
      setSelectedIndex(newInitialIndex);
      // FlatList를 중간 위치로 스크롤
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: newInitialIndex,
            animated: false,
          });
        }, 100);
      }
    }
  };

  // 스크롤 종료 시 현재 인덱스 계산
  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const virtualIndex = Math.round(offsetX / ITEM_WIDTH);
    setSelectedIndex(virtualIndex);
    
    // 실제 인덱스 계산
    if (DATA_LENGTH > 0) {
      const realIndex = virtualIndex % DATA_LENGTH;
      const selectedBook = baseBooks[realIndex];
      if (selectedBook && onChangeSelectedBook) {
        onChangeSelectedBook(selectedBook);
      }
    }
  };

  // 책 아이템 렌더링
  const renderBookItem = ({ item, index }: { item: BookItem; index: number }) => {
    // 양 옆 2개씩 보이도록 inputRange 확장
    const inputRange = [
      (index - 2) * ITEM_WIDTH,
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
      (index + 2) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 0.85, 1.1, 0.85, 0.75],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [15, 10, -8, 10, 15],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 0.7, 1, 0.7, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.bookCarouselItem,
          {
            width: ITEM_WIDTH,
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}>
        <ExpoImage source={item.coverSource} style={styles.bookCarouselCover} contentFit="cover" />
      </Animated.View>
    );
  };

  const pageRanges = [
    { key: '100' as const, label: '≤ 100쪽' },
    { key: '200' as const, label: '≤ 200쪽' },
    { key: '400' as const, label: '≤ 400쪽' },
    { key: '400plus' as const, label: '> 400쪽' },
  ];

  // 실제 인덱스로 변환하여 선택된 책 가져오기
  const realIndex = DATA_LENGTH > 0 ? selectedIndex % DATA_LENGTH : 0;
  const selectedBook = baseBooks[realIndex] || null;

  return (
    <View style={styles.readingStaminaSection}>
      {/* 헤더 */}
      <View style={styles.staminaHeader}>
        <View style={styles.staminaHeaderLeft}>
          <Text style={styles.staminaTitle}>오늘의 독서 체력은 몇 쪽?</Text>
          <Text style={styles.staminaSubtitle}>
            대독단만의 쪽수 기준 도서 추천으로 완독률을 높여보세요.
          </Text>
        </View>
        <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
      </View>

      {/* 페이지 범위 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pageRangeContainer}
        contentContainerStyle={styles.pageRangeContent}>
        {pageRanges.map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.pageRangeButton,
              selectedRange === range.key && styles.pageRangeButtonActive,
            ]}
            onPress={() => handleRangeChange(range.key)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.pageRangeText,
                selectedRange === range.key && styles.pageRangeTextActive,
              ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 설명 문구 및 책 캐러셀 영역 (연한 초록색 배경) */}
      <View style={styles.descriptionAndCarouselWrapper}>
        {/* 설명 문구 영역 */}
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{getRangeDescription()}</Text>
        </View>

        {/* 책 캐러셀 */}
        {filteredBooks.length > 0 ? (
          <>
            <View style={styles.carouselContainer}>
            <Animated.FlatList
              ref={flatListRef}
              data={filteredBooks}
              renderItem={renderBookItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={true}
              pagingEnabled={false}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              disableIntervalMomentum={false}
              initialScrollIndex={DATA_LENGTH > 0 ? (initialScrollIndex || INITIAL_INDEX) : 0}
              getItemLayout={(data, index) => ({
                length: ITEM_WIDTH,
                offset: ITEM_WIDTH * index,
                index,
              })}
              contentContainerStyle={[
                styles.carouselContent,
                { paddingHorizontal: (SCREEN_WIDTH - ITEM_WIDTH) / 2 - ITEM_WIDTH * 1.5 },
              ]}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: true,
              })}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
              onScrollToIndexFailed={(info) => {
                // 스크롤 실패 시 재시도
                setTimeout(() => {
                  if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({
                      index: info.index,
                      animated: false,
                    });
                  }
                }, 100);
              }}
            />
          </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>해당 쪽수 범위의 책이 없습니다.</Text>
          </View>
        )}
      </View>

      {/* 선택된 책 정보 (배경 밖) */}
      {selectedBook && (
        <View style={styles.selectedBookInfo}>
          <Text style={styles.selectedBookTitle} numberOfLines={2}>
            {selectedBook.title}
          </Text>
          <View style={styles.selectedBookAuthorRow}>
            <Ionicons name="person-outline" size={12} color={COLORS.SUBTITLE} />
            <Text style={styles.selectedBookAuthor}>{selectedBook.author}</Text>
          </View>
        </View>
      )}
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
            <ExpoImage source={category.icon} style={styles.categoryIcon} contentFit="cover" />
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
    console.log('카테고리 클릭:', categoryId);
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
              <Text style={styles.badgeText}>10+</Text>
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
          onPress={() => setActiveTab('피드')}>
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
        {/* 이벤트 배너 */}
        <EventBanner />

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
  // 이벤트 배너 스타일 (가로 슬라이드)
  eventBanner: {
    marginHorizontal: BANNER_SIDE_MARGIN,
    marginTop: 20,
    marginBottom: 50,
    borderRadius: 18,
    overflow: 'hidden',
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  eventBannerList: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    zIndex: 0,
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
    /** 하단바를 위로 늘린 만큼 캡션 기준도 맞춤 */
    paddingBottom: 60,
    justifyContent: 'flex-end',
    zIndex: 3,
    elevation: 6,
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
  eventBannerControlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 60,
    minHeight: 103,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 1,
    elevation: 2,
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
  // 독서 체력 섹션 스타일
  readingStaminaSection: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 45,
  },
  staminaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  staminaHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  staminaTitle: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
    lineHeight: 28,
  },
  staminaSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#777777',
    lineHeight: 20,
  },
  pageRangeContainer: {
    marginBottom: 12,
  },
  pageRangeContent: {
    gap: 10,
    paddingRight: 18,
  },
  pageRangeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 28,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageRangeButtonActive: {
    backgroundColor: '#222222',
  },
  pageRangeText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#555555',
  },
  pageRangeTextActive: {
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  descriptionAndCarouselWrapper: {
    backgroundColor: '#F3F8E8',
    borderRadius: 5,
    paddingTop: 8,
    paddingBottom: 0,
    paddingHorizontal: 0,
    marginTop: 4,
    marginBottom: 16,
    marginHorizontal: -20,
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  descriptionBox: {
    backgroundColor: 'transparent',
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginBottom: 0,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#222222',
    lineHeight: 20,
    textAlign: 'center',
  },
  carouselContainer: {
    height: 180,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  carouselContent: {
    alignItems: 'center',
  },
  bookCarouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  bookCarouselCover: {
    width: 100,
    height: 160,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedBookInfo: {
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 16,
    marginTop: -4,
  },
  selectedBookTitle: {
    fontSize: 14,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedBookAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedBookAuthor: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#777777',
    textAlign: 'center',
  },
  emptyState: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#777777',
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

