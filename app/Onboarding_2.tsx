import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
const BUS_ICON = require('../assets/images/onboarding/daedokdan-bus.png');
const WORKER_STUDENT_IMAGE = require('../assets/images/onboarding/직장인.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#777777',
  GRAY: '#999999',
  BACKGROUND: '#FFFFFF',
  CARD_BG_SELECTED: '#FFFFFF',
  CARD_BG_UNSELECTED: '#F5F5F5',
  BORDER_SELECTED: '#2C8C55',
  BORDER_UNSELECTED: '#DDDDDD',
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
  const [selectedUserType, setSelectedUserType] = useState<UserType>('worker_student');

  const handleSelect = (type: UserType) => {
    setSelectedUserType(type);
  };

  const handleNext = () => {
    // 다음 온보딩 단계로 이동
    router.push('/Onboarding_3');
  };

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
        style={styles.nextButton}
        onPress={handleNext}
        activeOpacity={0.8}>
        <Text style={styles.nextButtonText}>다음</Text>
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
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.BORDER_SELECTED,
    backgroundColor: COLORS.CARD_BG_SELECTED,
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
    borderColor: COLORS.BORDER_UNSELECTED,
    backgroundColor: COLORS.CARD_BG_UNSELECTED,
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
    justifyContent: 'center',
    marginTop: 8,
  },
  cardImage: {
    width: SCREEN_WIDTH * 0.8 * 0.8,
    height: 110,
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

