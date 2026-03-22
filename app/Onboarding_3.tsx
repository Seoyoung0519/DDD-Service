import {
  submitReadingProfile,
  type ReadingSpeed as ApiReadingSpeed,
} from '@/src/services/onboarding/onboardingService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_ICON = require('../assets/images/onboarding/daedokdan-bus.png');
// 기본 프로필 이미지 (임시로 빈 원 또는 기본 아이콘 사용)
const DEFAULT_AVATAR = require('../assets/images/onboarding/daedokdan-bus.png'); // 임시

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  PRIMARY_LIGHT: '#E4F6E9',
  PRIMARY_DARK: '#2E7D32',
  TEXT: '#333333',
  SUBTITLE: '#777777',
  GRAY: '#999999',
  LIGHT_GRAY: '#BBBBBB',
  BACKGROUND: '#FFFFFF',
  INPUT_BORDER: '#DDDDDD',
  INPUT_BG: '#F7F7F7',
  BUTTON_BG: '#F0F0F0',
  BUTTON_TEXT: '#555555',
  BUTTON_GREEN: '#2C8C55',
  BUTTON_GREEN_TEXT: '#FFFFFF',
  CHIP_BG: '#F7F7F7',
  CHIP_BORDER: '#DDDDDD',
  CHIP_SELECTED_BG: '#E4F6E9',
  CHIP_SELECTED_BORDER: '#2C8C55',
  CHIP_SELECTED_TEXT: '#2E7D32',
  SPEED_CIRCLE_LIGHT: '#C4E1B5', // 연한 초록색 (선택 안됨)
  SPEED_CIRCLE_MEDIUM: '#A5D884',
  SPEED_CIRCLE_DARK: '#5CB85C', // 중간 톤 초록색 (선택됨) - 너무 진하지 않게 조정
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

const GENRES = [
  '시',
  '경영/경제',
  '에세이',
  '로맨스 소설',
  '추리 소설',
  '외국어',
  '인문',
  '철학',
  '과학',
  '사회',
  '역사',
  '종교',
  'IT',
  '여행',
] as const;

type Genre = (typeof GENRES)[number];
type UiReadingSpeed = 1 | 2 | 3 | 4 | 5; // 5개의 원 (1: 매우 느림, 3: 보통, 5: 매우 빠름)
type ReadingFreq = '1' | '2' | '3' | '4+';

function mapUiSpeedToApi(speed: UiReadingSpeed): ApiReadingSpeed {
  if (speed <= 2) return 'slow';
  if (speed === 3) return 'normal';
  return 'fast';
}

function mapFreqToWeeklyCount(freq: ReadingFreq): number {
  if (freq === '4+') return 4;
  return parseInt(freq, 10);
}

export default function Onboarding_3() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userType?: string }>();
  const userType = params.userType as 'worker_student' | 'other' | undefined;

  const [nickname, setNickname] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [speed, setSpeed] = useState<UiReadingSpeed>(3); // 기본값: 보통 (3번째 원)
  const [freq, setFreq] = useState<ReadingFreq | null>(null);
  const [showFreqDropdown, setShowFreqDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleGenre = (genre: Genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handlePrevious = () => {
    router.back();
  };

  const handleNext = async () => {
    if (submitting) return;
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    if (selectedGenres.length === 0) {
      alert('선호하는 책 장르를 1개 이상 선택해주세요.');
      return;
    }
    if (!freq) {
      alert('독서 횟수를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await submitReadingProfile({
        nickname: nickname.trim(),
        preferredGenres: [...selectedGenres],
        readingSpeed: mapUiSpeedToApi(speed),
        weeklyReadCount: mapFreqToWeeklyCount(freq),
      });

      if (userType === 'worker_student') {
        router.push({
          pathname: '/Onboarding_4',
          params: { userType: userType },
        });
      } else {
        router.push('/Onboarding_5');
      }
    } catch (e) {
      Alert.alert(
        '오류',
        e instanceof Error ? e.message : '독서 프로필 저장에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const freqOptions: { value: ReadingFreq; label: string }[] = [
    { value: '1', label: '1번' },
    { value: '2', label: '2번' },
    { value: '3', label: '3번' },
    { value: '4+', label: '4번 이상' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 앱바 */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Image source={BUS_ICON} style={styles.busIcon} resizeMode="contain" />
          <Text style={styles.appTitle}>대독단</Text>
        </View>
      </View>

      {/* 회색 바 */}
      <View style={styles.divider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 상단 타이틀 영역 */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>독서 프로필을 입력해주세요</Text>
          <Text style={styles.subtitle}>
            프로필은 추후 대독단의 '프로필' 페이지에서{'\n'}
            언제든지 수정 가능합니다
          </Text>
        </View>

        {/* 프로필 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            프로필<Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            프로필 사진을 따로 설정하지 않으면 아래의 기본 이미지로 설정됩니다.
          </Text>
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <Image source={DEFAULT_AVATAR} style={styles.avatar} resizeMode="cover" />
              <TouchableOpacity style={styles.editIconContainer}>
                <Ionicons name="pencil" size={12} color="#333333" />
              </TouchableOpacity>
            </View>
            <View style={styles.nicknameContainer}>
              <Text style={styles.nicknameLabel}>닉네임</Text>
              <TextInput
                style={styles.nicknameInput}
                placeholder="Nickname"
                placeholderTextColor={COLORS.LIGHT_GRAY}
                value={nickname}
                onChangeText={setNickname}
              />
            </View>
          </View>
        </View>

        {/* 선호하는 책 장르 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            선호하는 책 장르<Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            평소 즐겨보는 책의 장르를 1개 이상 골라주세요
          </Text>
          <View style={styles.genreContainer}>
            {GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    isSelected && styles.genreChipSelected,
                  ]}
                  onPress={() => toggleGenre(genre)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.genreChipText,
                      isSelected && styles.genreChipTextSelected,
                    ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 독서 속도 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            독서 속도<Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            자신의 생각하기에 평소 책을 읽는 속도가 어느정도인지 아래 선택지에서 골라주세요
          </Text>
          <View style={styles.speedContainer}>
            <View style={styles.speedLabels}>
              <Text style={styles.speedLabel}>매우 느림</Text>
              <View style={styles.speedLabelSpacer} />
              <Text style={styles.speedLabel}>보통</Text>
              <View style={styles.speedLabelSpacer} />
              <Text style={styles.speedLabel}>매우 빠름</Text>
            </View>
            <View style={styles.speedCircles}>
              {[1, 2, 3, 4, 5].map((index) => {
                const isSelected = speed === index;
                // 원 크기: 1번과 5번이 크고, 2번과 4번이 중간, 3번이 작음
                const getCircleSize = () => {
                  if (index === 1 || index === 5) return styles.speedCircleLarge;
                  if (index === 2 || index === 4) return styles.speedCircleMedium;
                  return styles.speedCircleSmall;
                };
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.speedCircle,
                      getCircleSize(),
                      isSelected && styles.speedCircleSelected,
                    ]}
                    onPress={() => setSpeed(index as UiReadingSpeed)}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* 독서 횟수 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            독서 횟수<Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            일주일 기준으로 평소 책을 읽는 횟수를 선택해주세요
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowFreqDropdown(!showFreqDropdown)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.dropdownText,
                !freq && styles.dropdownPlaceholder,
              ]}>
              {freq ? freqOptions.find((opt) => opt.value === freq)?.label : '독서 횟수'}
            </Text>
            <Ionicons
              name={showFreqDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.GRAY}
            />
          </TouchableOpacity>
          {showFreqDropdown && (
            <View style={styles.dropdownOptions}>
              {freqOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFreq(option.value);
                    setShowFreqDropdown(false);
                  }}
                  activeOpacity={0.7}>
                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.previousButton}
            onPress={handlePrevious}
            activeOpacity={0.6}>
            <Text style={styles.previousButtonText}>이전</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, submitting && { opacity: 0.85 }]}
            onPress={handleNext}
            disabled={submitting}
            activeOpacity={0.6}>
            {submitting ? (
              <ActivityIndicator color={COLORS.BUTTON_GREEN_TEXT} />
            ) : (
              <Text style={styles.nextButtonText}>다음</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appBar: {
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'center',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busIcon: {
    width: 35,
    height: 35,
    marginRight: 7,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    fontFamily: FONTS.BOLD,
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
  },
  subtitle: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    fontFamily: FONTS.REGULAR,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
    fontFamily: FONTS.BOLD,
  },
  asterisk: {
    color: '#2196F3',
    fontSize: 15,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    lineHeight: 18,
    fontFamily: FONTS.REGULAR,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  nicknameContainer: {
    flex: 1,
  },
  nicknameLabel: {
    fontSize: 13,
    color: '#333333',
    marginBottom: 4,
    fontFamily: FONTS.REGULAR,
  },
  nicknameInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    fontFamily: FONTS.REGULAR,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.CHIP_BORDER,
    backgroundColor: COLORS.CHIP_BG,
    marginRight: 8,
    marginBottom: 8,
  },
  genreChipSelected: {
    backgroundColor: COLORS.CHIP_SELECTED_BG,
    borderColor: COLORS.CHIP_SELECTED_BORDER,
  },
  genreChipText: {
    fontSize: 13,
    color: '#555555',
    fontFamily: FONTS.REGULAR,
  },
  genreChipTextSelected: {
    color: COLORS.CHIP_SELECTED_TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  speedContainer: {
    marginTop: 16,
  },
  speedLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  speedLabelSpacer: {
    flex: 1,
  },
  speedLabel: {
    fontSize: 12,
    color: '#777777',
    fontFamily: FONTS.REGULAR,
  },
  speedCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedCircle: {
    backgroundColor: COLORS.SPEED_CIRCLE_LIGHT, // 연한 초록색 (기본)
    opacity: 0.6,
  },
  speedCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  speedCircleMedium: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  speedCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  speedCircleSelected: {
    backgroundColor: COLORS.SPEED_CIRCLE_DARK, // 진한 초록색 (선택됨)
    opacity: 1,
    borderWidth: 2,
    borderColor: '#000000', // 검은색 테두리
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: FONTS.REGULAR,
  },
  dropdownPlaceholder: {
    color: COLORS.LIGHT_GRAY,
  },
  dropdownOptions: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: FONTS.REGULAR,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 24,
  },
  previousButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.BUTTON_BG,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButtonText: {
    fontSize: 15,
    color: COLORS.BUTTON_TEXT,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
  },
  nextButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.BUTTON_GREEN,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  nextButtonText: {
    fontSize: 15,
    color: COLORS.BUTTON_GREEN_TEXT,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
});