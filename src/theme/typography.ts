import { TextStyle } from 'react-native';

import { APP_FONTS, FONT_SCALE } from '@/src/theme/fonts';

/**
 * AppText variant별 기본 타이포.
 * 화면 style로 fontSize 등을 덮어쓸 수 있으며, 여기서는 정책·기본값만 관리합니다.
 */
export type AppTextVariant = 'title' | 'body' | 'button' | 'nav' | 'caption' | 'label';

export type TypographyToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  maxFontSizeMultiplier: number;
};

export const typography: Record<AppTextVariant, TypographyToken> = {
  title: {
    fontFamily: APP_FONTS.BOLD,
    fontSize: 20,
    lineHeight: 28,
    maxFontSizeMultiplier: FONT_SCALE.title,
  },
  body: {
    fontFamily: APP_FONTS.REGULAR,
    fontSize: 16,
    lineHeight: 24,
    maxFontSizeMultiplier: FONT_SCALE.body,
  },
  button: {
    fontFamily: APP_FONTS.SEMIBOLD,
    fontSize: 16,
    lineHeight: 22,
    maxFontSizeMultiplier: FONT_SCALE.button,
  },
  nav: {
    fontFamily: APP_FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 16,
    maxFontSizeMultiplier: FONT_SCALE.nav,
  },
  caption: {
    fontFamily: APP_FONTS.REGULAR,
    fontSize: 12,
    lineHeight: 18,
    maxFontSizeMultiplier: FONT_SCALE.body,
  },
  label: {
    fontFamily: APP_FONTS.MEDIUM,
    fontSize: 14,
    lineHeight: 20,
    maxFontSizeMultiplier: FONT_SCALE.button,
  },
};

export function typographyStyle(variant: AppTextVariant): TextStyle {
  const token = typography[variant];
  return {
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  };
}
