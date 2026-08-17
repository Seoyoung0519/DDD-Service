import { OnboardingAppBar } from '@/src/components/onboarding/OnboardingAppBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
import { APP_FONTS } from '@/src/theme/fonts';
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
};

// 폰트 패밀리
const FONTS = APP_FONTS;

// 시간 포맷팅 함수 (초를 MM:SS 형식으로)
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Onboarding_7() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    timeTaken?: string;
    correctCount?: string;
    totalQuestions?: string;
  }>();

  // 파라미터에서 값 가져오기 (기본값 설정)
  const timeTakenSeconds = params.timeTaken ? parseInt(params.timeTaken, 10) : 0;
  const correctCount = params.correctCount ? parseInt(params.correctCount, 10) : 0;
  const totalQuestions = params.totalQuestions ? parseInt(params.totalQuestions, 10) : 2;

  // 시간을 MM:SS 형식으로 포맷팅
  const formattedTime = formatTime(timeTakenSeconds);

  const handleNext = () => {
    // Onboarding_8로 이동
    router.push('/Onboarding_8');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 앱바 */}
      <OnboardingAppBar />

      {/* 회색 바 */}
      <View style={styles.divider} />

      {/* 메인 컨텐츠 영역 */}
      <View style={styles.content}>
        {/* 타이틀 */}
        <Text style={styles.mainTitle}>당신의 독서 속도 테스트 결과는</Text>

        {/* 설명 텍스트 */}
        <Text style={styles.description}>
          제한 시간 안에 문제를 풀었는지 몇 문제를 맞추었는지 등을 종합적으로 평가하여
          당신의 독서 속도를 측정하고 추후 책 쪽수 추천 시 반영합니다.
        </Text>

        {/* 테스트 소요 시간 */}
        <View style={styles.resultSection}>
          <Text style={styles.resultLabel}>테스트 소요 시간</Text>
          <Text style={styles.resultValue}>0:{formattedTime}</Text>
        </View>

        {/* 맞춘 문제 수 */}
        <View style={styles.resultSection}>
          <Text style={styles.resultLabel}>맞춘 문제 수</Text>
          <Text style={styles.resultValue}>
            {correctCount} / {totalQuestions}
          </Text>
        </View>
      </View>

      {/* 하단 다음 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.6}>
          <Text style={styles.nextButtonText}>다음</Text>
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
    paddingTop: 70,
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
    lineHeight: 20,
    fontFamily: FONTS.REGULAR,
    paddingHorizontal: 8,
    marginBottom: 60,
  },
  resultSection: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 20,
  },
  resultLabel: {
    fontSize: 16,
    color: '#777777',
    fontFamily: FONTS.REGULAR,
    marginBottom: 12,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333333',
    fontFamily: FONTS.SEMIBOLD,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  nextButton: {
    minHeight: 48,
    paddingVertical: 12,
    backgroundColor: COLORS.BUTTON_GREEN,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    color: COLORS.BUTTON_GREEN_TEXT,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
});

