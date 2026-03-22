import type { ImageSourcePropType } from 'react-native';

const BOOK1 = require('../../assets/images/drawer/book1.png');
const BOOK2 = require('../../assets/images/drawer/book2.png');

export type CompletedBookItem = {
  id: string;
  title: string;
  author: string;
  cover: ImageSourcePropType;
  /** 도서 상세 (알라딘 item id 등) */
  bookIdForDetail?: string;
  /** 리뷰 작성 화면 부제 등 */
  reviewSubtitle?: string;
  publisherLine?: string;
  pubInfo?: string;
};

export function getCompletedBookById(id: string): CompletedBookItem | undefined {
  return COMPLETED_BOOKS_GRID.find((b) => b.id === id);
}

/** 완독 도서 목업 — API 연동 시 교체 */
export const COMPLETED_BOOKS_GRID: CompletedBookItem[] = [
  { id: 'cb1', title: '그린 레터', author: '황모과', cover: BOOK1, bookIdForDetail: '8928261232' },
  {
    id: 'cb2',
    title: '긴키 지방의 어느 장소에 대하여',
    author: '세스지',
    cover: BOOK2,
    bookIdForDetail: '8928261232',
  },
  {
    id: 'cb3',
    title: '사랑과 결함',
    author: '예소연',
    cover: BOOK1,
    bookIdForDetail: '8928261232',
    reviewSubtitle: '예소연의 첫 소설집',
    publisherLine: '예소연 · 문학동네',
    pubInfo: '2024. 07. 26 출간 364쪽',
  },
  { id: 'cb4', title: '우중괴담', author: '미쓰다 신조', cover: BOOK2, bookIdForDetail: '8928261232' },
  {
    id: 'cb5',
    title: '죽은 왕녀를 위한 파반느',
    author: '박민규',
    cover: BOOK1,
    bookIdForDetail: '8928261232',
  },
  {
    id: 'cb6',
    title: '우리가 겨울을 지나온 방식',
    author: '문미순',
    cover: BOOK2,
    bookIdForDetail: '8928261232',
  },
  { id: 'cb7', title: '로기완을 만났다', author: '조해진', cover: BOOK1, bookIdForDetail: '8928261232' },
  { id: 'cb8', title: '밤은 눈을 감지 않는다', author: '메리쿠비카', cover: BOOK2, bookIdForDetail: '8928261232' },
  { id: 'cb9', title: '다정한 사람이 이긴다', author: '이해인', cover: BOOK1, bookIdForDetail: '8928261232' },
];
