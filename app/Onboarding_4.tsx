import {
  submitCommuteProfile,
  fetchOnboardingState,
  type CommuteDay,
} from '@/src/services/onboarding/onboardingService';
import { getCachedCommuteProfile } from '@/src/services/onboarding/onboardingProfileCache';
import { saveCommuteProfileForEdit } from '@/src/services/onboarding/onboardingProfileEditSave';
import { isOnboardingEditMode } from '@/src/utils/onboardingProfileEdit';
import { OnboardingAppBar } from '@/src/components/onboarding/OnboardingAppBar';
import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';
import { CommutePlaceSearchDualCard } from '@/src/components/commute/CommutePlaceSearchDualCard';
import { consumeCommutePlaceSelection } from '@/src/state/commutePlaceSelection';
import type { CommutePlace } from '@/src/types/commute';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  INPUT_BORDER: '#DDDDDD',
  INPUT_BG: '#F7F7F7',
  BUTTON_BG: '#F0F0F0',
  BUTTON_TEXT: '#555555',
  BUTTON_GREEN: '#2C8C55',
  BUTTON_GREEN_TEXT: '#FFFFFF',
  DAY_BUTTON_BG: '#FFFFFF',
  DAY_BUTTON_BORDER: '#DDDDDD',
  DAY_BUTTON_SELECTED_BG: '#2C8C55',
  DAY_BUTTON_SELECTED_TEXT: '#FFFFFF',
  DROPDOWN_BG: '#FFFFFF',
  DROPDOWN_BORDER: '#DDDDDD',
  ASTERISK: '#2196F3', // 파란색
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

type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

const KO_DAY_TO_API: Record<DayOfWeek, CommuteDay> = {
  월: 'MON',
  화: 'TUE',
  수: 'WED',
  목: 'THU',
  금: 'FRI',
  토: 'SAT',
  일: 'SUN',
};

const API_DAY_TO_KO: Record<CommuteDay, DayOfWeek> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
};

// 시간/분 옵션 생성
const generateTimeOptions = (max: number) => {
  return Array.from({ length: max }, (_, i) => i);
};

export default function Onboarding_4() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userType?: string; edit?: string }>();
  const isEditMode = isOnboardingEditMode(params.edit);
  const userType = params.userType as 'worker_student' | 'other' | undefined;

  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(null);
  const [suppressInlineSuggestions, setSuppressInlineSuggestions] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [commuteStartHours, setCommuteStartHours] = useState(0);
  const [commuteStartMinutes, setCommuteStartMinutes] = useState(0);
  const [commuteEndHours, setCommuteEndHours] = useState(0);
  const [commuteEndMinutes, setCommuteEndMinutes] = useState(0);

  const [showDurationHours, setShowDurationHours] = useState(false);
  const [showDurationMinutes, setShowDurationMinutes] = useState(false);
  const [showCommuteStartHours, setShowCommuteStartHours] = useState(false);
  const [showCommuteStartMinutes, setShowCommuteStartMinutes] = useState(false);
  const [showCommuteEndHours, setShowCommuteEndHours] = useState(false);
  const [showCommuteEndMinutes, setShowCommuteEndMinutes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    void (async () => {
      try {
        const commute = await getCachedCommuteProfile();
        if (!commute || cancelled) return;

        setDeparture(commute.originName);
        setArrival(commute.destinationName);
        setOriginPlaceId((prev) => prev ?? 'cached');
        setDestinationPlaceId((prev) => prev ?? 'cached');
        setDurationHours(commute.commuteHour);
        setDurationMinutes(commute.commuteMinute);
        setCommuteStartHours(commute.departHour);
        setCommuteStartMinutes(commute.departMinute);
        setCommuteEndHours(commute.returnHour);
        setCommuteEndMinutes(commute.returnMinute);
        setSelectedDays(
          commute.commuteDays
            .map((day) => API_DAY_TO_KO[day])
            .filter((day): day is DayOfWeek => (DAYS as readonly string[]).includes(day)),
        );
      } catch {
        // 빈 폼 유지
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode]);

  useFocusEffect(
    useCallback(() => {
      const picked = consumeCommutePlaceSelection();
      if (!picked) return;
      setSuppressInlineSuggestions(true);
      if (picked.field === 'origin') {
        setDeparture(picked.place.label);
        setOriginPlaceId(picked.place.placeId);
      } else {
        setArrival(picked.place.label);
        setDestinationPlaceId(picked.place.placeId);
      }
    }, []),
  );

  const applyOrigin = useCallback((place: CommutePlace) => {
    setSuppressInlineSuggestions(true);
    setDeparture(place.label);
    setOriginPlaceId(place.placeId);
  }, []);

  const applyDestination = useCallback((place: CommutePlace) => {
    setSuppressInlineSuggestions(true);
    setArrival(place.label);
    setDestinationPlaceId(place.placeId);
  }, []);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handlePrevious = () => {
    router.back();
  };

  const handleNext = async () => {
    if (submitting) return;
    if (!departure.trim() || !originPlaceId) {
      Alert.alert('안내', '출발지를 검색해서 목록에서 선택해 주세요.');
      return;
    }
    if (!arrival.trim() || !destinationPlaceId) {
      Alert.alert('안내', '도착지를 검색해서 목록에서 선택해 주세요.');
      return;
    }
    if (selectedDays.length === 0) {
      alert('요일을 1개 이상 선택해주세요.');
      return;
    }

    const origin = departure.trim();
    const dest = arrival.trim();

    setSubmitting(true);
    try {
      const commutePayload = {
        name: `${origin} → ${dest}`,
        originName: origin,
        destinationName: dest,
        commuteHour: durationHours,
        commuteMinute: durationMinutes,
        commuteDays: selectedDays.map((d) => KO_DAY_TO_API[d]),
        departHour: commuteStartHours,
        departMinute: commuteStartMinutes,
        returnHour: commuteEndHours,
        returnMinute: commuteEndMinutes,
      };

      if (isEditMode) {
        await saveCommuteProfileForEdit(commutePayload);
        Alert.alert('저장 완료', '통근 프로필이 저장되었습니다.', [
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

      await submitCommuteProfile(commutePayload);
      router.push('/Onboarding_5');
    } catch (e) {
      Alert.alert(
        '오류',
        e instanceof Error ? e.message : '통근 프로필 저장에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hoursOptions = generateTimeOptions(24);
  const minutesOptions = generateTimeOptions(60);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 앱바 */}
      <OnboardingAppBar hideSkip={isEditMode} />

      {/* 회색 바 */}
      <View style={styles.divider} />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* 상단 타이틀 영역 */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>
            {isEditMode ? '통근 프로필을 수정해주세요' : '통근 프로필을 입력해주세요'}
          </Text>
          <Text style={styles.subtitle}>
            프로필은 추후 대독단의 '프로필' 페이지에서{'\n'}
            언제든지 수정 가능합니다
          </Text>
        </View>

        {/* 주요 출·도착지 섹션 */}
        <View style={[styles.section, styles.placeSection]}>
          <Text style={styles.sectionTitle}>
            주요 출·도착지<Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            출·퇴근이나 등·하교 시 주로 이동하는 장소를 검색해서 선택해주세요
          </Text>
          <View style={styles.locationInputContainer}>
            <CommutePlaceSearchDualCard
              departure={departure}
              arrival={arrival}
              suppressInlineSuggestions={suppressInlineSuggestions}
              onChangeDeparture={(t) => {
                setSuppressInlineSuggestions(false);
                setDeparture(t);
                setOriginPlaceId(null);
              }}
              onChangeArrival={(t) => {
                setSuppressInlineSuggestions(false);
                setArrival(t);
                setDestinationPlaceId(null);
              }}
              onSelectOrigin={applyOrigin}
              onSelectDestination={applyDestination}
            />
          </View>
        </View>

        {/* 소요시간 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            소요시간<Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            위의 출·도착지 이동 시 걸리는 평균 예상 소요 시간을 작성해주세요
          </Text>
          <View style={styles.timeSelectorContainer}>
            <View style={styles.timeSelectorWrapper}>
              <Text style={styles.timeSelectorLabel}>시간</Text>
              <TouchableOpacity
                style={styles.timeDropdown}
                onPress={() => setShowDurationHours(!showDurationHours)}
                activeOpacity={0.7}>
                <Text style={styles.timeDropdownText}>{durationHours}</Text>
                <Ionicons
                  name={showDurationHours ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
              {showDurationHours && (
                <View style={styles.timeDropdownOptions}>
                  <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                    {hoursOptions.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={styles.timeOption}
                        onPress={() => {
                          setDurationHours(hour);
                          setShowDurationHours(false);
                        }}
                        activeOpacity={0.7}>
                        <Text style={styles.timeOptionText}>{hour}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.timeSelectorWrapper}>
              <Text style={styles.timeSelectorLabel}>분</Text>
              <TouchableOpacity
                style={styles.timeDropdown}
                onPress={() => setShowDurationMinutes(!showDurationMinutes)}
                activeOpacity={0.7}>
                <Text style={styles.timeDropdownText}>{durationMinutes}</Text>
                <Ionicons
                  name={showDurationMinutes ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
              {showDurationMinutes && (
                <View style={styles.timeDropdownOptions}>
                  <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                    {minutesOptions.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={styles.timeOption}
                        onPress={() => {
                          setDurationMinutes(minute);
                          setShowDurationMinutes(false);
                        }}
                        activeOpacity={0.7}>
                        <Text style={styles.timeOptionText}>{minute}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 요일/시간대 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            요일/시간대<Text style={styles.asterisk}>*</Text>
          </Text>
          <Text style={styles.sectionDescription}>
            위의 출·도착지를 이동하는 평균 시간대와 요일을 작성해주세요
          </Text>

          {/* 요일 선택 */}
          <View style={styles.daysContainer}>
            {DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected,
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 출근/등교 시간 */}
          <View style={styles.commuteTimeSection}>
            <Text style={styles.commuteTimeLabel}>출근/등교</Text>
            <View style={styles.timeSelectorContainer}>
              <View style={styles.timeSelectorWrapper}>
                <Text style={styles.timeSelectorLabel}>시</Text>
                <TouchableOpacity
                  style={styles.timeDropdown}
                  onPress={() => setShowCommuteStartHours(!showCommuteStartHours)}
                  activeOpacity={0.7}>
                  <Text style={styles.timeDropdownText}>{commuteStartHours}</Text>
                  <Ionicons
                    name={showCommuteStartHours ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.GRAY}
                  />
                </TouchableOpacity>
                {showCommuteStartHours && (
                  <View style={styles.timeDropdownOptions}>
                    <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                      {hoursOptions.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={styles.timeOption}
                          onPress={() => {
                            setCommuteStartHours(hour);
                            setShowCommuteStartHours(false);
                          }}
                          activeOpacity={0.7}>
                          <Text style={styles.timeOptionText}>{hour}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={styles.timeSelectorWrapper}>
                <Text style={styles.timeSelectorLabel}>분</Text>
                <TouchableOpacity
                  style={styles.timeDropdown}
                  onPress={() => setShowCommuteStartMinutes(!showCommuteStartMinutes)}
                  activeOpacity={0.7}>
                  <Text style={styles.timeDropdownText}>{commuteStartMinutes}</Text>
                  <Ionicons
                    name={showCommuteStartMinutes ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.GRAY}
                  />
                </TouchableOpacity>
                {showCommuteStartMinutes && (
                  <View style={styles.timeDropdownOptions}>
                    <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                      {minutesOptions.map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={styles.timeOption}
                          onPress={() => {
                            setCommuteStartMinutes(minute);
                            setShowCommuteStartMinutes(false);
                          }}
                          activeOpacity={0.7}>
                          <Text style={styles.timeOptionText}>{minute}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 퇴근/하교 시간 */}
          <View style={styles.commuteTimeSection}>
            <Text style={styles.commuteTimeLabel}>퇴근/하교</Text>
            <View style={styles.timeSelectorContainer}>
              <View style={styles.timeSelectorWrapper}>
                <Text style={styles.timeSelectorLabel}>시</Text>
                <TouchableOpacity
                  style={styles.timeDropdown}
                  onPress={() => setShowCommuteEndHours(!showCommuteEndHours)}
                  activeOpacity={0.7}>
                  <Text style={styles.timeDropdownText}>{commuteEndHours}</Text>
                  <Ionicons
                    name={showCommuteEndHours ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.GRAY}
                  />
                </TouchableOpacity>
                {showCommuteEndHours && (
                  <View style={styles.timeDropdownOptions}>
                    <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                      {hoursOptions.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={styles.timeOption}
                          onPress={() => {
                            setCommuteEndHours(hour);
                            setShowCommuteEndHours(false);
                          }}
                          activeOpacity={0.7}>
                          <Text style={styles.timeOptionText}>{hour}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={styles.timeSelectorWrapper}>
                <Text style={styles.timeSelectorLabel}>분</Text>
                <TouchableOpacity
                  style={styles.timeDropdown}
                  onPress={() => setShowCommuteEndMinutes(!showCommuteEndMinutes)}
                  activeOpacity={0.7}>
                  <Text style={styles.timeDropdownText}>{commuteEndMinutes}</Text>
                  <Ionicons
                    name={showCommuteEndMinutes ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.GRAY}
                  />
                </TouchableOpacity>
                {showCommuteEndMinutes && (
                  <View style={styles.timeDropdownOptions}>
                    <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                      {minutesOptions.map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={styles.timeOption}
                          onPress={() => {
                            setCommuteEndMinutes(minute);
                            setShowCommuteEndMinutes(false);
                          }}
                          activeOpacity={0.7}>
                          <Text style={styles.timeOptionText}>{minute}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
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
            style={[styles.nextButton, submitting && { opacity: 0.85 }]}
            onPress={handleNext}
            disabled={submitting}
            activeOpacity={0.6}>
            {submitting ? (
              <ActivityIndicator color={COLORS.BUTTON_GREEN_TEXT} />
            ) : (
              <Text style={styles.nextButtonText}>{isEditMode ? '저장' : '다음'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
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
    color: COLORS.ASTERISK,
    fontSize: 15,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    lineHeight: 18,
    fontFamily: FONTS.REGULAR,
  },
  locationInputContainer: {
    marginTop: 16,
  },
  placeSection: {
    zIndex: 20,
    elevation: 20,
  },
  timeSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  timeSelectorWrapper: {
    flex: 1,
    position: 'relative',
  },
  timeSelectorLabel: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 8,
    fontFamily: FONTS.REGULAR,
  },
  timeDropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.DROPDOWN_BG,
  },
  timeDropdownText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: FONTS.REGULAR,
  },
  timeDropdownOptions: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.DROPDOWN_BG,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeScrollView: {
    maxHeight: 150,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: FONTS.REGULAR,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.DAY_BUTTON_BORDER,
    backgroundColor: COLORS.DAY_BUTTON_BG,
    minWidth: 44,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.DAY_BUTTON_SELECTED_BG,
    borderColor: COLORS.DAY_BUTTON_SELECTED_BG,
  },
  dayButtonText: {
    fontSize: 13,
    color: '#555555',
    fontFamily: FONTS.REGULAR,
  },
  dayButtonTextSelected: {
    color: COLORS.DAY_BUTTON_SELECTED_TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  commuteTimeSection: {
    marginTop: 20,
  },
  commuteTimeLabel: {
    fontSize: 13,
    color: '#333333',
    marginBottom: 12,
    fontFamily: FONTS.MEDIUM,
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

