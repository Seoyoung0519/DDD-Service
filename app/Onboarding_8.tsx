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
const DAEDOKDAN_LOGO = require('../assets/images/onboarding/대독단로고.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#333333',
  SUBTITLE: '#777777',
  GRAY: '#999999',
  LIGHT_GRAY: '#BBBBBB',
  BACKGROUND: '#FFFFFF',
  BUTTON_GREEN: '#2C8C55',
  BUTTON_GREEN_TEXT: '#FFFFFF',
  BOTTOM_BG: '#E5E5E5', // 더 진한 회색
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

export default function Onboarding_8() {
  const router = useRouter();

  const handleStart = () => {
    // 온보딩 완료 후 앱 메인(책장/키링 등 — `app/(tabs)` Expo 템플릿 홈 아님)
    router.replace('/Drawer_1');
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
        <Text style={styles.mainTitle}>
          이제 대독단과 함께 독서할 준비가 되었습니다!
        </Text>

        {/* 부제목 */}
        <Text style={styles.subtitle}>
          아래 버튼을 눌러 대독단을 시작해보세요
        </Text>

        {/* 대독단 로고 - 바퀴가 도로 위에 있는 것처럼 */}
        <View style={styles.logoContainer}>
          <Image source={DAEDOKDAN_LOGO} style={styles.logo} resizeMode="contain" />
        </View>
      </View>

      {/* 하단 회색 배경 영역 (도로) */}
      <View style={styles.bottomSection} />

      {/* 시작하기 버튼 - 회색 블록 위에 별도 배치 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          activeOpacity={0.6}>
          <Text style={styles.startButtonText}>시작하기</Text>
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
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    marginBottom: 40,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 40,
  },
  logo: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.95,
    maxWidth: 400,
    maxHeight: 400,
  },
  bottomSection: {
    backgroundColor: COLORS.BOTTOM_BG,
    width: SCREEN_WIDTH,
    minHeight: 280,
    marginTop: 0,
    alignSelf: 'stretch',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.BUTTON_GREEN,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 15,
    color: COLORS.BUTTON_GREEN_TEXT,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
});

