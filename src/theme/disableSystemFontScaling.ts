import { Text, TextInput } from 'react-native';

import { APP_FONTS, FONT_SCALE } from '@/src/theme/fonts';

/**
 * 전역 Text/TextInput 기본 정책
 * - 폰트: Pretendard 통일 (Roboto/System 등 → Pretendard로 치환)
 * - 확대: allowFontScaling 유지 + maxFontSizeMultiplier 기본 상한
 *   (전체 false 고정은 접근성상 비추천 → 역할별 상한은 AppText 사용)
 *
 * React 19는 defaultProps를 무시하므로 forwardRef.render를 패치합니다.
 * 개별 Text에 넘긴 allowFontScaling / maxFontSizeMultiplier는 그대로 존중합니다.
 */

const FONT_FAMILY_MAP: Record<string, string> = {
  Roboto: APP_FONTS.REGULAR,
  'Roboto-Medium': APP_FONTS.MEDIUM,
  'Roboto-Bold': APP_FONTS.BOLD,
  'sans-serif': APP_FONTS.REGULAR,
  'sans-serif-medium': APP_FONTS.MEDIUM,
  System: APP_FONTS.REGULAR,
  Pretendard: APP_FONTS.REGULAR,
  'Pretendard-Regular': APP_FONTS.REGULAR,
  'Pretendard-Medium': APP_FONTS.MEDIUM,
  'Pretendard-Bold': APP_FONTS.BOLD,
};

type Patchable = {
  defaultProps?: Record<string, unknown> | null;
  render?: (props: Record<string, unknown>, ref: unknown) => unknown;
};

function rewriteFontStyles(style: unknown): unknown {
  if (style == null) return style;
  if (Array.isArray(style)) return style.map(rewriteFontStyles);
  if (typeof style !== 'object') return style;

  const record = style as Record<string, unknown>;
  const family = record.fontFamily;
  if (typeof family !== 'string') return style;

  const mapped = FONT_FAMILY_MAP[family] ?? family;
  if (mapped === family) return style;
  return { ...record, fontFamily: mapped };
}

function patchTextComponent(component: Patchable) {
  const originalRender = component.render;
  if (typeof originalRender !== 'function') return;

  component.render = function render(props: Record<string, unknown>, ref: unknown) {
    const allowFontScaling =
      typeof props.allowFontScaling === 'boolean' ? props.allowFontScaling : true;
    const maxFontSizeMultiplier =
      typeof props.maxFontSizeMultiplier === 'number'
        ? props.maxFontSizeMultiplier
        : FONT_SCALE.default;

    const nextProps: Record<string, unknown> = {
      ...props,
      allowFontScaling,
      maxFontSizeMultiplier,
      style: rewriteFontStyles([{ fontFamily: APP_FONTS.REGULAR }, props.style]),
    };

    return originalRender.call(this, nextProps, ref);
  };
}

patchTextComponent(Text as unknown as Patchable);
patchTextComponent(TextInput as unknown as Patchable);
