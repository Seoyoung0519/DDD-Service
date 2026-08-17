import React from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { APP_FONTS, FONT_SCALE, type FontScaleRole } from '@/src/theme/fonts';

export type AppTextWeight = 'regular' | 'medium' | 'bold';

export type AppTextProps = TextProps & {
  /** Pretendard weight */
  weight?: AppTextWeight;
  /**
   * 시스템 글자 확대 상한 역할
   * - button/nav: 1.2
   * - title: 1.3
   * - body: 1.4 (기본)
   * - content: 1.5
   */
  scaleRole?: FontScaleRole;
  style?: StyleProp<TextStyle>;
};

function fontFamilyForWeight(weight: AppTextWeight): string {
  if (weight === 'bold') return APP_FONTS.BOLD;
  if (weight === 'medium') return APP_FONTS.MEDIUM;
  return APP_FONTS.REGULAR;
}

/**
 * 대독단 공통 텍스트.
 * 폰트 패밀리 + 역할별 maxFontSizeMultiplier를 한곳에서 관리합니다.
 *
 * @example
 * <AppText weight="bold" scaleRole="title">오늘의 독서</AppText>
 * <AppText scaleRole="button">시작하기</AppText>
 */
export function AppText({
  weight = 'regular',
  scaleRole = 'body',
  allowFontScaling = true,
  maxFontSizeMultiplier,
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? FONT_SCALE[scaleRole]}
      style={[{ fontFamily: fontFamilyForWeight(weight) }, style]}>
      {children}
    </Text>
  );
}

export default AppText;
