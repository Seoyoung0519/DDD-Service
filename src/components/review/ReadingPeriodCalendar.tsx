/**
 * 독서 기간용 월간 캘린더 (시작일·종료일 범위 선택)
 * — 네이티브 DateTimePicker 대신 동일 모달 안에서 동작하도록 순수 RN 뷰로 구현
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 로컬 날짜만 비교 (시간 제거) */
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function compareDay(a: Date, b: Date): number {
  const x = stripTime(a).getTime();
  const y = stripTime(b).getTime();
  return x === y ? 0 : x < y ? -1 : 1;
}

function isBetweenInclusive(day: Date, start: Date, end: Date): boolean {
  const c = compareDay(day, start);
  const c2 = compareDay(day, end);
  return c >= 0 && c2 <= 0;
}

type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthLast = new Date(year, monthIndex, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const d = prevMonthLast - i;
    cells.push({
      date: new Date(year, monthIndex - 1, d, 12, 0, 0, 0),
      inCurrentMonth: false,
    });
  }
  for (let d = 1; d <= lastDay; d++) {
    cells.push({
      date: new Date(year, monthIndex, d, 12, 0, 0, 0),
      inCurrentMonth: true,
    });
  }
  const next = 1;
  let n = next;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({
      date: new Date(year, monthIndex + 1, n, 12, 0, 0, 0),
      inCurrentMonth: false,
    });
    n += 1;
  }

  return cells;
}

type SelectionPhase = 'idle' | 'need-end' | 'complete';

export type ReadingPeriodCalendarProps = {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  /** 오버레이가 열릴 때마다 true로 넘기면 내부 '종료일 대기' 상태를 초기화 */
  pickerVisible?: boolean;
  /** 필드에 이미 시작·종료일이 있으면 처음부터 적용 가능(complete) */
  initialHasRange?: boolean;
  /** 시작~종료 선택이 끝났을 때만 true (적용 버튼 활성화용) */
  onApplyReadyChange?: (ready: boolean) => void;
};

/**
 * idle → 첫 탭 → need-end → 둘째 탭 → complete. complete에서 날짜 탭 시 다시 need-end.
 */
export function ReadingPeriodCalendar({
  startDate,
  endDate,
  onRangeChange,
  pickerVisible = true,
  initialHasRange = false,
  onApplyReadyChange,
}: ReadingPeriodCalendarProps) {
  const initialMonth = useMemo(() => stripTime(startDate), [startDate]);
  const [visibleYear, setVisibleYear] = useState(initialMonth.getFullYear());
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(initialMonth.getMonth());
  const [phase, setPhase] = useState<SelectionPhase>('idle');

  const prevPickerVisible = useRef(false);

  /** 오버레이가 열릴 때: 기존 기간 있음 → complete(적용 가능), 없음 → idle(종료일까지 선택 필요) */
  useEffect(() => {
    if (pickerVisible) {
      setPhase(initialHasRange ? 'complete' : 'idle');
    }
  }, [pickerVisible, initialHasRange]);

  useEffect(() => {
    onApplyReadyChange?.(phase === 'complete');
  }, [phase, onApplyReadyChange]);

  /** 오버레이가 막 열릴 때만 표시 월을 시작일 기준으로 맞춤 */
  useEffect(() => {
    if (pickerVisible && !prevPickerVisible.current) {
      const d = stripTime(startDate);
      setVisibleYear(d.getFullYear());
      setVisibleMonthIndex(d.getMonth());
    }
    prevPickerVisible.current = !!pickerVisible;
  }, [pickerVisible, startDate]);

  const titleText = useMemo(
    () => `${visibleYear}년 ${visibleMonthIndex + 1}월`,
    [visibleYear, visibleMonthIndex],
  );

  const grid = useMemo(
    () => buildMonthGrid(visibleYear, visibleMonthIndex),
    [visibleYear, visibleMonthIndex],
  );

  const goPrevMonth = useCallback(() => {
    setVisibleMonthIndex((m) => {
      if (m === 0) {
        setVisibleYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setVisibleMonthIndex((m) => {
      if (m === 11) {
        setVisibleYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const goToday = useCallback(() => {
    const t = stripTime(new Date());
    setVisibleYear(t.getFullYear());
    setVisibleMonthIndex(t.getMonth());
    onRangeChange(t, t);
    setPhase('complete');
  }, [onRangeChange]);

  const onDayPress = useCallback(
    (day: Date) => {
      const d = stripTime(day);
      if (phase === 'idle') {
        onRangeChange(d, d);
        setPhase('need-end');
        return;
      }
      if (phase === 'need-end') {
        const s = stripTime(startDate);
        const e = d;
        if (compareDay(e, s) < 0) {
          onRangeChange(e, s);
        } else {
          onRangeChange(s, e);
        }
        setPhase('complete');
        return;
      }
      // complete — 새 기간 시작
      onRangeChange(d, d);
      setPhase('need-end');
    },
    [phase, onRangeChange, startDate],
  );

  const sStrip = stripTime(startDate);
  const eStrip = stripTime(endDate);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{titleText}</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={goToday} hitSlop={8} style={styles.todayBtn}>
            <Text style={styles.todayText}>오늘</Text>
          </Pressable>
          <Pressable onPress={goPrevMonth} hitSlop={8} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color="#374151" />
          </Pressable>
          <Pressable onPress={goNextMonth} hitSlop={8} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color="#374151" />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEK_LABELS.map((w) => (
          <Text key={w} style={styles.weekLabel}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((cell, idx) => {
          const inRange = isBetweenInclusive(cell.date, sStrip, eStrip);
          const isStart = sameDay(cell.date, sStrip);
          const isEnd = sameDay(cell.date, eStrip);
          const showRangeFill = inRange && !(isStart && isEnd && compareDay(sStrip, eStrip) === 0);
          const singleSelected = isStart && isEnd && compareDay(sStrip, eStrip) === 0;

          return (
            <Pressable
              key={`${cell.date.getTime()}-${idx}`}
              style={styles.cell}
              onPress={() => onDayPress(cell.date)}
              accessibilityRole="button"
              accessibilityLabel={`${cell.date.getMonth() + 1}월 ${cell.date.getDate()}일`}>
              <View
                style={[
                  styles.cellInner,
                  showRangeFill && !singleSelected && styles.cellRangeFill,
                  (isStart || isEnd) && styles.cellEndpoint,
                ]}>
                <Text
                  style={[
                    styles.dayNum,
                    !cell.inCurrentMonth && styles.dayNumMuted,
                    (isStart || isEnd) && styles.dayNumOnPrimary,
                  ]}>
                  {cell.date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        {phase === 'idle'
          ? '시작일을 눌러 주세요.'
          : phase === 'need-end'
            ? '종료일을 눌러 기간을 완성해 주세요.'
            : '기간이 선택되었습니다. 적용을 누르거나 날짜를 다시 눌러 변경할 수 있어요.'}
      </Text>
    </View>
  );
}

const RANGE_BLUE = '#2563EB';
const RANGE_BLUE_SOFT = '#DBEAFE';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 4,
  },
  todayText: {
    fontSize: 15,
    fontWeight: '600',
    color: RANGE_BLUE,
  },
  navBtn: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  cellInner: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  dayNumMuted: {
    color: '#C4C4C4',
    fontWeight: '400',
  },
  dayNumOnPrimary: {
    color: '#FFFFFF',
  },
  cellRangeFill: {
    backgroundColor: RANGE_BLUE_SOFT,
    borderRadius: 0,
  },
  cellEndpoint: {
    backgroundColor: RANGE_BLUE,
    borderRadius: 10,
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    textAlign: 'center',
  },
});
