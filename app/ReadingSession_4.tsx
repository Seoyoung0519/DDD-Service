import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON_HEADER = require('../assets/images/drawer/bell.png');
const LOCATION_ICON = require('../assets/images/reading_session/위치_2.png');

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
  INPUT_BORDER: '#EAEAEA',
  INPUT_PLACEHOLDER: '#999999',
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

// 최근 검색 데이터 (임시)
const RECENT_SEARCHES = [
  {
    id: '1',
    departure: '서울 용산구 한강로2가 422-2',
    arrival: '탕화쿵푸숙대점',
  },
  {
    id: '2',
    departure: '서울용산구 녹사평대로 132-1',
    arrival: '아이파크몰용산점',
  },
];

export default function ReadingSession_4() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedBook?: string }>();
  const [activeNav, setActiveNav] = useState('책읽기');
  const [modalVisible, setModalVisible] = useState(true);
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');

  const handleClose = () => {
    setModalVisible(false);
    router.back();
  };

  const handleNext = () => {
    // TODO: 출발지와 도착지가 입력되었는지 확인 후 다음 화면으로 이동
    if (departure.trim() && arrival.trim()) {
      console.log('Departure:', departure);
      console.log('Arrival:', arrival);
      console.log('Selected book:', params.selectedBook);
      // router.push({
      //   pathname: '/ReadingSession_5',
      //   params: {
      //     selectedBook: params.selectedBook || '',
      //     departure,
      //     arrival,
      //   },
      // });
    }
  };

  const handleSelectRecentSearch = (search: typeof RECENT_SEARCHES[0]) => {
    setDeparture(search.departure);
    setArrival(search.arrival);
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
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="menu" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
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
              <Text style={styles.modalTitle}>출·도착지 등록</Text>
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
                    (!departure.trim() || !arrival.trim()) && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!departure.trim() || !arrival.trim()}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.nextButtonText,
                      (!departure.trim() || !arrival.trim()) && styles.nextButtonTextDisabled,
                    ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 입력 필드 */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputTop}
                placeholder="출발지 입력"
                placeholderTextColor={COLORS.INPUT_PLACEHOLDER}
                value={departure}
                onChangeText={setDeparture}
              />
              <View style={styles.inputDivider} />
              <TextInput
                style={styles.inputBottom}
                placeholder="도착지 입력"
                placeholderTextColor={COLORS.INPUT_PLACEHOLDER}
                value={arrival}
                onChangeText={setArrival}
              />
            </View>

            {/* 최근 검색 */}
            <Text style={styles.recentSearchTitle}>최근 검색</Text>
            <View style={styles.recentSearchDivider} />
            <ScrollView
              style={styles.recentSearchList}
              contentContainerStyle={styles.recentSearchListContent}
              showsVerticalScrollIndicator={false}>
              {RECENT_SEARCHES.map((search) => (
                <TouchableOpacity
                  key={search.id}
                  style={styles.recentSearchItem}
                  onPress={() => handleSelectRecentSearch(search)}
                  activeOpacity={0.7}>
                  <Image source={LOCATION_ICON} style={styles.locationIcon} resizeMode="contain" />
                  <Text style={styles.recentSearchText}>
                    {search.departure} → {search.arrival}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
            router.push('/Drawer_2');
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
    maxWidth: 500,
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
  inputContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
    overflow: 'hidden',
  },
  inputTop: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
    backgroundColor: COLORS.BACKGROUND,
  },
  inputDivider: {
    height: 1,
    backgroundColor: COLORS.INPUT_BORDER,
    width: '100%',
  },
  inputBottom: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
    backgroundColor: COLORS.BACKGROUND,
  },
  recentSearchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 12,
  },
  recentSearchDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    width: '100%',
    marginBottom: 12,
  },
  recentSearchList: {
    maxHeight: 200,
  },
  recentSearchListContent: {
    gap: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  locationIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.SUBTITLE,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
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
});

