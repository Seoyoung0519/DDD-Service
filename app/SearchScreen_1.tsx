import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRecentBooks, getSearchSuggestions, type RecentBook } from '../src/api/search';
import { AppMenuButton } from '@/src/components/header/AppMenuButton';
import { NotificationBellButton } from '@/src/components/header/NotificationBellButton';
import { ProfileHeaderButton } from '@/src/components/header/ProfileHeaderButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
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
  SEARCH_CARD_BG: '#F8F8F8',
  SUGGESTION_BG: '#F0F0F0',
  BORDER: '#EEEEEE',
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
    android: 'Roboto',
    default: 'sans-serif',
  }),
  BOLD: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
};

// 자동완성 추천어 인터페이스
interface SuggestionItem {
  id: string;
  text: string;
}

export default function SearchScreen_1() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeNav, setActiveNav] = useState('검색');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 연관 검색어 불러오기
  useEffect(() => {
    const loadSuggestions = async () => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 1) {
        setSuggestions([]);
        return;
      }

      try {
        setLoadingSuggestions(true);
        const res = await getSearchSuggestions(trimmed);
        // title 배열을 SuggestionItem 배열로 변환
        const suggestionItems: SuggestionItem[] = res.data.items
          .slice(0, 10) // 최대 10개
          .map((title, index) => ({
            id: `suggestion-${index}`,
            text: title,
          }));
        setSuggestions(suggestionItems);
      } catch (error) {
        console.error('[SearchScreen] 연관 검색어 로딩 실패:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // 디바운싱: 입력 후 300ms 대기
    const timer = setTimeout(() => {
      loadSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 자동완성 필터링 (검색어가 있을 때만, 최대 5개)
  const filteredSuggestions = suggestions.slice(0, 5);

  // 텍스트 하이라이트 함수
  const renderHighlightedText = (text: string, searchQuery: string) => {
    if (!searchQuery) {
      return (
        <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
          {text}
        </Text>
      );
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return (
        <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
          {text}
        </Text>
      );
    }

    const beforeMatch = text.substring(0, index);
    const match = text.substring(index, index + searchQuery.length);
    const afterMatch = text.substring(index + searchQuery.length);

    return (
      <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
        <Text style={styles.suggestionTextGray}>{beforeMatch}</Text>
        <Text style={styles.suggestionTextHighlight}>{match}</Text>
        <Text style={styles.suggestionTextGray}>{afterMatch}</Text>
      </Text>
    );
  };

  // 최근 본 책 불러오기
  const loadRecentBooks = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const res = await getRecentBooks();
      setRecentBooks(res.data.items);
    } catch (error) {
      console.error('[SearchScreen] 최근 본 책 로딩 실패:', error);
      // 에러는 조용히 처리 (최근 책이 없어도 화면은 정상 동작)
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  // 페이지 포커스될 때마다 최근 본 책 새로고침
  useFocusEffect(
    useCallback(() => {
      loadRecentBooks();
    }, [loadRecentBooks])
  );

  // 검색 실행 핸들러
  const handleSearchSubmit = async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    try {
      setLoadingSearch(true);
      setSearchError(null);
      // 검색 결과 페이지로 네비게이션 (검색은 SearchResult에서 수행)
      router.push({
        pathname: '/SearchResult',
        params: { query: trimmed },
      });
    } catch (error) {
      console.error('[SearchScreen] 검색 실패:', error);
      setSearchError('검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handlePressSearchButton = () => {
    handleSearchSubmit(query);
  };

  const handlePressSuggestion = (suggestion: SuggestionItem) => {
    setQuery(suggestion.text);
    handleSearchSubmit(suggestion.text);
  };

  // 책 클릭 핸들러
  const handlePressBook = (book: RecentBook['book']) => {
    // 최근 검색 책을 클릭한 경우 중복 저장 방지를 위해 skipRecentBook=true 전달
    router.push({
      pathname: '/BookDetailScreen',
      params: { bookId: book.aladin_item_id, skipRecentBook: 'true' },
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

      {/* 메인 콘텐츠 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 검색 버튼 */}
        <View style={styles.searchButtonContainer}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handlePressSearchButton}
            activeOpacity={0.8}>
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>
        </View>

        {/* 검색 입력 + 자동완성 리스트 */}
        <View style={styles.searchCard}>
          {/* 검색 입력줄 */}
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.SUBTITLE} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="검색어를 입력하세요"
              placeholderTextColor={COLORS.PLACEHOLDER}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearchSubmit(query)}
              autoFocus={false}
              returnKeyType="search"
            />
            {loadingSearch && (
              <ActivityIndicator size="small" color={COLORS.PRIMARY} style={styles.loadingIndicator} />
            )}
          </View>

          {/* 자동완성 리스트 (검색어가 입력되었을 때만 표시) */}
          {query.trim().length > 0 && filteredSuggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {filteredSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handlePressSuggestion(item)}
                  activeOpacity={0.7}>
                  <Ionicons name="search" size={16} color={COLORS.PRIMARY} style={styles.suggestionIcon} />
                  {renderHighlightedText(item.text, query)}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 최근 검색 섹션 */}
        <View style={styles.recentSearchSection}>
          <View style={styles.recentSearchHeader}>
            <Text style={styles.recentSearchTitle}>최근 검색</Text>
            <TouchableOpacity onPress={() => router.push('/SearchScreen_2')} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY} />
            </TouchableOpacity>
          </View>

          {/* 최근 검색 책 가로 리스트 */}
          {loadingRecent ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            </View>
          ) : recentBooks.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentSearchList}
              contentContainerStyle={styles.recentSearchListContent}>
              {recentBooks.map((item, index) => (
                <TouchableOpacity
                  key={`${item.book.id}-${item.created_at}-${index}`}
                  style={styles.recentSearchCard}
                  onPress={() => handlePressBook(item.book)}
                  activeOpacity={0.7}>
                  <ExpoImage
                    source={{ uri: item.book.thumbnail_url }}
                    style={styles.recentSearchCover}
                    contentFit="cover"
                    placeholder={BOOK1_COVER}
                  />
                  <Text style={styles.recentSearchBookTitle} numberOfLines={2}>
                    {item.book.title}
                  </Text>
                  <Text style={styles.recentSearchAuthor} numberOfLines={1}>
                    {item.book.authors.join(', ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>최근에 본 책이 없어요</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 스크롤 뷰
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  // 검색 버튼
  searchButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  searchButton: {
    height: 40,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 검색 카드
  searchCard: {
    backgroundColor: COLORS.SEARCH_CARD_BG,
    borderRadius: 24,
    paddingVertical: 8,
    marginTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#F8F8F8',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  // 자동완성 리스트
  suggestionsList: {
    marginTop: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    paddingLeft: 20,
    backgroundColor: 'transparent',
  },
  suggestionIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  suggestionTextGray: {
    color: '#555555',
  },
  suggestionTextHighlight: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
  },
  // 최근 검색 섹션
  recentSearchSection: {
    marginTop: 32,
  },
  recentSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentSearchTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  // 최근 검색 리스트
  recentSearchList: {
    marginTop: 0,
    marginBottom: 20,
  },
  recentSearchListContent: {
    paddingRight: 15,
    paddingBottom: 10,
  },
  recentSearchCard: {
    width: 110,
    marginRight: 15,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: 10,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },
  recentSearchCover: {
    width: '95%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentSearchBookTitle: {
    fontSize: 14,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  recentSearchAuthor: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
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

