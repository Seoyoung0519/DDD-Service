import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { APP_FONTS } from '@/src/theme/fonts';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';

import { AppMenuButton } from '@/src/components/header/AppMenuButton';
import { hasPendingCommuteReadingRecommend } from '@/src/state/commuteReadingRecommend';
import { consumeHideReadingPickModalOnce } from '@/src/state/readingPickGate';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON_HEADER = require('../assets/images/drawer/bell.png');
const BOOKSHELF_ICON = require('../assets/images/reading_session/bookshelf-load.png');
const READING_BOOK_ICON = require('../assets/images/reading_session/icon-reading-load.png');

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
const FONTS = APP_FONTS;

export default function ReadingSession_1() {
  const router = useRouter();
  useLocalSearchParams();
  const [activeNav, setActiveNav] = useState('책읽기');
  const [modalVisible, setModalVisible] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isOpeningList, setIsOpeningList] = useState(false);

  /** 시작하기 재진입 때마다 PICK을 연다. 통근 진입만 한 번 숨김 */
  useFocusEffect(
    useCallback(() => {
      const hidePick =
        consumeHideReadingPickModalOnce() || hasPendingCommuteReadingRecommend();
      setModalVisible(!hidePick);
      if (!hidePick) setSelectedOption(null);

      if (!hasPendingCommuteReadingRecommend()) return undefined;
      const t = setTimeout(() => {
        if (hasPendingCommuteReadingRecommend()) {
          router.push('/CommuteReadingRecommendScreen');
        }
      }, 50);
      return () => clearTimeout(t);
    }, [router]),
  );

  const handleClose = () => {
    setModalVisible(false);
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/ReadingIntroScreen');
  };

  const handleNext = () => {
    if (!selectedOption || isOpeningList) return;
    setIsOpeningList(true);
    if (selectedOption === 'bookshelf') {
      router.replace('/ReadingSession_3');
    } else if (selectedOption === 'reading') {
      router.replace('/ReadingSession_2');
    }
  };

  const handleSelectOption = (option: string) => {
    if (selectedOption === option) {
      setSelectedOption(null);
    } else {
      setSelectedOption(option);
    }
  };

  const pickModal = (
    <View style={styles.pickHost} pointerEvents="box-none">
      <View style={styles.modalDim} />
      <View style={styles.modalCenter} pointerEvents="box-none">
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
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (!selectedOption || isOpeningList) && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!selectedOption || isOpeningList}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.nextButtonText,
                    (!selectedOption || isOpeningList) && styles.nextButtonTextDisabled,
                  ]}>
                  {isOpeningList ? '불러오는 중' : '다음'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'bookshelf' && styles.optionButtonSelected,
              ]}
              onPress={() => handleSelectOption('bookshelf')}
              disabled={isOpeningList}
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
              disabled={isOpeningList}
              activeOpacity={0.7}>
              <Text style={styles.optionTitle}>독서 중인 책 불러오기</Text>
              <View style={styles.optionIconContainer2}>
                <Image source={READING_BOOK_ICON} style={styles.optionIcon2} resizeMode="contain" />
              </View>
            </TouchableOpacity>
            {isOpeningList ? (
              <View style={styles.pickLoadingOverlay} pointerEvents="auto">
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              </View>
            ) : null}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • 새로운 책을 읽고 싶으시다면 서랍장 페이지에서 먼저 책을 추가해주신 후 이용해주세요!
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (modalVisible) {
    return pickModal;
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
  pickHost: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.MODAL_OVERLAY,
  },
  modalCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.MODAL_BG,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    padding: 24,
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
    position: 'relative',
  },
  pickLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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

