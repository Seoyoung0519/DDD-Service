import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppMenuButton } from '@/src/components/header/AppMenuButton';
import { hasPendingCommuteReadingRecommend } from '@/src/state/commuteReadingRecommend';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON_HEADER = require('../assets/images/drawer/bell.png');
const BOOKSHELF_ICON = require('../assets/images/reading_session/bookshelf-load.png');
const READING_BOOK_ICON = require('../assets/images/reading_session/독서중 불러오기.png');

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

export default function ReadingSession_1() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hidePickModal?: string }>();
  const [activeNav, setActiveNav] = useState('책읽기');
  const [modalVisible, setModalVisible] = useState(() => params.hidePickModal !== '1');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  /** 통근 분량 추천 진입 시 — PICK 모달을 띄우지 않아 메인 독서 화면이 보이게 */
  useEffect(() => {
    if (params.hidePickModal === '1') {
      setModalVisible(false);
    }
  }, [params.hidePickModal]);

  /** 경로 결과 → 책읽기로 온 뒤, 분량 추천 모달을 그 위에 표시 */
  useEffect(() => {
    if (!hasPendingCommuteReadingRecommend()) return;
    const t = setTimeout(() => {
      router.push('/CommuteReadingRecommendScreen');
    }, 0);
    return () => clearTimeout(t);
  }, [router]);

  const handleClose = () => {
    setModalVisible(false);
    router.push('/ReadingIntroScreen');
  };

  const handleNext = () => {
    if (selectedOption === 'bookshelf') {
      // 책장에서 불러오기 — PICK 화면이 스택에 남지 않도록 replace (뒤에 겹쳐 보이지 않게)
      setModalVisible(false);
      router.replace('/ReadingSession_3');
    } else if (selectedOption === 'reading') {
      // 독서 중인 책 — 목록은 ReadingSession_2에서 로드 (전체 화면 반투명 로딩)
      setModalVisible(false);
      router.replace('/ReadingSession_2');
    }
  };

  const handleSelectOption = (option: string) => {
    // 이미 선택된 옵션을 다시 클릭하면 선택 해제
    if (selectedOption === option) {
      setSelectedOption(null);
    } else {
      setSelectedOption(option);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
                    !selectedOption && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!selectedOption}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.nextButtonText,
                      !selectedOption && styles.nextButtonTextDisabled,
                    ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 옵션 버튼들 */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedOption === 'bookshelf' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('bookshelf')}
                activeOpacity={0.7}>
                <Text style={styles.optionTitle}>
                  책장에서{'\n'}불러오기
                </Text>
                <View style={styles.optionIconContainer1}>
                  <Image source={BOOKSHELF_ICON} style={styles.optionIcon1} resizeMode="contain" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedOption === 'reading' && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption('reading')}
                activeOpacity={0.7}>
                <Text style={styles.optionTitle}>독서 중인 책 불러오기</Text>
                <View style={styles.optionIconContainer2}>
                  <Image source={READING_BOOK_ICON} style={styles.optionIcon2} resizeMode="contain" />
                </View>
              </TouchableOpacity>
            </View>

            {/* 안내 문구 */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                • 새로운 책을 읽고 싶으시다면 서랍장 페이지에서 먼저 책을 추가해주신 후 이용해주세요!
              </Text>
            </View>
          </View>
        </View>
      </Modal>


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
  modalContainer: {
    backgroundColor: COLORS.MODAL_BG,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    padding: 24,
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
    marginBottom: 24,
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
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    overflow: 'visible',
  },
  optionButton: {
    flex: 1,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 140,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'visible',
  },
  optionButtonSelected: {
    borderColor: COLORS.PRIMARY,
  },
  optionIconContainer1: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginRight: 12,
    marginBottom: -8,
  },
  optionIcon1: {
    width: 70,
    height: 70,
  },
  optionIconContainer2: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginRight: -4,
    marginBottom: -20,
  },
  optionIcon2: {
    width: 95,
    height: 95,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
    width: '100%',
    marginTop: 8,
  },
  infoContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    lineHeight: 18,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 140,
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
  bookCoverImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
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
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
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

