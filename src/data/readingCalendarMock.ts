import type { ImageSourcePropType } from 'react-native';

const BOOK1 = require('../../assets/images/drawer/book1.png');
const BOOK2 = require('../../assets/images/drawer/book2.png');

export type ReadingDayEntry = {
  cover: ImageSourcePropType;
  title: string;
  author: string;
  pagesFrom: number;
  pagesTo: number;
  /** 오늘의 기록 (없으면 빈 영역) */
  note?: string;
};

/** 캘린더 그리드·모달 공통 — 일(1~31)별 독서 목업 (월 무관, API 연동 시 교체) */
const DAY_ENTRIES: Partial<Record<number, ReadingDayEntry>> = {
  2: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 48,
    pagesTo: 72,
  },
  3: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 72,
    pagesTo: 95,
  },
  4: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 95,
    pagesTo: 120,
  },
  5: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 120,
    pagesTo: 140,
  },
  6: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 140,
    pagesTo: 165,
  },
  8: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 20,
    pagesTo: 55,
  },
  9: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 55,
    pagesTo: 88,
  },
  11: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 88,
    pagesTo: 120,
  },
  12: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 120,
    pagesTo: 145,
  },
  15: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 145,
    pagesTo: 180,
  },
  16: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 165,
    pagesTo: 190,
  },
  17: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 190,
    pagesTo: 210,
  },
  18: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 210,
    pagesTo: 235,
  },
  19: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 235,
    pagesTo: 260,
  },
  20: {
    cover: BOOK1,
    title: '밤은 눈을 감지 않는다',
    author: '메리쿠비카',
    pagesFrom: 260,
    pagesTo: 285,
  },
  22: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 160,
    pagesTo: 200,
  },
  24: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 200,
    pagesTo: 240,
  },
  25: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 240,
    pagesTo: 275,
  },
  29: {
    cover: BOOK2,
    title: '팩트풀니스',
    author: '한스 로슬링, 올라 로슬링',
    pagesFrom: 275,
    pagesTo: 310,
  },
};

export function getReadingDayEntry(day: number): ReadingDayEntry | undefined {
  return DAY_ENTRIES[day];
}

/** @deprecated 표지만 필요할 때 — getReadingDayEntry(day)?.cover 사용 권장 */
export const READING_BY_DAY_MOCK: Partial<Record<number, ImageSourcePropType>> =
  Object.fromEntries(
    (Object.entries(DAY_ENTRIES) as [string, ReadingDayEntry][]).map(([d, e]) => [
      Number(d),
      e.cover,
    ]),
  ) as Partial<Record<number, ImageSourcePropType>>;
