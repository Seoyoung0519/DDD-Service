import {
  finishReadingTest,
  ONBOARDING_READING_TEST_STORAGE_KEY,
  type ReadingTestStartResponse,
} from '@/src/services/onboarding/onboardingService';
import { isOnboardingAlreadyCompleteError } from '@/src/services/onboarding/onboardingProfileEditSave';
import { OnboardingAppBar } from '@/src/components/onboarding/OnboardingAppBar';
import { OnboardingReadingTestGateLoading } from '@/src/components/onboarding/OnboardingReadingTestGateLoading';
import { useOnboardingReadingTestGate } from '@/src/utils/onboardingProfileEdit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const readingTestGate = useOnboardingReadingTestGate(router);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [hydrating, setHydrating] = useState(true);
  const [apiPayload, setApiPayload] = useState<ReadingTestStartResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [passageBody, setPassageBody] = useState<string>(PASSAGE_TEXT);
  const [submitting, setSubmitting] = useState(false);

  // 서버에서 시작한 테스트면 AsyncStorage에 저장된 지문/문항 사용
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ONBOARDING_READING_TEST_STORAGE_KEY);
        if (!alive) return;
        if (raw) {
          const data = JSON.parse(raw) as ReadingTestStartResponse;
          setApiPayload(data);
          setPassageBody(data.body);
          setQuestions([
            {
              id: 1,
              text: data.question,
              options: data.choices.map((text, i) => ({ id: i, text })),
            },
          ]);
        }
      } catch {
        // 로컬 기본 지문 유지
      } finally {
        if (alive) setHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 데이터 준비 후 타이머 시작 (서버 지문 로드까지 포함)
  useEffect(() => {
    if (!hydrating && startTime === null) {
      setStartTime(Date.now());
    }
  }, [hydrating, startTime]);

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

  const allQuestionsAnswered = questions.every(
    (question) => selectedAnswers[question.id] !== undefined,
  );

  const handleComplete = async () => {
    if (startTime === null || !allQuestionsAnswered || submitting) return;

    const totalTimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    const goToResult = (correctCount: number, totalQuestions: number) => {
      router.push({
        pathname: '/Onboarding_7',
        params: {
          timeTaken: totalTimeSeconds.toString(),
          correctCount: correctCount.toString(),
          totalQuestions: totalQuestions.toString(),
        },
      });
    };

    if (apiPayload) {
      const userChoice = selectedAnswers[1];
      if (userChoice === undefined) return;

      setSubmitting(true);
      try {
        const finishRes = await finishReadingTest({
          testId: apiPayload.testId,
          elapsedSeconds: totalTimeSeconds,
          userChoice,
        });
        await AsyncStorage.removeItem(ONBOARDING_READING_TEST_STORAGE_KEY);
        goToResult(finishRes.isCorrect ? 1 : 0, 1);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // finish API가 온보딩 완료로 표시해도 결과 화면까지는 진행
        if (isOnboardingAlreadyCompleteError(msg)) {
          await AsyncStorage.removeItem(ONBOARDING_READING_TEST_STORAGE_KEY);
          goToResult(0, 1);
          return;
        }
        Alert.alert(
          '오류',
          e instanceof Error ? e.message : '테스트 제출에 실패했습니다. 다시 시도해주세요.',
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 로컬 폴백 (서버 테스트 없이 진입한 경우)
    let correctCount = 0;
    questions.forEach((question) => {
      if (question.correctAnswer && selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });

    goToResult(correctCount, questions.length);
  };

  const getOptionNumber = (index: number) => {
    const numbers = ['①', '②', '③', '④', '⑤', '⑥'];
    return numbers[index] ?? `${index + 1}.`;
  };

  if (readingTestGate !== 'allowed') {
    return (
      <SafeAreaView style={[styles.container, styles.hydrateCenter]} edges={['top', 'bottom']}>
        <OnboardingReadingTestGateLoading />
      </SafeAreaView>
    );
  }

  if (hydrating) {
    return (
      <SafeAreaView style={[styles.container, styles.hydrateCenter]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 앱바 */}
      <OnboardingAppBar />

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
              <Text style={styles.passageText}>{passageBody}</Text>
            </ScrollView>
          </View>
        </View>

        {/* 이해도 확인 문제 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.comprehensionTitle]}>
            이해도 확인 문제<Text style={styles.asterisk}>*</Text>
          </Text>

          {questions.map((question) => (
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
            allQuestionsAnswered && !submitting && styles.completeButtonActive,
          ]}
          onPress={handleComplete}
          activeOpacity={0.6}
          disabled={!allQuestionsAnswered || submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.completeButtonText,
                allQuestionsAnswered && styles.completeButtonTextActive,
              ]}>
              완료
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hydrateCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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

