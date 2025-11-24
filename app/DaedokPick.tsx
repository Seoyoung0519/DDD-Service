import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON = require('../assets/images/drawer/bell.png');

// 이벤트 배너 이미지 배열 (나중에 여러 이미지 추가 가능)
const EVENT_BANNERS = [
  require('../assets/images/daedokPick/이벤트.png'),
  // TODO: 추가 이벤트 배너 이미지
];

// 이벤트 배너 데이터
interface EventBannerData {
  id: string;
  image: any;
  subtitle: string;
  title: string;
  description: string;
}

const eventBannersData: EventBannerData[] = [
  {
    id: '1',
    image: EVENT_BANNERS[0],
    subtitle: '주말엔 글쓰고',
    title: '100만 원 받기!',
    description: '9월 창작 지원 프로젝트 "이달의 밀크"',
  },
  // TODO: 추가 이벤트 배너 데이터
];

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

// 이벤트 배너 컴포넌트
function EventBanner({ onPress }: { onPress: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 자동 슬라이드 (3초마다)
  useEffect(() => {
    if (!isPaused && eventBannersData.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % eventBannersData.length);
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const currentBanner = eventBannersData[currentIndex] || eventBannersData[0];

  return (
    <TouchableOpacity
      style={styles.eventBanner}
      onPress={onPress}
      activeOpacity={0.9}>
      <ImageBackground
        source={currentBanner.image}
        style={styles.eventBannerImage}
        imageStyle={styles.eventBannerImageStyle}
        resizeMode="cover">
        <View style={styles.eventBannerGradient}>
          <View style={styles.eventBannerContent}>
            <Text style={styles.eventBannerSubtitle}>{currentBanner.subtitle}</Text>
            <Text style={styles.eventBannerTitle}>{currentBanner.title}</Text>
            <Text style={styles.eventBannerDescription}>
              {currentBanner.description}
            </Text>
          </View>
          <View style={styles.eventBannerControls}>
            <TouchableOpacity style={styles.playButton} onPress={handlePause}>
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <View style={styles.slideIndicator}>
              <Text style={styles.slideIndicatorText}>
                {currentIndex + 1}/{eventBannersData.length}+
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// 랭킹 섹션 컴포넌트
function RankingSection() {
  const router = useRouter();

  return (
    <View style={styles.rankingSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabelGreen}>대독</Text>
            <Text style={styles.sectionLabelBlack}>랭킹</Text>
            <Text style={styles.dateLabel}>2025.09.17기준</Text>
          </View>
          <Text style={styles.rankingDescription}>
            온라인 서점 50위 내 베스트셀러를 대독단에서 조회해보고 대독단과 함께 독서해요.
          </Text>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
      </View>

      <View style={styles.rankingList}>
        {rankedBooks.map((book) => (
          <TouchableOpacity key={book.id} style={styles.rankingItem} activeOpacity={0.7}>
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
        ))}
      </View>
    </View>
  );
}

// Pick 영상 섹션 컴포넌트
function PickVideoSection() {
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
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
      </View>

      <View style={styles.videoCarousel}>
        {/* 왼쪽 이미지 */}
        <TouchableOpacity style={styles.videoCarouselSide} activeOpacity={0.7}>
          <ExpoImage
            source={require('../assets/images/daedokPick/daedokpick_2.png')}
            style={styles.videoCarouselSideImage}
            contentFit="cover"
          />
          <View style={styles.videoCarouselArrowLeft}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* 가운데 메인 이미지 */}
        <TouchableOpacity style={styles.videoCarouselMain} activeOpacity={0.9}>
          <ExpoImage
            source={require('../assets/images/daedokPick/bookpick_1.png')}
            style={styles.videoCarouselMainImage}
            contentFit="cover"
          />
          <View style={styles.videoPlayOverlay}>
            <View style={styles.videoPlayButton}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.videoDuration}>
            <Text style={styles.videoDurationText}>37:19</Text>
          </View>
        </TouchableOpacity>

        {/* 오른쪽 이미지 */}
        <TouchableOpacity style={styles.videoCarouselSide} activeOpacity={0.7}>
          <ExpoImage
            source={require('../assets/images/daedokPick/daedokpick_3.png')}
            style={styles.videoCarouselSideImage}
            contentFit="cover"
          />
          <View style={styles.videoCarouselArrowRight}>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>
          독서 모임하기 좋은 드라마&영화의 원작 소설 BEST4
        </Text>
        <Text style={styles.videoDescription}>
          '이 드라마 보셨어요?' 말하며 꺼내기 좋은 그 책!!
        </Text>
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

  const handleEventBanner = () => {
    console.log('이벤트 배너 클릭');
  };

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
        scrollEventThrottle={16}>
        {/* 이벤트 배너 */}
        <EventBanner onPress={handleEventBanner} />

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
          onPress={() => setActiveNav('내서재')}>
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
  // 이벤트 배너 스타일
  eventBanner: {
    marginHorizontal: 17,
    marginTop: 20,
    marginBottom: 50,
    borderRadius: 18,
    overflow: 'hidden',
    height: 260,
  },
  eventBannerImage: {
    width: '100%',
    height: '100%',
  },
  eventBannerImageStyle: {
    borderRadius: 18,
  },
  eventBannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  eventBannerContent: {
    marginBottom: 12,
  },
  eventBannerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#FFFFFF',
    marginBottom: 4,
    opacity: 0.9,
  },
  eventBannerTitle: {
    fontSize: 24,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  eventBannerDescription: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  eventBannerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 14,
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
    fontSize: 16,
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
  videoInfo: {
    marginTop: 16,
  },
  videoTitle: {
    fontSize: 15,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 6,
    lineHeight: 22,
  },
  videoDescription: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 14,
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

