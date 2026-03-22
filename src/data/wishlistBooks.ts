import type { ImageSourcePropType } from 'react-native';

const BOOK1 = require('../../assets/images/drawer/book1.png');
const BOOK2 = require('../../assets/images/drawer/book2.png');

export type WishlistBook = {
  id: string;
  title: string;
  author: string;
  /** 출판사명 */
  publisher: string;
  /** 예: 2024년 04월 08일 */
  publishedAt: string;
  cover: ImageSourcePropType;
};

/** 모달 목록 등에서 한 줄로 표시: 저자 저 | 출판사 | 날짜 */
export function wishlistMetaLine(book: WishlistBook): string {
  return `${book.author} 저 | ${book.publisher} | ${book.publishedAt}`;
}

/** 내 서재 · 찜한 도서 목업 (API 연동 시 교체) */
export const WISHLIST_BOOKS: WishlistBook[] = [
  {
    id: 'w-tomato',
    title: '토마토 컵라면',
    author: '차정은',
    publisher: 'BOOKK',
    publishedAt: '2024년 04월 08일',
    cover: BOOK1,
  },
  { id: 'w1', title: '첨벙 다음은 파도', author: '오산하', publisher: '문학동네', publishedAt: '2023년 11월 20일', cover: BOOK1 },
  { id: 'w2', title: '우리는 모두 이불에서 태어난걸요', author: '봉주연', publisher: '창비', publishedAt: '2024년 01월 15일', cover: BOOK2 },
  { id: 'w3', title: '팩트풀니스', author: '한스 로슬링 외', publisher: '김영사', publishedAt: '2019년 04월 25일', cover: BOOK1 },
  { id: 'w4', title: '가공범', author: '히가시노 게이고', publisher: '재인', publishedAt: '2022년 08월 03일', cover: BOOK2 },
  { id: 'w5', title: '호의에 대하여', author: '문형배', publisher: '은행나무', publishedAt: '2023년 05월 10일', cover: BOOK1 },
  { id: 'w6', title: '절창', author: '오쿠다 히데오', publisher: '민음사', publishedAt: '2021년 12월 01일', cover: BOOK2 },
  { id: 'w7', title: '밤은 눈을 감지 않는다', author: '메리쿠비카', publisher: '문학동네', publishedAt: '2024년 02월 28일', cover: BOOK1 },
  { id: 'w8', title: '다정한 사람이 이긴다', author: '이해인', publisher: '해냄', publishedAt: '2020년 06월 18일', cover: BOOK2 },
  { id: 'w9', title: '편안함의 습격', author: '마이클 이스터', publisher: '갈매나무', publishedAt: '2023년 09월 05일', cover: BOOK1 },
  { id: 'w10', title: '키메라의 땅', author: '베르나르 베르베르', publisher: '열린책들', publishedAt: '2018년 07월 12일', cover: BOOK2 },
];
