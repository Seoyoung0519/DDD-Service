import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { getBookDetail, type BookDetailResponse } from '../src/api/search';

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

// 리뷰 아이템 타입 정의
interface ReviewItem {
  id: string;
  nickname: string; // 닉네임 (ex. "비를 맞는 바나나_56266")
  roleLabel: string; // '포스트' 같은 라벨
  profileImageUrl?: string;
  bookCoverUrl: string;
  title: string; // 리뷰 제목 한 줄
  content: string; // 리뷰 본문 (여러 줄)
}

// 더미 데이터
const DUMMY_BOOK: BookDetail = {
  id: '1',
  title: '용의자 X의 헌신',
  subTitle: '멈출 수 없는 완벽한 몰입감',
  authors: ['히가시노 게이고 지음', '양억관 옮김'],
  publisher: '재인',
  publishedDate: '2022.06.16',
  category: '재인·소설',
  coverUrl: '',
  description:
    '히가시노 게이고의 대표작으로 평가받는 <용의자 X의 헌신>이 새롭게 번역되었다. 번역가 양억관은 원작의 문학적 감수성과 감동을 온전히 살리기 위해 번역을 세심하게 다듬었다. 이 작품은 히가시노 게이고의 장편 추리소설로, 그의 대표작 중 하나다. 출간 당년 <주간문춘미스터리 베스트 10> 1위를 차지했고, 이듬해 <본격 미스터리 대상>과 <이 미스터리가 대단하다!>에서도 1위를 기록했다.',
  authorDescription:
    '히가시노 게이고는 일본의 대표적인 작가로, 1958년 오사카에서 태어났다. 오사카부립대학 전기공학과를 졸업한 후 엔지니어로 일하다가, 여가 시간에 소설을 쓰기 시작해 전업 작가가 되었다. 1985년 <방과후>로 에도가와 란포상을 수상했고, 1999년 <비밀>로 일본추리작가협회상을 수상했다. 2006년에는 <용의자 X의 헌신>으로 제134회 나오키상과 본격 미스터리 대상을 수상했으며, 이 작품은 탐정 갈릴레오 시리즈의 세 번째 작품이다. 2012년에는 <나미야 잡화점의 기적>을 발표했다.',
  publisherReview:
    '2005년 <주간문춘미스터리 베스트 10> 1위\n2006년 제 134회 나오키상 수상, <본격 미스터리 대상> 1위, <이 미스터리가 대단하다> 1위\n2008년 일본에서 영화화 (후쿠야마 마사하루 주연, 그해 개봉한 일본 영화 중 흥행 수입 3위)',
};

// 리뷰 더미 데이터
const dummyReviews: ReviewItem[] = [
  {
    id: '1',
    nickname: '비를 맞는 바나나_56266',
    roleLabel: '포스트',
    bookCoverUrl: '',
    title: '헌신적 사랑',
    content:
      '일본의 대표 추리소설 작가 히가시노 게이고의 명작입니다. 이 책을 읽으면서 마치 영화를 보는 것 같은 몰입감을 느꼈습니다. 특히 마지막 반전은 정말 놀라웠어요. 수학 천재와 물리학 교수의 대결이 인상 깊었습니다.',
  },
  {
    id: '2',
    nickname: '지혜로운 왁파고',
    roleLabel: '포스트',
    bookCoverUrl: '',
    title: '추억의 명작, 추억속 명작',
    content:
      '초등학생 때 처음으로 두서의 재미를 느낀 작품입니다. 그때의 반전에 놀랐던 기억이 아직도 생생합니다. 시간이 지나 다시 읽어보니 또 다른 감동을 느낄 수 있었어요. 정말 추천하고 싶은 작품입니다.',
  },
  {
    id: '3',
    nickname: '코딩하는 개발자',
    roleLabel: '포스트',
    bookCoverUrl: '',
    title: '완벽한 논리와 감동의 조화',
    content:
      '추리소설의 완성도를 보여주는 작품이라고 생각합니다. 논리적이고 치밀한 전개와 함께 인간적인 감동까지 담고 있어서 정말 훌륭한 작품입니다. 히가시노 게이고 작가의 다른 작품들도 읽어보고 싶어졌어요.',
  },
  {
    id: '4',
    nickname: '책을 사랑하는 사람',
    roleLabel: '포스트',
    bookCoverUrl: '',
    title: '다시 읽어도 좋은 작품',
    content:
      '이미 여러 번 읽었지만 다시 읽어도 재미있습니다. 매번 새로운 부분을 발견하게 되고, 캐릭터들의 심리 묘사가 정말 뛰어나다고 생각합니다. 추리소설을 좋아하는 분들에게 강력 추천합니다.',
  },
  {
    id: '5',
    nickname: '독서광',
    roleLabel: '포스트',
    bookCoverUrl: '',
    title: '명작의 이유',
    content:
      '왜 이 작품이 명작인지 알 수 있었습니다. 단순한 추리소설이 아니라 인간의 감정과 논리의 조화를 보여주는 작품이에요. 특히 마지막 장면은 정말 인상 깊었습니다.',
  },
];

type TabKey = 'overview' | 'reviews';

export default function BookDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId?: string; book?: string; skipRecentBook?: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [activeNav, setActiveNav] = useState('투데이');
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isAuthorExpanded, setIsAuthorExpanded] = useState(false);
  const [isPublisherExpanded, setIsPublisherExpanded] = useState(false);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // 도서 데이터 로드
  useEffect(() => {
    const loadBookDetail = async () => {
      const bookId = params.bookId;
      if (!bookId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // skipRecentBook이 true인 경우 최근 본 책 저장을 건너뛰도록 파라미터 전달
        const response = await getBookDetail(bookId, params.skipRecentBook === 'true');
        const transformedBook = transformBookData(response.data);
        setBook(transformedBook);
      } catch (error: any) {
        console.error('[BookDetailScreen] 도서 상세 로드 실패:', error);
        setError('도서 정보를 불러오는데 실패했습니다.');
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    loadBookDetail();
  }, [params.bookId, params.skipRecentBook]);

  // 뒤로가기 핸들러
  const handlePressBack = () => {
    router.back();
  };

  // 공유 핸들러
  const handlePressShare = () => {
    // TODO: 공유 기능 구현
    console.log('[BookDetail] 공유 버튼 클릭');
  };

  // 내서재에 담기 핸들러
  const handleAddToShelf = () => {
    if (!book) return;
    Alert.alert('내서재에 담기', '이 책을 내서재에 추가하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '추가',
        onPress: () => {
          // TODO: 내서재 API 연동
          console.log('[BookDetail] 내서재에 추가:', book.id);
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

  // 리뷰 관련 핸들러
  const handlePressReviewMore = (item: ReviewItem) => {
    // TODO: 리뷰 더보기 옵션 메뉴 표시
    console.log('[BookDetail] 리뷰 더보기:', item.id);
  };

  const handlePressReviewBookCover = (item: ReviewItem) => {
    // TODO: 리뷰의 책 표지 클릭 시 동작 (예: 책 상세로 이동)
    console.log('[BookDetail] 리뷰 책 표지 클릭:', item.id);
  };

  const handlePressSeeMore = (item: ReviewItem) => {
    // TODO: 리뷰 상세 페이지로 이동
    console.log('[BookDetail] 리뷰 자세히 보기:', item.id);
  };

  // 리뷰 섹션 렌더링
  // 리뷰 카드 컴포넌트
  const ReviewCard = ({ item }: { item: ReviewItem }) => {
    return (
      <View style={styles.reviewCardContainer}>
        {/* 상단 사용자 정보 행 */}
        <View style={styles.reviewUserRow}>
          <View style={styles.reviewUserLeft}>
            {/* 프로필 이미지 */}
            <View style={styles.reviewProfileImage}>
              {item.profileImageUrl ? (
                <ExpoImage
                  source={{ uri: item.profileImageUrl }}
                  style={styles.reviewProfileImageInner}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={16} color="#999" />
              )}
            </View>
            {/* 닉네임 + 라벨 */}
            <View style={styles.reviewUserInfo}>
              <Text style={styles.reviewNickname}>{item.nickname}</Text>
              <Text style={styles.reviewRoleLabel}>{item.roleLabel}</Text>
            </View>
          </View>
          {/* 우측 더보기 버튼 */}
          <TouchableOpacity
            onPress={() => handlePressReviewMore(item)}
            style={styles.reviewMoreButton}
            activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {/* 중간 책 이미지 영역 */}
        <TouchableOpacity
          onPress={() => handlePressReviewBookCover(item)}
          style={styles.reviewBookImageContainer}
          activeOpacity={0.8}>
          <View style={styles.reviewBookImageWrapper}>
            {item.bookCoverUrl || book?.coverUrl ? (
              <ExpoImage
                source={{ uri: item.bookCoverUrl || book?.coverUrl || '' }}
                style={styles.reviewBookImage}
                contentFit="contain"
                placeholder={BOOK1_COVER}
              />
            ) : (
              <Image source={BOOK1_COVER} style={styles.reviewBookImage} resizeMode="contain" />
            )}
          </View>
        </TouchableOpacity>

        {/* 하단 리뷰 텍스트 + 자세히 보기 */}
        <View style={styles.reviewTextSection}>
          <Text style={styles.reviewTitle}>{item.title}</Text>
          <Text style={styles.reviewContent} numberOfLines={4}>
            {item.content}
          </Text>
          <TouchableOpacity
            onPress={() => handlePressSeeMore(item)}
            style={styles.reviewSeeMoreButton}
            activeOpacity={0.7}>
            <Text style={styles.reviewSeeMoreText}>자세히 보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReviewsTab = () => {
    return (
      <View style={styles.reviewTabContainer}>
        <FlatList
          data={dummyReviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReviewCard item={item} />}
          contentContainerStyle={styles.reviewListContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // 외부 ScrollView가 스크롤 처리
        />
      </View>
    );
  };


  // 책소개 탭 렌더링
  const renderOverviewTab = () => {
    if (!book) return null;
    
    return (
      <View style={styles.tabContent}>
        {/* 책소개 블록 */}
        <View style={styles.contentBlock}>
          <Text style={styles.blockTitle}>책소개</Text>
          <Text
            style={styles.blockText}
            numberOfLines={isOverviewExpanded ? undefined : 4}
            ellipsizeMode="tail">
            {book.description}
          </Text>
          <TouchableOpacity onPress={toggleOverview} style={styles.moreButton}>
            <Text style={styles.moreButtonText}>{isOverviewExpanded ? '접기' : '더보기'}</Text>
          </TouchableOpacity>
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
                    리뷰(342)
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
          onPress={handleAddToShelf}
          activeOpacity={0.7}>
          <Ionicons name="library-outline" size={20} color={COLORS.TEXT} style={styles.buttonIcon} />
          <Text style={styles.bottomButtonLeftText}>내서재에 담기</Text>
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
  reviewMoreButton: {
    padding: 4,
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
  reviewSeeMoreButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reviewSeeMoreText: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#666',
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

