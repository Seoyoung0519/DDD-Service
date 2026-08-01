import { ImageSourcePropType } from 'react-native';

export type ServiceIntroSlide = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  /** 목업 카드 좌우 여백 (px) */
  mockupHorizontalInset?: number;
  /** 목업 카드 하단 여백 (px) */
  mockupBottomInset?: number;
  /** 화면 높이 대비 목업 카드 높이 비율 (0~1) */
  mockupHeightRatio?: number;
};

/** 서비스 소개 하단 목업 — 사용자 제공 앱 화면 캡처 */
const INTRO_MOCKUP_IMAGE = require('../../../assets/images/intro/drawer-mockup.png');
const BOOKSHELF_MOCKUP_IMAGE = require('../../../assets/images/intro/bookshelf-mockup.png');
const READING_SESSION_MOCKUP_IMAGE = require('../../../assets/images/intro/reading-session-mockup.png');
const READING_TIMER_MOCKUP_IMAGE = require('../../../assets/images/intro/reading-timer-mockup.png');
const READING_RECORD_MOCKUP_IMAGE = require('../../../assets/images/intro/reading-record-mockup.png');
const FEED_MOCKUP_IMAGE = require('../../../assets/images/intro/feed-mockup.png');
const BOOKPICK_MOCKUP_IMAGE = require('../../../assets/images/intro/bookpick-mockup.png');

export const SERVICE_INTRO_SLIDES: ServiceIntroSlide[] = [
  {
    id: 'commute-reading',
    title: '한눈에 모아보는 나만의 독서',
    description:
      '끝까지 다 읽은 책이 한 권씩 쌓여 당신만의 특별한 북키링을 만들어 줍니다',
    image: INTRO_MOCKUP_IMAGE,
    mockupHorizontalInset: 28,
    mockupBottomInset: 12,
    mockupHeightRatio: 0.67,
  },
  {
    id: 'book-progress',
    title: '읽은 책이 나만의 책장이 되다',
    description: '읽고 있거나 읽을 책을 추가하고 \n독서를 시작해 보세요',
    image: BOOKSHELF_MOCKUP_IMAGE,
    mockupHorizontalInset: 28,
    mockupBottomInset: 12,
    mockupHeightRatio: 0.67,
  },
  {
    id: 'reading-commute',
    title: '독서 시간으로 바꾸는 이동시간',
    description:
      '목적지까지 가는 동안 현재 위치와 이동 알림을 \n제공해 안전하고 꾸준한 독서를 도와요.',
    image: READING_SESSION_MOCKUP_IMAGE,
    mockupHorizontalInset: 28,
    mockupBottomInset: 12,
    mockupHeightRatio: 0.67,
  },
  {
    id: 'reading-timer',
    title: '온전히 독서에만만 몰입하는 UI',
    description:
      '남은 시간과 목표 페이지를 확인하며 집중력을 \n유지해 독서 습관을 만들 수 있어요.',
    image: READING_TIMER_MOCKUP_IMAGE,
    mockupHorizontalInset: 28,
    mockupBottomInset: 12,
    mockupHeightRatio: 0.67,
  },
  {
    id: 'reading-record',
    title: '한 줄의 기록으로 남기는 기억',
    description:
      '완독한 책의 독서 기간과 느낀 점을 기록하며 책을 읽는 동안 떠오른 생각과 감정이 당신만의 이야기로 남아요.',
    image: READING_RECORD_MOCKUP_IMAGE,
    mockupHorizontalInset: 28,
    mockupBottomInset: 12,
    mockupHeightRatio: 0.67,
  },
  {
    id: 'reading-feed',
    title: '사람들과 나누는 나의 독서',
    description:
      '읽은 책에 대한 생각을 공유하고 다른 사람들의 이야기도 만나보세요. 함께 읽을수록 독서는 더 즐거워져요.',
    image: FEED_MOCKUP_IMAGE,
    mockupHorizontalInset: 28,
    mockupBottomInset: 12,
    mockupHeightRatio: 0.67,
  },
  {
    id: 'book-pick',
    title: '사람들이 추천하는 책 만나보기',
    description:
      '영상과 추천 콘텐츠를 통해 새로운 책을 발견해 보세요. 취향에 맞는 다음 책을 쉽고 재미있게 찾을 수 있어요.',
    image: BOOKPICK_MOCKUP_IMAGE,
    mockupHorizontalInset: 28,
    mockupBottomInset: 12,
    mockupHeightRatio: 0.67,
  },
];
