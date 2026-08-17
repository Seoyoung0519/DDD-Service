import { Text, TextInput } from 'react-native';

import { APP_FONTS, FONT_SCALE } from '@/src/theme/fonts';

/**
 * 전역 Text/TextInput 기본 정책
 * - 폰트: Pretendard 통일 (Roboto/System/sans-serif → Pretendard)
 * - Android에서 fontFamily(Pretendard-Bold) + fontWeight 동시 지정 시
 *   시스템 서체로 폴백되며 글자 폭이 달라져 잘리는 문제가 있어 weight는 제거합니다.
 * - 확대: allowFontScaling 유지 + maxFontSizeMultiplier 기본 상한(1.3)
 *
 * React 19/Fabric에서는 Text.render 패치가 없을 수 있어,
 * 화면 스타일의 fontFamily 자체가 Pretendard여야 합니다 (APP_FONTS / AppText).
 */

const FONT_FAMILY_MAP: Record<string, string> = {
  Roboto: APP_FONTS.REGULAR,
  'Roboto-Medium': APP_FONTS.MEDIUM,
  'Roboto-Bold': APP_FONTS.BOLD,
  'sans-serif': APP_FONTS.REGULAR,
  'sans-serif-medium': APP_FONTS.MEDIUM,
  'sans-serif-light': APP_FONTS.REGULAR,
  'sans-serif-black': APP_FONTS.BOLD,
  System: APP_FONTS.REGULAR,
  UITextField: APP_FONTS.REGULAR,
  Pretendard: APP_FONTS.REGULAR,
  'Pretendard-Regular': APP_FONTS.REGULAR,
  'Pretendard-Medium': APP_FONTS.MEDIUM,
  'Pretendard-SemiBold': APP_FONTS.SEMIBOLD,
  'Pretendard-Bold': APP_FONTS.BOLD,
};

type Patchable = {
  defaultProps?: Record<string, unknown> | null;
  render?: (props: Record<string, unknown>, ref: unknown) => unknown;
  type?: Patchable;
};

function isBoldWeight(weight: unknown): boolean {
  return weight === 'bold' || weight === '700' || weight === '800' || weight === '900' || weight === 700 || weight === 800 || weight === 900;
}

function isSemiBoldWeight(weight: unknown): boolean {
  return weight === '600' || weight === 'semibold' || weight === 600;
}

function isMediumWeight(weight: unknown): boolean {
  return weight === '500' || weight === 'medium' || weight === 500;
}

function rewriteFontStyles(style: unknown): unknown {
  if (style == null) return style;
  if (Array.isArray(style)) return style.map(rewriteFontStyles);
  if (typeof style !== 'object') return style;

  const record = { ...(style as Record<string, unknown>) };
  const hasFamily = typeof record.fontFamily === 'string';
  const family = hasFamily ? (record.fontFamily as string) : '';
  const mappedKnown = hasFamily ? FONT_FAMILY_MAP[family] : undefined;
  const isPretendard = family.startsWith('Pretendard');
  const isSystemStack =
    !hasFamily ||
    Boolean(mappedKnown) ||
    /^(Roboto|System|sans-serif|UITextField|Helvetica|Arial|Times)/i.test(family);

  // 아이콘 폰트 등 커스텀 패밀리는 유지합니다.
  let mapped = !hasFamily
    ? APP_FONTS.REGULAR
    : mappedKnown ?? (isPretendard || !isSystemStack ? family : APP_FONTS.REGULAR);

  if (isSystemStack || isPretendard) {
    const weight = record.fontWeight;
    if (isBoldWeight(weight)) mapped = APP_FONTS.BOLD;
    else if (isSemiBoldWeight(weight)) mapped = APP_FONTS.SEMIBOLD;
    else if (isMediumWeight(weight)) mapped = APP_FONTS.MEDIUM;
    delete record.fontWeight;
  }

  record.fontFamily = mapped;
  return record;
}

function applyTypographyProps(props: Record<string, unknown>): Record<string, unknown> {
  const allowFontScaling =
    typeof props.allowFontScaling === 'boolean' ? props.allowFontScaling : true;
  const maxFontSizeMultiplier =
    typeof props.maxFontSizeMultiplier === 'number'
      ? props.maxFontSizeMultiplier
      : FONT_SCALE.default;

  return {
    ...props,
    allowFontScaling,
    maxFontSizeMultiplier,
    style: rewriteFontStyles([{ fontFamily: APP_FONTS.REGULAR }, props.style]),
  };
}

function patchTextComponent(component: Patchable) {
  const target = typeof component.render === 'function' ? component : component.type;
  if (!target) return;

  target.defaultProps = {
    ...target.defaultProps,
    allowFontScaling: true,
    maxFontSizeMultiplier: FONT_SCALE.default,
  };

  const originalRender = target.render;
  if (typeof originalRender !== 'function') return;

  target.render = function render(props: Record<string, unknown>, ref: unknown) {
    return originalRender.call(this, applyTypographyProps(props), ref);
  };
}

patchTextComponent(Text as unknown as Patchable);
patchTextComponent(TextInput as unknown as Patchable);
