import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#333333',
  SUBTITLE: '#777777',
  GRAY: '#999999',
  LIGHT_GRAY: '#BBBBBB',
  BACKGROUND: '#FFFFFF',
  BUTTON_BG: '#F0F0F0',
  BUTTON_TEXT: '#555555',
  BUTTON_GREEN: '#2C8C55',
  BUTTON_GREEN_TEXT: '#FFFFFF',
  CIRCLE_BUTTON_BG: '#E0E0E0',
  CIRCLE_BUTTON_ICON: '#666666',
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

export default function Onboarding_5() {
  const router = useRouter();

  const handlePrevious = () => {
    router.back();
  };

  const handleSkip = () => {
    // 건너뛰기 - Onboarding_8로 이동
    router.replace('/Onboarding_8');
  };

  const handleStart = () => {
    // 시작하기 버튼 클릭 시 독서 속도 테스트 화면으로 이동
    console.log('독서 속도 테스트 시작');
    router.push('/Onboarding_6');
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

      {/* 메인 컨텐츠 영역 */}
      <View style={styles.content}>
        {/* 타이틀 */}
        <Text style={styles.mainTitle}>독서 속도 테스트를 진행하세요</Text>

        {/* 설명 텍스트 */}
        <Text style={styles.description}>
          제한시간 1분 30초동안 대독단에서 제공하는 지문을 다 읽고 제공하는 문제를 푸신 후
          완료 버튼을 눌러주세요. 제한 시간이 지나면 자동으로 종료됩니다.
        </Text>

        {/* 시작하기 섹션 */}
        <View style={styles.startSection}>
          <Text style={styles.startLabel}>시작하기</Text>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={handleStart}
            activeOpacity={0.7}>
            <Ionicons
              name="arrow-forward"
              size={32}
              color={COLORS.CIRCLE_BUTTON_ICON}
            />
          </TouchableOpacity>
          {/* 점 인디케이터 */}
          <View style={styles.dotIndicator} />
        </View>
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
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.6}>
          <Text style={styles.skipButtonText}>건너뛰기</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
    marginBottom: 24,
  },
  description: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: FONTS.REGULAR,
    paddingHorizontal: 13,
    marginBottom: 60,
  },
  startSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  startLabel: {
    fontSize: 16,
    color: '#333333',
    fontFamily: FONTS.MEDIUM,
    marginBottom: 24,
  },
  circleButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.CIRCLE_BUTTON_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
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
  skipButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.BUTTON_GREEN,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: COLORS.BUTTON_GREEN_TEXT,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
});

