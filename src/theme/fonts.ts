/**
 * 대독단 타이포 정책
 * 1) 앱 전용 Pretendard로 통일 (시스템 Roboto/삼성 서체 사용 안 함)
 * 2) allowFontScaling은 유지하되 maxFontSizeMultiplier로 상한
 * 3) 레이아웃은 height 고정 대신 minHeight + padding 권장
 */

export const APP_FONTS = {
  REGULAR: 'Pretendard-Regular',
  MEDIUM: 'Pretendard-Medium',
  SEMIBOLD: 'Pretendard-Medium',
  BOLD: 'Pretendard-Bold',
} as const;

/** 화면별 로컬 `FONTS` 상수와 동일한 키 */
export const FONTS = APP_FONTS;

/**
 * 역할별 시스템 글자 확대 상한.
 * 버튼/탭처럼 레이아웃이 빡센 곳은 낮게, 본문·독서 콘텐츠는 여유 있게.
 */
export const FONT_SCALE = {
  /** 버튼 CTA */
  button: 1.2,
  /** 하단 탭 / 상단 네비 */
  nav: 1.2,
  /** 카드·섹션 제목 */
  title: 1.3,
  /** 일반 본문 (기본) */
  body: 1.4,
  /** 설명 / 독서 콘텐츠 */
  content: 1.5,
  /** Text/TextInput 전역 기본 상한 */
  default: 1.3,
} as const;

export type FontScaleRole = keyof typeof FONT_SCALE;
