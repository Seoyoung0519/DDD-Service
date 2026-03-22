import type { ImageSourcePropType } from 'react-native';

const BOOK1 = require('../../assets/images/drawer/book1.png');
const BOOK2 = require('../../assets/images/drawer/book2.png');
const AVATAR_DEFAULT = require('../../assets/images/drawer/bookshelf.png');

export type MyReviewListItem = {
  id: string;
  userName: string;
  userTag: string;
  /** null이면 실루엣 아이콘 */
  avatar: ImageSourcePropType | null;
  bookCover: ImageSourcePropType;
  reviewTitle: string;
  reviewSnippet: string;
  /** 도서 상세 이동용 (알라딘 item id 등) */
  bookIdForDetail: string;
  /** 상세 보강용 (선택) */
  bookAuthorForDetail?: string;
};

/** 내 리뷰 목업 — API 연동 시 교체 */
export const MY_REVIEWS_MOCK: MyReviewListItem[] = [
  {
    id: 'mr1',
    userName: '비를 맞는 바나나_56266',
    userTag: '포스트',
    avatar: null,
    bookCover: BOOK1,
    reviewTitle: '추리소설의추억',
    reviewSnippet:
      '이 책은 정말 몰입감이 대단했어요. 반전이 예상을 뛰어넘었고, 마지막 장면이 오래 남습니다. 추리를 좋아하는 분께 강력 추천…',
    bookIdForDetail: '8928261232',
  },
  {
    id: 'mr2',
    userName: '책벌레_9012',
    userTag: '포스트',
    avatar: AVATAR_DEFAULT,
    bookCover: BOOK2,
    reviewTitle: '한 줄 독후감',
    reviewSnippet:
      '여운이 남는 문장들이 많았어요. 짧게 읽기 좋고, 다시 펼쳐보고 싶은 책입니다. 작가의 시선이 인상적이었어요…',
    bookIdForDetail: '8928261232',
  },
  {
    id: 'mr3',
    userName: '대독단러버',
    userTag: '포스트',
    avatar: null,
    bookCover: BOOK1,
    reviewTitle: '밤샘으로 읽었어요',
    reviewSnippet:
      '스토리 전개가 빠르고 캐릭터가 살아 있어요. 중반 이후부터 손에서 놓을 수 없었습니다. 결말도 만족스러웠고요…',
    bookIdForDetail: '8928261232',
  },
];
