import React from 'react';
import { TextInput, type StyleProp, type TextInputProps, type TextStyle } from 'react-native';

import { APP_FONTS, FONT_SCALE, type FontScaleRole } from '@/src/theme/fonts';

export type AppTextInputWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type AppTextInputProps = TextInputProps & {
  weight?: AppTextInputWeight;
  scaleRole?: FontScaleRole;
  style?: StyleProp<TextStyle>;
};

function fontFamilyForWeight(weight: AppTextInputWeight): string {
  if (weight === 'bold') return APP_FONTS.BOLD;
  if (weight === 'semibold') return APP_FONTS.SEMIBOLD;
  if (weight === 'medium') return APP_FONTS.MEDIUM;
  return APP_FONTS.REGULAR;
}

/**
 * 대독단 공통 TextInput.
 * placeholder / 입력 텍스트 모두 Pretendard + 확대 상한을 적용합니다.
 */
export function AppTextInput({
  weight = 'regular',
  scaleRole = 'body',
  allowFontScaling = true,
  maxFontSizeMultiplier,
  style,
  ...props
}: AppTextInputProps) {
  return (
    <TextInput
      {...props}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? FONT_SCALE[scaleRole]}
      style={[{ fontFamily: fontFamilyForWeight(weight) }, style]}
    />
  );
}

export default AppTextInput;
