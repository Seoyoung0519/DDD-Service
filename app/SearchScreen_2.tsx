import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  clearRecentBooks,
  clearRecentQueries,
  deleteRecentBook,
  deleteRecentQuery,
  getRecentBooks,
  getRecentQueries,
  searchBooks,
  type RecentBook,
  type RecentQuery
} from '../src/api/search';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON = require('../assets/images/drawer/bell.png');
const BOOK1_COVER = require('../assets/images/drawer/book1.png');
const BOOK2_COVER = require('../assets/images/drawer/book2.png');

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#777777',
  PLACEHOLDER: '#CCCCCC',
  BACKGROUND: '#FFFFFF',
  INFO_BG: '#F7F7F7',
  INFO_TEXT: '#888888',
  DATE_TEXT: '#555555',
  BORDER: '#EEEEEE',
  CARD_BORDER: '#F0F0F0',
  GRAY: '#888',
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

// 날짜 포맷팅 함수 (YYYY.MM.DD)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch (error) {
    console.error('[SearchScreen_2] 날짜 포맷팅 실패:', error);
    return dateString;
  }
};

// 검색 내역 아이템 타입
interface HistoryKeywordItem extends RecentQuery {
  type: 'keyword';
}

interface HistoryBookItem {
  type: 'book';
  created_at: string;
  book: RecentBook['book'];
}

type HistoryItem = HistoryKeywordItem | HistoryBookItem;

// 검색 내역 섹션 인터페이스
interface HistorySection {
  date: string; // '2025.09.22'
  data: HistoryItem[];
}

export default function SearchScreen_2() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('검색');
  const [sections, setSections] = useState<HistorySection[]>([]);
  const [loading, setLoading] = useState(false);

  // 데이터 로딩
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [recentQueriesRes, recentBooksRes] = await Promise.all([
        getRecentQueries(),
        getRecentBooks(),
      ]);

      const keywordItems: HistoryKeywordItem[] = recentQueriesRes.data.items.map((q: RecentQuery) => ({
        ...q,
        type: 'keyword' as const,
      }));

      const bookItems: HistoryBookItem[] = recentBooksRes.data.items.map((item: RecentBook) => ({
        type: 'book' as const,
        created_at: item.created_at,
        book: item.book,
      }));

      // 둘을 하나의 배열로 합쳐 created_at 기준 내림차순 정렬
      const allItems: HistoryItem[] = [...keywordItems, ...bookItems].sort((a, b) => {
        const aDate = a.created_at;
        const bDate = b.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // 날짜별 그룹핑 (YYYY.MM.DD)
      const grouped: Record<string, HistoryItem[]> = {};
      allItems.forEach((item) => {
        const dateKey = formatDate(item.created_at);
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(item);
      });

      const sections: HistorySection[] = Object.entries(grouped)
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, items]) => ({ date, data: items }));

      setSections(sections);
    } catch (error) {
      console.error('[SearchScreen_2] 검색 내역 로딩 실패:', error);
      // 에러는 조용히 처리
    } finally {
      setLoading(false);
    }
  };

  // 단일 항목 삭제 핸들러
  const handleRemoveItem = async (item: HistoryItem) => {
    try {
      if (item.type === 'book') {
        await deleteRecentBook(item.book.id);
      } else {
        await deleteRecentQuery(item.query);
      }
      // 삭제 후 다시 로드
      await loadHistory();
    } catch (error) {
      console.error('[SearchScreen_2] 항목 삭제 실패:', error);
    }
  };

  // 아이템 클릭 핸들러
  const handlePressHistoryItem = async (item: HistoryItem) => {
    try {
      if (item.type === 'book') {
        // 최근 검색 책을 클릭한 경우 중복 저장 방지를 위해 skipRecentBook=true 전달
        router.push({
          pathname: '/BookDetailScreen',
          params: { bookId: item.book.aladin_item_id, skipRecentBook: 'true' },
        });
      } else {
        // 검색어로 다시 검색
        // TODO: router.push('/SearchScreen_1', { initialQuery: item.query });
        // 또는 바로 검색 실행
        await searchBooks(item.query);
        router.back();
      }
    } catch (error) {
      console.error('[SearchScreen_2] 항목 클릭 처리 실패:', error);
    }
  };

  // 뒤로가기 핸들러
  const handlePressBack = () => {
    router.back();
  };

  // 전체 삭제 핸들러
  const handleDeleteAll = () => {
    Alert.alert('전체 삭제', '모든 최근 검색 내역을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all([clearRecentQueries(), clearRecentBooks()]);
            setSections([]);
          } catch (error) {
            console.error('[SearchScreen_2] 전체 삭제 실패:', error);
          }
        },
      },
    ]);
  };

  // 섹션 헤더 렌더링
  const renderSectionHeader = ({ section }: { section: HistorySection }) => {
    if (!section || !section.date) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.date}</Text>
      </View>
    );
  };

  // 도서 카드 렌더링
  const renderBookCard = (item: HistoryBookItem) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handlePressHistoryItem(item)}
      activeOpacity={0.7}>
      <ExpoImage
        source={{ uri: item.book.thumbnail_url }}
        style={styles.bookCardCover}
        contentFit="cover"
        placeholder={BOOK1_COVER}
      />
      <View style={styles.bookCardContent}>
        <Text style={styles.bookCardTitle} numberOfLines={2}>
          {item.book.title}
        </Text>
        {item.book.authors && item.book.authors.length > 0 && (
          <Text style={styles.bookCardSubtitle} numberOfLines={1}>
            {item.book.authors.join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation();
          handleRemoveItem(item);
        }}
        activeOpacity={0.7}>
        <Ionicons name="close" size={18} color={COLORS.SUBTITLE} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // 키워드 행 렌더링
  const renderKeywordRow = (item: HistoryKeywordItem) => (
    <TouchableOpacity
      style={styles.keywordRow}
      onPress={() => handlePressHistoryItem(item)}
      activeOpacity={0.7}>
      <Ionicons name="search" size={18} color={COLORS.SUBTITLE} style={styles.keywordIcon} />
      <Text style={styles.keywordText} numberOfLines={1}>
        {item.query}
      </Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation();
          handleRemoveItem(item);
        }}
        activeOpacity={0.7}>
        <Ionicons name="close" size={18} color={COLORS.SUBTITLE} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // 아이템 렌더링
  const renderItem = ({ item }: { item: HistoryItem }) => {
    if (!item) return null;
    if (item.type === 'book') {
      return renderBookCard(item);
    } else {
      return renderKeywordRow(item);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handlePressBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>최근 검색</Text>
        <TouchableOpacity
          style={styles.deleteAllButton}
          onPress={handleDeleteAll}
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={22} color={COLORS.TEXT} />
        </TouchableOpacity>
      </View>

      {/* 안내 텍스트 박스 */}
      <View style={styles.infoBox}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoIconText}>i</Text>
        </View>
        <Text style={styles.infoText}>최근 검색 조회는 30일동안 최대 100개까지 보관됩니다.</Text>
      </View>

      {/* 검색 내역 리스트 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <SectionList
          sections={sections || []}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item, index) => {
            if (item.type === 'book') {
              return `book-${item.book.id}-${index}`;
            } else {
              return `keyword-${item.query}-${index}`;
            }
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>검색 내역이 없습니다.</Text>
            </View>
          }
        />
      )}

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
            style={[
              styles.navIcon,
              activeNav === '투데이' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, activeNav === '투데이' && styles.navLabelActive]}>
            투데이
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('책읽기');
          }}>
          <Image
            source={READING_ICON}
            style={[
              styles.navIcon,
              activeNav === '책읽기' && { tintColor: COLORS.PRIMARY },
            ]}
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
          }}>
          <Image
            source={SEARCH_ICON}
            style={[
              styles.navIcon,
              activeNav === '검색' && { tintColor: COLORS.PRIMARY },
            ]}
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
            style={[
              styles.navIcon,
              activeNav === '내서재' && { tintColor: COLORS.PRIMARY },
            ]}
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: '600',
    color: COLORS.TEXT,
    flex: 1,
    textAlign: 'center',
  },
  deleteAllButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 안내 텍스트 박스
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.INFO_BG,
    borderRadius: 8,
    gap: 8,
  },
  infoIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.INFO_TEXT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: {
    fontSize: 12,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.BACKGROUND,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.INFO_TEXT,
    lineHeight: 18,
  },
  // 리스트 컨텐츠
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  // 섹션 헤더
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: '600',
    color: COLORS.DATE_TEXT,
  },
  // 도서 카드
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  bookCardCover: {
    width: 48,
    height: 68,
    borderRadius: 4,
    marginRight: 12,
  },
  bookCardContent: {
    flex: 1,
    marginRight: 8,
  },
  bookCardTitle: {
    fontSize: 15,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
    lineHeight: 20,
  },
  bookCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#999999',
    lineHeight: 18,
  },
  // 키워드 행
  keywordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
  },
  keywordIcon: {
    marginRight: 10,
  },
  keywordText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.REGULAR,
    color: COLORS.DATE_TEXT,
  },
  // 삭제 버튼
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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

