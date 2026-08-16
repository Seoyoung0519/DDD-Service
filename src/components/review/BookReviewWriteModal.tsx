/**
 * 독서 리뷰 작성 — 반투명 배경 위 흰색 카드 모달 (전체 페이지 라우트 아님)
 * 독서 기간 캘린더를 열면 리뷰 카드는 숨기고, 아래 내서재 + 반투명 검정 + 캘린더만 레이어로 표시
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';
import { createReview, parseReadingPeriodDates } from '@/src/api/reviews';
import type { CompletedBookItem } from '@/src/data/completedBooks';
import { getCompletedBookById } from '@/src/data/completedBooks';

import { ReadingPeriodCalendar } from '@/src/components/review/ReadingPeriodCalendar';

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  BORDER: '#E0E0E0',
  CARD_BG: '#F3F4F6',
  PLACEHOLDER: '#A8A8A8',
  REQUIRED: '#2C6FA8',
  /** 책 선택·리뷰·독서기간 캘린더 배경과 동일한 반투명 검정 */
  OVERLAY: 'rgba(0, 0, 0, 0.72)',
  DIVIDER: '#E8E8E8',
  BTN_INACTIVE_TEXT: '#9E9E9E',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

const MODAL_SIDE = 16;

/** 로컬 날짜만 YYYY-MM-DD (타임존 이슈 완화) */
function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmdToLocal(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map((x) => Number(x));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export type BookReviewWriteModalProps = {
  visible: boolean;
  bookId: string | null;
  /** API 등에서 선택한 책(목업 id가 아닐 때). 있으면 getCompletedBookById보다 우선 */
  bookOverride?: CompletedBookItem | null;
  onClose: () => void;
  /** '이전' — 미지정 시 onClose와 동일 */
  onPrev?: () => void;
  onSubmitSuccess?: () => void;
};

export function BookReviewWriteModal({
  visible,
  bookId,
  bookOverride,
  onClose,
  onPrev,
  onSubmitSuccess,
}: BookReviewWriteModalProps) {
  const insets = useSafeAreaInsets();

  const book = useMemo(() => {
    if (bookOverride) return bookOverride;
    if (bookId) return getCompletedBookById(String(bookId));
    return undefined;
  }, [bookId, bookOverride]);

  const [visibility, setVisibility] = useState('전체 공개용');
  const [readingPeriod, setReadingPeriod] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [periodPickerVisible, setPeriodPickerVisible] = useState(false);
  const [periodApplyReady, setPeriodApplyReady] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(() => new Date());
  const [tempEndDate, setTempEndDate] = useState(() => new Date());

  /** 독서 기간 필드에 시작·종료가 모두 있을 때만 true (캘린더 열면 바로 적용 가능) */
  const initialPeriodHasRange = useMemo(() => {
    const { readingStartDate, readingEndDate } = parseReadingPeriodDates(readingPeriod);
    return !!(readingStartDate && readingEndDate);
  }, [readingPeriod]);

  useEffect(() => {
    if (!visible) {
      setVisibility('전체 공개용');
      setReadingPeriod('');
      setThoughts('');
      setSubmitting(false);
      setPeriodPickerVisible(false);
    }
  }, [visible]);

  /** 시작일이 종료일보다 늦어지면 종료일을 맞춤 */
  useEffect(() => {
    if (!periodPickerVisible) return;
    setTempEndDate((prev) => {
      if (formatYmd(prev) < formatYmd(tempStartDate)) {
        return new Date(tempStartDate);
      }
      return prev;
    });
  }, [tempStartDate, periodPickerVisible]);

  const reviewSubtitle = book?.reviewSubtitle ?? (book ? `${book.author}의 작품` : '');
  const publisherLine = book?.publisherLine ?? (book ? `${book.author} · 문학동네` : '');
  const pubInfo = book?.pubInfo ?? '출간 정보 준비 중';

  const contentLen = thoughts.trim().length;
  const canSubmit =
    contentLen >= 1 && contentLen <= 2000 && !submitting;

  const handlePrev = () => {
    if (submitting) return;
    (onPrev ?? onClose)();
  };

  const handleSubmit = async () => {
    if (!book || !canSubmit) return;
    const targetBookId = (book.bookIdForDetail ?? book.id).trim();
    if (!targetBookId) {
      Alert.alert('오류', '도서 ID가 없어 리뷰를 등록할 수 없습니다.');
      return;
    }

    const { readingStartDate, readingEndDate } = parseReadingPeriodDates(readingPeriod);
    const content = thoughts.trim();

    try {
      setSubmitting(true);
      await createReview({
        bookId: targetBookId,
        readingStartDate,
        readingEndDate,
        content,
        isPublic: visibility === '전체 공개용',
      });
      onSubmitSuccess?.();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '리뷰 등록에 실패했습니다.';
      Alert.alert('오류', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openPeriodPicker = () => {
    if (submitting) return;
    const { readingStartDate, readingEndDate } = parseReadingPeriodDates(readingPeriod);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setTempStartDate(readingStartDate ? parseYmdToLocal(readingStartDate) : new Date(today));
    setTempEndDate(readingEndDate ? parseYmdToLocal(readingEndDate) : new Date(today));
    setPeriodPickerVisible(true);
  };

  const applyPeriodRange = () => {
    if (!periodApplyReady) return;
    const s = new Date(tempStartDate);
    s.setHours(12, 0, 0, 0);
    const e = new Date(tempEndDate);
    e.setHours(12, 0, 0, 0);
    if (e.getTime() < s.getTime()) {
      Alert.alert('알림', '종료일은 시작일과 같거나 이후여야 합니다.');
      return;
    }
    setReadingPeriod(`${formatYmd(s)} ~ ${formatYmd(e)}`);
    setPeriodPickerVisible(false);
  };

  const handleModalHardwareBack = () => {
    if (periodPickerVisible) {
      setPeriodPickerVisible(false);
      return;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleModalHardwareBack}>
      <View style={styles.modalRoot}>
        {periodPickerVisible ? (
          /** 리뷰 카드는 렌더하지 않음: 투명 모달 아래 내서재 → 반투명 검정 → 캘린더만 */
          <View style={[styles.periodOnlyRoot, { paddingTop: insets.top }]} pointerEvents="box-none">
            <Pressable
              style={styles.periodBackdrop}
              onPress={() => setPeriodPickerVisible(false)}
              accessibilityLabel="독서 기간 선택 닫기"
            />
            <View style={styles.periodCardOuter} pointerEvents="box-none">
              <View style={styles.periodCard}>
                <Text style={styles.periodModalTitle}>독서 기간</Text>
                <Text style={styles.periodModalHint}>
                  달력에서 시작일을 누른 뒤, 종료일을 한 번 더 눌러 기간을 정한 다음 적용을 눌러 주세요.
                </Text>

                <ScrollView
                  style={styles.periodScroll}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={false}>
                  <ReadingPeriodCalendar
                    pickerVisible={periodPickerVisible}
                    initialHasRange={initialPeriodHasRange}
                    onApplyReadyChange={setPeriodApplyReady}
                    startDate={tempStartDate}
                    endDate={tempEndDate}
                    onRangeChange={(start, end) => {
                      setTempStartDate(start);
                      setTempEndDate(end);
                    }}
                  />
                </ScrollView>

                <View style={styles.periodActions}>
                  <TouchableOpacity
                    style={styles.periodBtnCancel}
                    onPress={() => setPeriodPickerVisible(false)}
                    activeOpacity={0.85}>
                    <Text style={styles.periodBtnCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodBtnApply, !periodApplyReady && styles.periodBtnApplyDisabled]}
                    onPress={applyPeriodRange}
                    disabled={!periodApplyReady}
                    activeOpacity={periodApplyReady ? 0.85 : 1}>
                    <Text
                      style={[
                        styles.periodBtnApplyText,
                        !periodApplyReady && styles.periodBtnApplyTextDisabled,
                      ]}>
                      적용
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.kavRoot}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
            <Pressable style={[styles.overlay, { paddingTop: Math.max(insets.top, 12) }]} onPress={onClose}>
              <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                {!book ? (
                  <View style={styles.fallbackInner}>
                    <Text style={styles.fallbackText}>도서 정보를 불러올 수 없습니다.</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={8}>
                      <Text style={styles.fallbackLink}>닫기</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <KeyboardAwareScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}
                    bounces={false}>
                    <View style={styles.headerRow}>
                      <View style={styles.headerLeft}>
                        <View style={styles.titleRow}>
                          <Text style={styles.pageTitle} numberOfLines={2}>
                            {book.title}
                          </Text>
                          <TouchableOpacity
                            style={styles.visibilityBtn}
                            activeOpacity={0.7}
                            onPress={() => {
                              setVisibility((v) => (v === '전체 공개용' ? '비공개' : '전체 공개용'));
                            }}>
                            <Ionicons name="swap-vertical" size={14} color={COLORS.SUBTITLE} />
                            <Text style={styles.visibilityText}>{visibility}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.btnPrev} onPress={handlePrev} activeOpacity={0.85}>
                          <Text style={styles.btnPrevText}>이전</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnSubmit, !canSubmit && styles.btnSubmitDisabled]}
                          onPress={() => void handleSubmit()}
                          disabled={!canSubmit}
                          activeOpacity={canSubmit ? 0.85 : 1}>
                          {submitting ? (
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                          ) : (
                            <Text
                              style={[styles.btnSubmitText, !canSubmit && styles.btnSubmitTextDisabled]}>
                              추가
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.headerDivider} />

                    <View style={styles.bookCard}>
                      <Text style={styles.bookCardTitle}>{book.title}</Text>
                      <Text style={styles.bookCardSubtitle}>{reviewSubtitle}</Text>
                      <Image source={book.cover} style={styles.bookCover} resizeMode="cover" />
                      <Text style={styles.bookMeta}>{publisherLine}</Text>
                      <Text style={styles.bookPub}>{pubInfo}</Text>
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.label}>
                        독서기간 <Text style={styles.optionalHint}> (선택)</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.inputRow}
                        onPress={openPeriodPicker}
                        disabled={submitting}
                        activeOpacity={0.85}>
                        <Text
                          style={[
                            styles.inputPeriodText,
                            !readingPeriod.trim() && styles.inputPeriodPlaceholder,
                          ]}
                          numberOfLines={1}>
                          {readingPeriod.trim() ? readingPeriod : '날짜를 선택해 주세요'}
                        </Text>
                        <View style={styles.calendarBtn}>
                          <Ionicons name="calendar-outline" size={22} color={COLORS.SUBTITLE} />
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.label}>
                        나의 감상 <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.inputThoughts}
                        placeholder="나의 감상 / 책을 읽고 느꼈던 생각이나 감정을 간단히 적어보세요. 책의 여운이 더 오래 남을 거예요."
                        placeholderTextColor={COLORS.PLACEHOLDER}
                        value={thoughts}
                        onChangeText={setThoughts}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                    </KeyboardAwareScrollView>
                )}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    position: 'relative',
  },
  kavRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    paddingHorizontal: MODAL_SIDE,
    paddingBottom: 16,
  },
  card: {
    maxHeight: '88%',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  scroll: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  fallbackInner: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 15,
    color: COLORS.SUBTITLE,
    marginBottom: 16,
    textAlign: 'center',
  },
  fallbackLink: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.DIVIDER,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    flexShrink: 1,
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    lineHeight: 26,
  },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  visibilityText: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
    flexShrink: 0,
  },
  btnPrev: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  btnPrevText: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT,
  },
  btnSubmit: {
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.BACKGROUND,
  },
  btnSubmitDisabled: {
    borderColor: COLORS.BORDER,
    opacity: 0.55,
  },
  btnSubmitText: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  btnSubmitTextDisabled: {
    color: COLORS.BTN_INACTIVE_TEXT,
  },
  bookCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  bookCardTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 4,
  },
  bookCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    marginBottom: 12,
  },
  bookCover: {
    width: 120,
    height: 168,
    borderRadius: 8,
    backgroundColor: '#DDD',
    marginBottom: 12,
  },
  bookMeta: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    marginBottom: 4,
  },
  bookPub: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
  },
  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  required: {
    color: COLORS.REQUIRED,
    fontFamily: FONTS.REGULAR,
  },
  optionalHint: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    fontWeight: '400',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputPeriodText: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    color: COLORS.TEXT,
  },
  inputPeriodPlaceholder: {
    color: COLORS.PLACEHOLDER,
  },
  calendarBtn: {
    padding: 4,
  },
  /** 독서 기간만 전체 화면 — 리뷰 카드 미렌더, 아래는 투명 모달 너머 내서재 */
  periodOnlyRoot: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
    ...Platform.select({
      android: { elevation: 24 },
    }),
  },
  /** 리뷰 모달·내서재 전체를 덮는 반투명 검정 */
  periodBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.OVERLAY,
  },
  periodCardOuter: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '92%',
    zIndex: 2,
  },
  periodCard: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    ...Platform.select({
      android: { elevation: 26 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
    }),
  },
  periodModalTitle: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  periodModalHint: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 19,
    marginBottom: 12,
  },
  periodScroll: {
    maxHeight: Platform.OS === 'ios' ? 440 : 420,
  },
  periodActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  periodBtnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  periodBtnCancelText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT,
  },
  periodBtnApply: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
  },
  periodBtnApplyDisabled: {
    backgroundColor: '#C5C5C5',
  },
  periodBtnApplyText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  periodBtnApplyTextDisabled: {
    color: '#EEEEEE',
  },
  inputThoughts: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    backgroundColor: COLORS.BACKGROUND,
    fontSize: 15,
    color: COLORS.TEXT,
    minHeight: 160,
    paddingHorizontal: 12,
    paddingVertical: 12,
    lineHeight: 22,
  },
});
