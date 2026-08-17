import { fetchCurrentReadingBooks } from '@/src/api/reading';
import type { CurrentReadingItem } from '@/src/types/reading';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
import { APP_FONTS } from '@/src/theme/fonts';
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';
import { AppMenuButton } from '@/src/components/header/AppMenuButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON_HEADER = require('../assets/images/drawer/bell.png');

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  PRIMARY_GREEN: '#4CAF50',
  TEXT: '#222',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  CARD_BG: '#F5F5F5',
  BORDER: '#EAEAEA',
  GRAY: '#999',
  LIGHT_GRAY: '#CCCCCC',
  BUTTON_GREEN: '#4CAF50',
  BUTTON_TEXT: '#FFFFFF',
  MODAL_OVERLAY: 'rgba(0, 0, 0, 0.7)',
  MODAL_BG: '#FFFFFF',
  BUTTON_BORDER: '#000000',
  BUTTON_DISABLED: '#E0E0E0',
  BUTTON_DISABLED_TEXT: '#999999',
  PROGRESS_BG: '#E0E0E0',
  PROGRESS_FILL: '#2C8C55',
};

// 폰트 패밀리
const FONTS = APP_FONTS;

export default function ReadingSession_2() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedBook?: string }>();
  const [activeNav, setActiveNav] = useState('책읽기');
  const [modalVisible, setModalVisible] = useState(true);
  const [readingBooks, setReadingBooks] = useState<CurrentReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<CurrentReadingItem | null>(null);

  // 화면 진입 시 API 호출 또는 params에서 선택된 책 가져오기
  useEffect(() => {
    const loadBooks = async () => {
      try {
        // params에서 선택된 책이 있으면 그걸 사용
        if (params.selectedBook) {
          try {
            const parsedBook = JSON.parse(params.selectedBook) as CurrentReadingItem;
            setSelectedBook(parsedBook);
          } catch (e) {
            console.error('[RS2] 파싱 실패');
          }
        }

        // API에서 현재 읽는 책 목록 가져오기
        const books = await fetchCurrentReadingBooks();
        setReadingBooks(books);
      } catch (error: any) {
        console.error('[RS2] 목록 불러오기 실패');
        Alert.alert('오류', error?.message || '책 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [params.selectedBook]);

  const handleClose = () => {
    setModalVisible(false);
    router.replace('/ReadingSession_1');
  };

  const handleNext = () => {
    if (!selectedBook) return;
    router.replace({
      pathname: '/ReadingSession_4',
      params: {
        selectedBook: JSON.stringify(selectedBook),
        bookPickSource: 'ReadingSession_2',
      },
    });
  };

  const handleSelectBook = (book: CurrentReadingItem) => {
    // 이미 선택된 책을 다시 클릭하면 선택 해제
    if (selectedBook?.userBookId === book.userBookId) {
      setSelectedBook(null);
    } else {
      setSelectedBook(book);
    }
  };

  // authors 배열을 문자열로 변환
  const formatAuthors = (authors: string[] | string | null): string => {
    if (!authors) return '';
    if (typeof authors === 'string') return authors;
    return authors.join(', ');
  };

  /** 로딩 중에도 읽을 책 PICK 카드만 유지하고, 카드 안에서 목록을 불러옵니다. */
  if (loading) {
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>읽을 책 PICK</Text>
            <View style={styles.modalHeaderButtons}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}>
                <Text style={styles.closeButtonText}>이전</Text>
              </TouchableOpacity>
              <View style={[styles.nextButton, styles.nextButtonDisabled]}>
                <Text style={[styles.nextButtonText, styles.nextButtonTextDisabled]}>다음</Text>
              </View>
            </View>
          </View>
          <Text style={styles.subtitle}>현재 독서 중인 책</Text>
          <View style={styles.pickLoadingBody}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        </View>
      </View>
    );
  }

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
            <ExpoImage source={BELL_ICON_HEADER} style={styles.bellIcon} contentFit="contain" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>0</Text>
            </View>
          </TouchableOpacity>
          <AppMenuButton style={styles.headerIconButton} iconColor={COLORS.TEXT} />
        </View>
      </View>

      {/* 회색 바 */}
      <View style={styles.divider} />

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>대독단과 </Text>
            <Text style={styles.titleTextGreen}>독서</Text>
            <Text style={styles.titleText}>하기</Text>
          </View>
        </View>
      </View>

      {/* 모달 팝업 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>읽을 책 PICK</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <Text style={styles.closeButtonText}>이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    !selectedBook && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!selectedBook}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.nextButtonText,
                      !selectedBook && styles.nextButtonTextDisabled,
                    ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 부제목 */}
            <Text style={styles.subtitle}>현재 독서 중인 책</Text>

            {/* 책 목록 */}
            {readingBooks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>독서 중인 책이 없습니다.</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.bookList}
                contentContainerStyle={styles.bookListContent}
                showsVerticalScrollIndicator={false}>
                {readingBooks.map((book) => {
                  const isSelected = selectedBook?.userBookId === book.userBookId;
                  const authors = formatAuthors(book.authors);
                  const progress = book.progress || 0;
                  const currentPage = book.currentPage || 0;
                  const pageCount = book.pageCount || 0;

                  return (
                    <TouchableOpacity
                      key={book.userBookId}
                      style={[
                        styles.bookCard,
                        isSelected && styles.bookCardSelected,
                      ]}
                      onPress={() => handleSelectBook(book)}
                      activeOpacity={0.7}>
                      {/* 책 커버 */}
                      <View style={styles.bookCoverContainer}>
                        {book.coverUrl ? (
                          <ExpoImage
                            source={{ uri: book.coverUrl }}
                            style={styles.bookCoverImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.bookCoverPlaceholder}>
                            <Text style={styles.bookCoverText}>
                              {book.title.substring(0, 2)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 책 정보 */}
                      <View style={styles.bookInfo}>
                        <Text style={styles.bookTitle} numberOfLines={1}>
                          {book.title}
                        </Text>
                        {authors && (
                          <Text style={styles.bookAuthor} numberOfLines={1}>
                            {authors}
                          </Text>
                        )}

                        {/* 진행률 바 */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progress}%` },
                              ]}
                            />
                          </View>
                        </View>

                        {/* 페이지 수 */}
                        {pageCount > 0 && (
                          <Text style={styles.pageCount}>
                            {currentPage}/{pageCount} 페이지
                          </Text>
                        )}
                      </View>

                      {/* 선택 원 */}
                      <View style={styles.radioContainer}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 하단 네비게이션 바 */}
      <AppBottomNavBar>
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
            // 현재 페이지이므로 이동하지 않음
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
    minHeight: 65,
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
    color: COLORS.BUTTON_TEXT,
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  titleSection: {
    paddingHorizontal: 0,
    paddingTop: 0,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  titleTextGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.PRIMARY_GREEN,
    fontFamily: FONTS.BOLD,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenLoading: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickLoadingBody: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.MODAL_BG,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    flex: 1,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BUTTON_BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  nextButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.BUTTON_DISABLED,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.BUTTON_TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  nextButtonTextDisabled: {
    color: COLORS.BUTTON_DISABLED_TEXT,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    marginBottom: 16,
  },
  bookList: {
    maxHeight: 400,
  },
  bookListContent: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bookCardSelected: {
    borderColor: COLORS.PRIMARY,
  },
  bookCoverContainer: {
    marginRight: 12,
  },
  bookCoverPlaceholder: {
    width: 60,
    height: 80,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.PROGRESS_BG,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PROGRESS_FILL,
    borderRadius: 3,
  },
  pageCount: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.PRIMARY,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
  bottomNav: {
    flexDirection: 'row',
    minHeight: 100,
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
    tintColor: COLORS.GRAY,
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
  bookCoverImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
});

