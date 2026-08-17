import { saveOnboardingUserTypeForEdit } from '@/src/services/onboarding/onboardingProfileEditSave';
import { setOnboardingUserType, fetchOnboardingState } from '@/src/services/onboarding/onboardingService';
import { loadOnboardingProfileForEdit } from '@/src/api/userProfile';
import {
  isOnboardingEditMode,
  mapUserTypeFromProfile,
} from '@/src/utils/onboardingProfileEdit';
import { OnboardingAppBar } from '@/src/components/onboarding/OnboardingAppBar';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const WORKER_STUDENT_IMAGE = require('../assets/images/onboarding/worker-student.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#777777',
  GRAY: '#999999',
  BACKGROUND: '#FFFFFF',
  CARD_BG_SELECTED: '#FFFFFF',
  CARD_BG_UNSELECTED: '#F5F5F5', // 연한 회색
  BORDER_SELECTED: '#2C8C55', // 초록색
  BORDER_UNSELECTED: '#DDDDDD', // 연한 회색 테두리
  BUTTON_BG: '#2C8C55',
  BUTTON_TEXT: '#FFFFFF',
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

type UserType = 'worker_student' | 'other';

export default function Onboarding_2() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = isOnboardingEditMode(params.edit);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('worker_student');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isEditMode) return;
      void (async () => {
        try {
          const profile = await loadOnboardingProfileForEdit();
          setSelectedUserType(mapUserTypeFromProfile(profile.userType));
        } catch {
          // 기본값 유지
        }
      })();
    }, [isEditMode]),
  );

  const handleSelect = (type: UserType) => {
    setSelectedUserType(type);
  };

  const handleNext = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isEditMode) {
        await saveOnboardingUserTypeForEdit({ userType: selectedUserType });
        Alert.alert('저장 완료', '사용자 유형이 저장되었습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
        return;
      }

      const onboarding = await fetchOnboardingState();
      if (onboarding?.isOnboarded) {
        Alert.alert(
          '안내',
          '이미 온보딩을 완료한 계정입니다.\n계정 관리 > 온보딩 프로필 수정하기에서 변경해 주세요.',
          [{ text: '확인', onPress: () => router.back() }],
        );
        return;
      }

      await setOnboardingUserType({ userType: selectedUserType });
      router.push({
        pathname: '/Onboarding_3',
        params: { userType: selectedUserType },
      });
    } catch (e) {
      Alert.alert(
        '오류',
        e instanceof Error ? e.message : '사용자 유형을 저장하지 못했습니다. 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 앱바 */}
      <OnboardingAppBar hideSkip={isEditMode} />

      {/* 회색 바 */}
      <View style={styles.divider} />

      {/* 상단 안내 영역 */}
      <View style={styles.headerSection}>
        <Text style={styles.mainTitle}>사용자 정보를 선택해주세요</Text>
        <Text style={styles.subtitle}>
          직장인/대학생 유형 선택 시 독서 정보뿐만 아니라{'\n'}
          통근 정보도 함께 입력받게 됩니다
        </Text>
      </View>

      {/* 선택 카드 영역 */}
      <View style={styles.cardsContainer}>
        {/* 첫 번째 카드 - 직장인/대학생 */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedUserType === 'worker_student' ? styles.cardSelected : styles.cardUnselected,
          ]}
          onPress={() => handleSelect('worker_student')}
          activeOpacity={0.8}>
          <View style={styles.cardContent}>
            <View style={styles.cardTextSection}>
              <Text style={styles.cardTitle}>직장인/대학생</Text>
              <Text style={styles.cardDescription}>
                출퇴근 혹은 등하교 시 짧은 시간동안{'\n'}
                독서를 즐기고 싶으신 분들
              </Text>
            </View>
            <View style={styles.cardImageSection}>
              <Image
                source={WORKER_STUDENT_IMAGE}
                style={styles.cardImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* 두 번째 카드 - 그 외 */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedUserType === 'other' ? styles.cardSelected : styles.cardUnselected,
          ]}
          onPress={() => handleSelect('other')}
          activeOpacity={0.8}>
          <View style={styles.otherCardContent}>
            <Text style={styles.otherCardText}>그 외</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 하단 "다음" 버튼 */}
      <TouchableOpacity
        style={[styles.nextButton, submitting && { opacity: 0.7 }]}
        onPress={handleNext}
        disabled={submitting}
        activeOpacity={0.6}>
        {submitting ? (
          <ActivityIndicator color={COLORS.BUTTON_TEXT} />
        ) : (
          <Text style={styles.nextButtonText}>{isEditMode ? '저장' : '다음'}</Text>
        )}
      </TouchableOpacity>
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
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
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
  cardsContainer: {
    marginTop: 64,
    alignItems: 'center',
    flex: 1,
  },
  card: {
    width: SCREEN_WIDTH * 0.75,
    height: 205,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.BORDER_SELECTED, // 초록색 테두리
    backgroundColor: COLORS.CARD_BG_SELECTED, // 흰색 배경
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardUnselected: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_UNSELECTED, // 연한 회색 테두리
    backgroundColor: COLORS.CARD_BG_UNSELECTED, // 연한 회색 배경
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTextSection: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
  },
  cardDescription: {
    fontSize: 13,
    color: '#777777',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: FONTS.REGULAR,
  },
  cardImageSection: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 96,
    marginTop: 4,
  },
  cardImage: {
    width: 140,
    height: 96,
  },
  otherCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444444',
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
  },
  nextButton: {
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.8,
    height: 50,
    backgroundColor: COLORS.BUTTON_BG,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BUTTON_TEXT,
    fontFamily: FONTS.SEMIBOLD,
  },
});

