import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Platform,
    ScrollView,
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
  TEXT_BOX_BG: '#F5F5F5',
  OPTION_BORDER: '#DDDDDD',
  OPTION_SELECTED_BORDER: '#999999',
  ASTERISK: '#2196F3',
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

// 지문 내용
const PASSAGE_TEXT = `인공지능은 사회 전반에 걸쳐 혁신을 가져오고 있다. 의료 분야에서는 진단 정확도를 높이고, 교육 분야에서는 개인 맞춤형 학습을 가능하게 하며, 산업에서는 자동화를 통해 효율성을 극대화하고 있다. 그러나 이러한 발전과 함께 일자리의 변화, 개인정보 보호, 알고리즘 편향성 등의 도전과제도 존재한다. 이러한 문제들에 대한 해결책을 찾기 위한 논의가 계속되고 있으며, 앞으로 인공지능과 인간이 조화롭게 공존할 수 있는 방안을 모색해야 한다.`;

// 문제 데이터
type QuestionOption = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  text: string;
  options: QuestionOption[];
  correctAnswer?: number; // 정답 ID (선택적)
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: '글에서 언급된 인공지능의 활용 분야가 아닌 것은?',
    options: [
      { id: 1, text: '의료 분야' },
      { id: 2, text: '교육 분야' },
      { id: 3, text: '농업 분야' }, // 정답
      { id: 4, text: '산업 분야' },
    ],
    correctAnswer: 3, // 정답 ID
  },
  {
    id: 2,
    text: '인공지능과 관련된 도전과제로 언급되지 않은 것은?',
    options: [
      { id: 1, text: '일자리의 변화' },
      { id: 2, text: '개인정보 보호' },
      { id: 3, text: '알고리즘 편향성' },
      { id: 4, text: '전력 소비 증가' }, // 정답
    ],
    correctAnswer: 4, // 정답 ID
  },
];

// Question 타입에 correctAnswer 추가
type QuestionWithAnswer = Question & {
  correctAnswer: number;
};

export default function Onboarding_6() {
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // 페이지 진입 시 시작 시간 기록
  useEffect(() => {
    const start = Date.now();
    setStartTime(start);
  }, []);

  // 경과 시간 계산 (선택사항: 실시간 표시용)
  useEffect(() => {
    if (startTime === null) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000); // 초 단위
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setSelectedAnswers((prev) => {
      // 이미 선택된 옵션을 다시 클릭하면 선택 해제
      if (prev[questionId] === optionId) {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      }
      // 새로운 옵션 선택
      return {
        ...prev,
        [questionId]: optionId,
      };
    });
  };

  // 모든 문제에 답변이 선택되었는지 확인
  const allQuestionsAnswered = QUESTIONS.every(
    (question) => selectedAnswers[question.id] !== undefined
  );

  const handleComplete = () => {
    if (startTime === null || !allQuestionsAnswered) return;

    // 완료 시점의 경과 시간 계산 (밀리초 단위)
    const totalTime = Date.now() - startTime; // 밀리초
    const totalTimeSeconds = Math.floor(totalTime / 1000); // 초 단위

    // 정답 개수 계산
    let correctCount = 0;
    QUESTIONS.forEach((question) => {
      if (question.correctAnswer && selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });

    console.log('Selected answers:', selectedAnswers);
    console.log('Total time taken:', totalTimeSeconds, 'seconds');
    console.log('Correct answers:', correctCount, '/', QUESTIONS.length);

    // TODO: 백엔드 API로 답안과 소요 시간 전송
    // await submitReadingTest({
    //   answers: selectedAnswers,
    //   timeTaken: totalTime, // 또는 totalTimeSeconds
    //   correctCount,
    // });

    // Onboarding_7로 이동 (결과 화면)
    router.push({
      pathname: '/Onboarding_7',
      params: {
        timeTaken: totalTimeSeconds.toString(),
        correctCount: correctCount.toString(),
        totalQuestions: QUESTIONS.length.toString(),
      },
    });
  };

  const getOptionNumber = (index: number) => {
    const numbers = ['①', '②', '③', '④'];
    return numbers[index];
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 지문 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지문</Text>
          <View style={styles.textBox}>
            <ScrollView
              style={styles.textBoxScroll}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled>
              <Text style={styles.passageText}>{PASSAGE_TEXT}</Text>
            </ScrollView>
          </View>
        </View>

        {/* 이해도 확인 문제 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.comprehensionTitle]}>
            이해도 확인 문제<Text style={styles.asterisk}>*</Text>
          </Text>

          {QUESTIONS.map((question) => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={styles.questionText}>
                Q{question.id}. {question.text}
              </Text>
              <View style={styles.optionsContainer}>
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswers[question.id] === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleOptionSelect(question.id, option.id)}
                      activeOpacity={0.7}>
                      <Text style={styles.optionNumber}>{getOptionNumber(index)}</Text>
                      <Text style={styles.optionText}>{option.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 하단 완료 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            allQuestionsAnswered && styles.completeButtonActive,
          ]}
          onPress={handleComplete}
          activeOpacity={0.6}
          disabled={!allQuestionsAnswered}>
          <Text
            style={[
              styles.completeButtonText,
              allQuestionsAnswered && styles.completeButtonTextActive,
            ]}>
            완료
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: FONTS.BOLD,
    marginBottom: 12,
  },
  comprehensionTitle: {
    marginTop: 8,
  },
  asterisk: {
    color: COLORS.ASTERISK,
    fontSize: 16,
  },
  textBox: {
    backgroundColor: COLORS.TEXT_BOX_BG,
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
    maxHeight: 300,
  },
  textBoxScroll: {
    flex: 1,
  },
  passageText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
    fontFamily: FONTS.REGULAR,
  },
  questionContainer: {
    marginTop: 12,
  },
  questionText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: FONTS.MEDIUM,
    marginBottom: 12,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.OPTION_BORDER,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderWidth: 2,
    borderColor: '#000000', // 검정색 연속 실선 테두리
    borderStyle: 'solid', // 명시적으로 연속 실선 지정
  },
  optionNumber: {
    fontSize: 14,
    color: '#333333',
    fontFamily: FONTS.REGULAR,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: FONTS.REGULAR,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  completeButton: {
    height: 48,
    backgroundColor: COLORS.BUTTON_BG,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonActive: {
    backgroundColor: COLORS.PRIMARY, // 초록색
  },
  completeButtonText: {
    fontSize: 15,
    color: COLORS.BUTTON_TEXT,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
  },
  completeButtonTextActive: {
    color: '#FFFFFF', // 흰색 텍스트
  },
});

