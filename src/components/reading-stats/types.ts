import type { ReadingStatsOut } from '@/src/api/library';

/** 대독 통계 카드에 표시할 수치 (API 연동 시 동일 스키마로 매핑 가능) */
export type ReadingStatsData = {
  booksRead: number;
  maxBooksRead: number;
  streakDays: number;
  maxStreakDays: number;
};

/** 기본 예시 데이터 — API 미연동·폴백용 */
export const DEFAULT_READING_STATS: ReadingStatsData = {
  booksRead: 6,
  maxBooksRead: 10,
  streakDays: 6,
  maxStreakDays: 30,
};

/** API 실패 시 또는 로딩 전 — 막대 0 기준 */
export const EMPTY_READING_STATS: ReadingStatsData = {
  booksRead: 0,
  maxBooksRead: 10,
  streakDays: 0,
  maxStreakDays: 30,
};

/**
 * GET `/library/stats` 응답 → StatsCard용
 * - 막대 상한: 완독은 최소 10권 스케일, 연속 일은 최소 30일 스케일 (현재값 초과 시 확장)
 */
export function readingStatsOutToCardData(out: ReadingStatsOut): ReadingStatsData {
  const completed = Math.max(0, Math.floor(out.thisMonthCompleted));
  const streak = Math.max(0, Math.floor(out.consecutiveDays));
  return {
    booksRead: completed,
    maxBooksRead: Math.max(10, completed),
    streakDays: streak,
    maxStreakDays: Math.max(30, streak),
  };
}
