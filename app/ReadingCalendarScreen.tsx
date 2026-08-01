/**
 * 독서 캘린더 — 내 서재 캘린더 '전체보기'에서 진입
 * GET `/library/calendar?year=&month=` (LIBRARY_API_BASE_URL)
 */
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  calendarDayHasReading,
  calendarIndexedHasAnyReading,
  fetchLibraryCalendar,
  indexCalendarDaysByDayOfMonth,
  type CalendarDayOut,
} from '@/src/api/library';
import {
  deleteReadingProof,
  listMyProofsForMonth,
  proofLocalDateKey,
  type ProofListItem,
} from '@/src/api/proofUpload';

const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_TAB_ICON = require('../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#888888',
  BACKGROUND: '#FFFFFF',
  BORDER: '#EAEAEA',
  /** 요일 행 바탕 */
  WEEK_HEADER_BG: '#F0F2F5',
  MODAL_OVERLAY: 'rgba(0, 0, 0, 0.5)',
  MODAL_SECTION_BG: '#F7F8FA',
  /** 일별 상세 모달 하단 닫기 버튼 (시안: 연회 박스) */
  MODAL_CLOSE_BTN_BG: '#D9D9D9',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function buildCalendarGrid(year: number, monthIndex: number): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const pad = first.getDay();
  const total = last.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function chunkWeeks(cells: (number | null)[]): (number | null)[][] {
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = [];
  cells.forEach((c) => {
    row.push(c);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  });
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

/** capturedAt/createdAt 기준 최신 인증샷 1장 */
function pickLatestProof(items: ProofListItem[]): ProofListItem | null {
  const withImage = items.filter((p) => Boolean(p.imageUrl?.trim() || p.id));
  if (withImage.length === 0) return null;
  return withImage.reduce((latest, cur) => {
    const a = Date.parse(latest.capturedAt ?? latest.createdAt ?? '') || 0;
    const b = Date.parse(cur.capturedAt ?? cur.createdAt ?? '') || 0;
    return b >= a ? cur : latest;
  });
}

export default function ReadingCalendarScreen() {
  const router = useRouter();
  const [viewDate, setViewDate] = useState(() => new Date());
  /** 모달에 표시할 일 (null이면 닫힘) */
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [calendarByDay, setCalendarByDay] = useState<Record<number, CalendarDayOut>>({});
  /** 날짜(일) → 해당일 인증샷 목록 (GET /proofs 병합) */
  const [proofsByDay, setProofsByDay] = useState<Record<number, ProofListItem[]>>({});
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [deletingProofId, setDeletingProofId] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthNum = monthIndex + 1;

  const calendarCells = useMemo(
    () => buildCalendarGrid(year, monthIndex),
    [year, monthIndex],
  );

  const calendarWeeks = useMemo(() => chunkWeeks(calendarCells), [calendarCells]);

  const monthLabel = `${year}년${String(monthIndex + 1).padStart(2, '0')}월`;

  useEffect(() => {
    let cancelled = false;
    setCalendarLoading(true);
    setCalendarError(null);
    /** 이전 월 썸네일이 남지 않도록 즉시 비움 (달 넘기기 후 빈 월 UI) */
    setCalendarByDay({});
    setProofsByDay({});
    void (async () => {
      try {
        const [data, monthProofs] = await Promise.all([
          fetchLibraryCalendar(year, monthNum),
          listMyProofsForMonth(year, monthNum),
        ]);
        if (cancelled) return;

        const byDay = indexCalendarDaysByDayOfMonth(data.days);
        const proofsMap: Record<number, ProofListItem[]> = {};

        for (const proof of monthProofs) {
          const key = proofLocalDateKey(proof.capturedAt ?? proof.createdAt);
          if (!key) continue;
          const parts = key.split('-').map((x) => Number(x));
          if (parts[0] !== year || parts[1] !== monthNum) continue;
          const dayNum = parts[2];
          if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 31) continue;
          if (!proofsMap[dayNum]) proofsMap[dayNum] = [];
          proofsMap[dayNum].push(proof);
        }

        // 날짜별 최신 인증샷만 캘린더 썸네일·ID에 반영
        for (const [dayKey, list] of Object.entries(proofsMap)) {
          const dayNum = Number(dayKey);
          const latest = pickLatestProof(list);
          if (!latest) continue;
          const entry = byDay[dayNum];
          if (entry) {
            byDay[dayNum] = {
              ...entry,
              proofId: latest.id,
              proofImageUrl: latest.imageUrl ?? entry.proofImageUrl ?? null,
            };
          } else if (latest.imageUrl) {
            byDay[dayNum] = {
              date: proofLocalDateKey(latest.capturedAt ?? latest.createdAt) ?? `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
              proofId: latest.id,
              proofImageUrl: latest.imageUrl,
            };
          }
        }

        setCalendarByDay(byDay);
        setProofsByDay(proofsMap);
      } catch (e) {
        if (cancelled) return;
        if (__DEV__) {
          console.warn('[ReadingCalendarScreen] 캘린더 조회 실패:', e);
        }
        setCalendarByDay({});
        setProofsByDay({});
        setCalendarError(
          typeof e === 'object' && e != null && 'message' in e
            ? String((e as { message: unknown }).message)
            : '캘린더를 불러오지 못했습니다.',
        );
      } finally {
        if (!cancelled) setCalendarLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, monthNum]);

  const goPrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const selectedEntry =
    selectedDay != null ? calendarByDay[selectedDay] : undefined;
  const modalTitle =
    selectedDay != null
      ? `${String(monthIndex + 1).padStart(2, '0')}월 ${selectedDay}일`
      : '';

  let pagesLine = '-';
  if (selectedEntry) {
    const start = selectedEntry.readPageStart;
    const end = selectedEntry.readPageEnd;
    if (start != null && end != null) {
      pagesLine = `${start}p - ${end}p`;
    } else if (start != null || end != null) {
      pagesLine = `${start ?? '-'}p - ${end ?? '-'}p`;
    }
  }

  /** 선택 일 — 최신 인증샷 1장만 표시 */
  const selectedDayProof = useMemo((): ProofListItem | null => {
    if (selectedDay == null) return null;
    const fromList = proofsByDay[selectedDay];
    if (fromList && fromList.length > 0) {
      return pickLatestProof(fromList);
    }
    const url = selectedEntry?.proofImageUrl?.trim();
    if (!url) return null;
    return {
      id: selectedEntry?.proofId?.trim() || '',
      imageUrl: url,
      bookId: selectedEntry?.bookId ?? null,
      capturedAt: null,
      createdAt: null,
    };
  }, [selectedDay, proofsByDay, selectedEntry]);

  const confirmDeleteProof = (proof: ProofListItem) => {
    const proofId = proof.id?.trim();
    if (!proofId || selectedDay == null || deletingProofId) {
      if (!proofId) {
        Alert.alert(
          '삭제 불가',
          '이 인증샷의 ID를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
      return;
    }

    Alert.alert(
      '인증샷 삭제',
      '이 인증샷을 삭제할까요? 삭제 후에는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => void executeDeleteProof(proofId, selectedDay),
        },
      ],
    );
  };

  const executeDeleteProof = async (proofId: string, day: number) => {
    setDeletingProofId(proofId);
    try {
      await deleteReadingProof(proofId);
      setProofsByDay((prevProofs) => {
        const remaining = (prevProofs[day] ?? []).filter((p) => p.id !== proofId);
        const nextProofs = { ...prevProofs };
        if (remaining.length === 0) delete nextProofs[day];
        else nextProofs[day] = remaining;

        const next = pickLatestProof(remaining);
        setCalendarByDay((prevCal) => {
          const entry = prevCal[day];
          if (!entry) return prevCal;
          return {
            ...prevCal,
            [day]: {
              ...entry,
              proofId: next?.id ?? null,
              proofImageUrl: next?.imageUrl ?? null,
            },
          };
        });

        return nextProofs;
      });
      Alert.alert('인증샷을 삭제했습니다');
    } catch (error) {
      Alert.alert(
        '삭제 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setDeletingProofId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>독서 캘린더</Text>
        <View style={styles.topBarRight} />
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.monthArrow} onPress={goPrevMonth} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
        <Text style={styles.monthNavText}>{monthLabel}</Text>
        <TouchableOpacity style={styles.monthArrow} onPress={goNextMonth} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color={COLORS.SUBTITLE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {calendarLoading ? (
          <View style={styles.calendarLoading}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.calendarLoadingText}>캘린더 불러오는 중…</Text>
          </View>
        ) : calendarError ? (
          <Text style={styles.calendarErrorText}>{calendarError}</Text>
        ) : null}
        {!calendarLoading &&
        !calendarError &&
        !calendarIndexedHasAnyReading(calendarByDay) ? (
          <Text style={styles.calendarEmptyText}>읽은 책이 없습니다.</Text>
        ) : null}
        <View style={styles.weekRow}>
          {WEEK_LABELS.map((w) => (
            <View key={w} style={styles.weekCellWrap}>
              <Text style={styles.weekCell}>{w}</Text>
            </View>
          ))}
        </View>
        {calendarWeeks.map((week, wi) => (
          <View key={wi} style={styles.calWeekRow}>
            {week.map((day, di) => {
              if (day === null) {
                return <View key={`e-${wi}-${di}`} style={styles.calDayFlex} />;
              }
              const dayEntry = calendarByDay[day];
              const canOpen = calendarDayHasReading(dayEntry);
              const thumbUri = dayEntry?.bookThumbnailUrl?.trim();
              return (
                <View key={`${wi}-${day}-${di}`} style={styles.calDayFlex}>
                  <View style={styles.dayCell}>
                    <Text style={styles.dayNum}>{day}</Text>
                    {canOpen ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setSelectedDay(day)}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                        {thumbUri ? (
                          <ExpoImage
                            source={{ uri: thumbUri }}
                            style={styles.dayThumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.dayThumb, styles.dayThumbMuted]} />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.dayThumbPlaceholder} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={selectedDay != null && calendarDayHasReading(selectedEntry)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedDay(null)}>
        <Pressable style={styles.dayModalOverlay} onPress={() => setSelectedDay(null)}>
          <Pressable style={styles.dayModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dayModalBody}>
              <Text style={styles.dayModalTitle}>{modalTitle}</Text>

              <Text style={styles.dayModalSectionLabel}>읽은 책</Text>
              <View style={styles.dayModalBookRow}>
                {selectedEntry ? (
                  <>
                    {selectedEntry.bookThumbnailUrl ? (
                      <ExpoImage
                        source={{ uri: selectedEntry.bookThumbnailUrl }}
                        style={styles.dayModalCover}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.dayModalCover, styles.dayModalCoverPlaceholder]} />
                    )}
                    <View style={styles.dayModalBookText}>
                      <Text style={styles.dayModalBookTitle} numberOfLines={3}>
                        {selectedEntry.bookTitle?.trim() || '제목 없음'}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              <Text style={styles.dayModalSectionLabel}>읽은 쪽수</Text>
              <View style={styles.dayModalSectionBox}>
                <Text style={styles.dayModalSectionBody}>{pagesLine}</Text>
              </View>

              {selectedDayProof?.imageUrl?.trim() ? (
                <>
                  <View style={styles.dayModalRecordHeader}>
                    <Text style={[styles.dayModalSectionLabel, styles.dayModalRecordLabel]}>
                      오늘의 기록
                    </Text>
                    <TouchableOpacity
                      style={styles.dayModalDeleteBtn}
                      onPress={() => confirmDeleteProof(selectedDayProof)}
                      disabled={deletingProofId != null}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {deletingProofId === selectedDayProof.id ? (
                        <ActivityIndicator size="small" color="#B33B3B" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={16} color="#B33B3B" />
                          <Text style={styles.dayModalDeleteBtnText}>삭제</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <ExpoImage
                    source={{ uri: selectedDayProof.imageUrl.trim() }}
                    style={styles.dayModalRecordImage}
                    contentFit="cover"
                  />
                </>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.dayModalCloseBtn}
              activeOpacity={0.85}
              onPress={() => setSelectedDay(null)}>
              <Text style={styles.dayModalCloseBtnText}>닫기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/Drawer_1')}>
          <Image source={TODAY_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>투데이</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/ReadingIntroScreen')}>
          <Image source={READING_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>책읽기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/SearchScreen_1')}>
          <Image source={SEARCH_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>검색</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/my-library')}>
          <Image
            source={LIBRARY_TAB_ICON}
            style={[styles.navIcon, { tintColor: COLORS.PRIMARY }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>내서재</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 10,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  topBarRight: {
    width: 44,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  monthArrow: {
    padding: 4,
    marginHorizontal: 4,
  },
  monthNavText: {
    fontSize: 17,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    minWidth: 150,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  calendarLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  calendarLoadingText: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    marginLeft: 10,
  },
  calendarErrorText: {
    fontSize: 13,
    color: '#C62828',
    marginBottom: 10,
    fontFamily: FONTS.REGULAR,
  },
  calendarEmptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  weekRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.WEEK_HEADER_BG,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  weekCellWrap: {
    flex: 1,
    alignItems: 'center',
  },
  weekCell: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },
  calWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calDayFlex: {
    flex: 1,
    alignItems: 'center',
    minHeight: 72,
  },
  dayCell: {
    alignItems: 'center',
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 12,
    color: COLORS.TEXT,
    marginBottom: 4,
    fontFamily: FONTS.REGULAR,
  },
  dayThumb: {
    width: 32,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#EEE',
  },
  dayThumbPlaceholder: {
    width: 32,
    height: 44,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  dayThumbMuted: {
    backgroundColor: '#E0E0E0',
  },
  bottomNav: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 50,
    height: 25,
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  navLabelActive: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },

  dayModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  dayModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 22,
    overflow: 'hidden',
    padding: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dayModalBody: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  dayModalTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 18,
  },
  dayModalSectionLabel: {
    fontSize: 13,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.SUBTITLE,
    marginBottom: 8,
  },
  dayModalBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayModalCover: {
    width: 56,
    height: 78,
    borderRadius: 6,
    backgroundColor: '#EEE',
    marginRight: 14,
  },
  dayModalCoverPlaceholder: {
    backgroundColor: '#E8E8E8',
  },
  dayModalBookText: {
    flex: 1,
    minWidth: 0,
  },
  dayModalBookTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 6,
    lineHeight: 22,
  },
  dayModalSectionBox: {
    backgroundColor: COLORS.MODAL_SECTION_BG,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 0,
  },
  dayModalSectionBody: {
    fontSize: 15,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
  },
  dayModalRecordLabel: {
    marginTop: 16,
    marginBottom: 0,
  },
  dayModalRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 28,
  },
  dayModalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dayModalDeleteBtnText: {
    fontSize: 13,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: '#B33B3B',
  },
  dayModalRecordImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 320,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  dayModalCloseBtn: {
    width: '100%',
    minHeight: 64,
    backgroundColor: COLORS.MODAL_CLOSE_BTN_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  dayModalCloseBtnText: {
    fontSize: 17,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
});
