import type { ImageSourcePropType } from 'react-native';

const BOOK1 = require('../../assets/images/drawer/book1.png');
const BOOK2 = require('../../assets/images/drawer/book2.png');

export type BookInProgressItem = {
  id: string;
  title: string;
  author: string;
  cover: ImageSourcePropType;
  currentPage: number;
  totalPage: number;
  /** 도서 상세 이동용 */
  bookIdForDetail: string;
};

/** 진행 중 도서 목업 — API 연동 시 교체 */
export const BOOKS_IN_PROGRESS_MOCK: BookInProgressItem[] = [
  {
    id: 'ip1',
    title: '용의자X의 헌신',
    author: '히가시노 게이고',
    cover: BOOK1,
    currentPage: 207,
    totalPage: 459,
    bookIdForDetail: '8928261232',
  },
  {
    id: 'ip2',
    title: '팩트풀니스',
    author: '한스 로슬링 외',
    cover: BOOK2,
    currentPage: 45,
    totalPage: 450,
    bookIdForDetail: '8928261232',
  },
];

export function progressPercent(item: BookInProgressItem): number {
  if (item.totalPage <= 0) return 0;
  return Math.min(100, Math.round((item.currentPage / item.totalPage) * 100));
}
