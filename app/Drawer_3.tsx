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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type BookshelfItem } from '../src/api/bookshelf';
import { searchBooks, type SearchBookItem } from '../src/api/search';
import AddToShelfModal from './AddToShelfModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로 (app 바로 아래에 있으므로 한 단계만 올라감)
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON = require('../assets/images/drawer/bell.png');
const BOOKSHELF_IMAGE = require('../assets/images/drawer/bookshelf.png');
const ADD_BOOK_ICON = require('../assets/images/drawer/addbook.png');
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

// 책 보석함 섹션 컴포넌트
function BookVaultSection() {
  const router = useRouter();
  const [currentShelfIndex, setCurrentShelfIndex] = useState(0);

  const handleAddBook = () => {
    router.push('/Drawer_3');
  };

  const handlePrev = () => {
    if (currentShelfIndex > 0) {
      setCurrentShelfIndex(currentShelfIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentShelfIndex < bookshelfImages.length - 1) {
      setCurrentShelfIndex(currentShelfIndex + 1);
    }
  };

  return (
    <View style={styles.vaultSection}>
      <View style={styles.vaultHeader}>
        <Text style={styles.vaultTitle}>당신의 소중한 책 보석함</Text>
        <TouchableOpacity
          style={styles.addBookButton}
          onPress={handleAddBook}
          activeOpacity={0.7}>
          <ExpoImage source={ADD_BOOK_ICON} style={styles.addBookIcon} contentFit="contain" />
        </TouchableOpacity>
      </View>

      <Text style={styles.vaultSubtitle}>
        읽고 있거나 읽을 예정인 책을 오른쪽 아이콘을 눌러 등록해보세요.{'\n'}
        아래 책장에 책이 하나 하나 쌓일거예요!
      </Text>

      <View style={styles.bookshelfContainer}>
        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowLeft]}
          onPress={handlePrev}
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={COLORS.SUBTITLE} />
        </TouchableOpacity>

        <View style={styles.bookshelfWrapper}>
          <ExpoImage
            source={bookshelfImages[currentShelfIndex]}
            style={styles.bookshelfImage}
            contentFit="contain"
          />
        </View>

        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowRight]}
          onPress={handleNext}
          activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
      </View>

      <View style={styles.pagination}>
        <TouchableOpacity
          style={styles.paginationDot}
          onPress={() => {
            router.push('/Drawer_1');
          }}
        />
        <TouchableOpacity
          style={[styles.paginationDot, styles.paginationDotActive]}
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

export default function AddBookScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('서랍장');
  const [activeNav, setActiveNav] = useState('투데이');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<SearchBookItem | null>(null);

  // 검색 실행
  useEffect(() => {
    if (searchText.trim()) {
      performSearch(searchText);
    } else {
      setSearchResults([]);
    }
  }, [searchText]);

  const performSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const res = await searchBooks(trimmed);
      setSearchResults(res.data.items);
    } catch (err) {
      console.error('[Drawer_3] 검색 실패:', err);
      Alert.alert('오류', '검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleBookSelect = (book: SearchBookItem) => {
    setSelectedBook(book);
    setIsModalVisible(true);
  };

  const handleAddedBook = (item: BookshelfItem) => {
    // 책 추가 성공 시 처리
    console.log('[Drawer_3] 책 추가됨:', item.title);
    setIsModalVisible(false);
    setSelectedBook(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Drawer_2와 동일한 배경 구조 */}
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
          onPress={() => setActiveTab('대독PICK')}>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <BookVaultSection />

        <View style={styles.bookSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>책 진도율</Text>
            <Text style={styles.sectionSubtitle}>진행 중인 책</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookList}>
            {sampleBooks.map((book) => (
              <View key={book.id} style={styles.bookCard}>
                <ExpoImage source={book.cover} style={styles.bookCover} contentFit="cover" />
                <Text style={styles.bookTitle} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {book.author}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${book.progress * 100}%` }]} />
                </View>
                <Text style={styles.bookPages}>
                  {book.currentPage}/{book.totalPages} 페이지
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

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
          onPress={() => setActiveNav('검색')}>
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

      {/* 반투명 어두운 오버레이 */}
      <View style={styles.overlay}>
        {/* 모달 다이얼로그 */}
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>내 책장에 담기</Text>
            <Text style={styles.modalDescription}>
              책장에 넣을 도서를 검색해 선택하세요.
            </Text>

            {/* 검색 입력창 */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.SUBTITLE} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="여름 언덕에서 배운 것"
                placeholderTextColor={COLORS.SUBTITLE}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
            </View>

            {/* 검색 결과 리스트 */}
            <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((book) => (
                  <TouchableOpacity
                    key={book.aladin_item_id}
                    style={styles.searchResultItem}
                    onPress={() => handleBookSelect(book)}
                    activeOpacity={0.7}>
                    <ExpoImage
                      source={{ uri: book.cover }}
                      style={styles.searchResultCover}
                      contentFit="cover"
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultTitle} numberOfLines={1}>
                        {book.title}
                      </Text>
                      <Text style={styles.searchResultMeta} numberOfLines={1}>
                        {book.author} | {book.publisher} | {book.pubDate}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : searchText.trim() ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>

          {/* 하단 버튼 */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 책 선택 모달 */}
      {selectedBook && (
        <AddToShelfModal
          visible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedBook(null);
          }}
          onSelectAndAdd={handleAddedBook}
        />
      )}
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
    right: -7,
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
    paddingBottom: 20,
  },
  vaultSection: {
    backgroundColor: COLORS.SECTION_BG,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
    marginTop: 0,
    minHeight: 280,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  bookshelfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
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
    height: 250,
    maxWidth: 400,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
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
    width: '100%',
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
    width: 40,
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
  // 모달 오버레이 및 다이얼로그 스타일
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 6, 6, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContent: {
    padding: 35,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginBottom: 28,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 0,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT,
  },
  addButton: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.BACKGROUND,
  },
  searchResultsContainer: {
    maxHeight: 300,
    marginTop: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  searchResultCover: {
    width: 48,
    height: 64,
    borderRadius: 4,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  searchResultMeta: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
});

