import React from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { APP_FONTS, FONT_SCALE, type FontScaleRole } from '@/src/theme/fonts';
import {
  typography,
  typographyStyle,
  type AppTextVariant,
} from '@/src/theme/typography';

export type AppTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type AppTextProps = TextProps & {
  /**
   * 역할별 기본 타이포 (fontFamily / size / lineHeight / scale 상한).
   * style로 덮어쓸 수 있습니다.
   */
  variant?: AppTextVariant;
  /** Pretendard weight — 지정 시 variant의 fontFamily보다 우선 */
  weight?: AppTextWeight;
  /**
   * 시스템 글자 확대 상한 역할
   * - button/nav: 1.2
   * - title/body/content/default: 1.3
   * variant가 있으면 그 상한을 쓰고, scaleRole이 있으면 이를 우선합니다.
   */
  scaleRole?: FontScaleRole;
  style?: StyleProp<TextStyle>;
};

function fontFamilyForWeight(weight: AppTextWeight): string {
  if (weight === 'bold') return APP_FONTS.BOLD;
  if (weight === 'semibold') return APP_FONTS.SEMIBOLD;
  if (weight === 'medium') return APP_FONTS.MEDIUM;
  return APP_FONTS.REGULAR;
}

/**
 * 대독단 공통 텍스트.
 * 폰트 패밀리 + 역할별 maxFontSizeMultiplier를 한곳에서 관리합니다.
 *
 * @example
 * <AppText variant="title">오늘의 독서</AppText>
 * <AppText variant="body">본문</AppText>
 * <AppText variant="button">시작하기</AppText>
 * <AppText weight="bold" scaleRole="title">레거시 API</AppText>
 */
export function AppText({
  variant,
  weight,
  scaleRole,
  allowFontScaling = true,
  maxFontSizeMultiplier,
  style,
  children,
  ...props
}: AppTextProps) {
  const token = variant ? typography[variant] : null;
  const resolvedScaleRole = scaleRole ?? (variant === 'button' || variant === 'nav' || variant === 'label'
    ? (variant === 'nav' ? 'nav' : 'button')
    : variant === 'title'
      ? 'title'
      : 'body');

  const familyStyle: TextStyle | null = weight
    ? { fontFamily: fontFamilyForWeight(weight) }
    : token
      ? null
      : { fontFamily: APP_FONTS.REGULAR };

  return (
    <Text
      {...props}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={
        maxFontSizeMultiplier ??
        token?.maxFontSizeMultiplier ??
        FONT_SCALE[resolvedScaleRole]
      }
      style={[
        token ? typographyStyle(variant!) : null,
        familyStyle,
        style,
      ]}>
      {children}
    </Text>
  );
}

export default AppText;
