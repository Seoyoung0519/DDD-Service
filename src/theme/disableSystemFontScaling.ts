import { Platform, Text, TextInput } from 'react-native';

/**
 * 삼성/시스템 글자 크기·글꼴이 레이아웃을 바꾸지 않도록 Text/TextInput 기본값을 고정합니다.
 * React 19는 defaultProps를 무시하므로 forwardRef.render 패치를 함께 씁니다.
 */
const LOCKED_PROPS = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

type Patchable = {
  defaultProps?: Record<string, unknown> | null;
  render?: (props: Record<string, unknown>, ref: unknown) => unknown;
};

function patchTextComponent(component: Patchable, injectAndroidFont: boolean) {
  component.defaultProps = {
    ...component.defaultProps,
    ...LOCKED_PROPS,
  };

  const originalRender = component.render;
  if (typeof originalRender !== 'function') return;

  component.render = function render(props: Record<string, unknown>, ref: unknown) {
    const nextProps: Record<string, unknown> = {
      ...props,
      ...LOCKED_PROPS,
    };

    if (injectAndroidFont && Platform.OS === 'android') {
      nextProps.style = [{ fontFamily: 'Roboto' }, props.style];
    }

    return originalRender.call(this, nextProps, ref);
  };
}

patchTextComponent(Text as unknown as Patchable, true);
patchTextComponent(TextInput as unknown as Patchable, true);
