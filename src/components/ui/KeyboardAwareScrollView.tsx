import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';

import { useKeyboardOverlap } from '@/src/hooks/useKeyboardOverlap';

/**
 * 키보드가 올라오면 아래 여백을 늘려 화면을 스크롤할 수 있게 하고,
 * 포커스된 입력칸이 키보드에 가리지 않도록 위치를 맞춥니다.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardAwareScrollView(
    {
      children,
      contentContainerStyle,
      style,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = 'on-drag',
      horizontal,
      onScroll,
      scrollEventThrottle = 16,
      ...rest
    },
    ref,
  ) {
    const overlap = useKeyboardOverlap();
    const innerRef = useRef<ScrollView>(null);
    const scrollY = useRef(0);

    const setRefs = useCallback(
      (node: ScrollView | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<ScrollView | null>).current = node;
      },
      [ref],
    );

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
        onScroll?.(e);
      },
      [onScroll],
    );

    useEffect(() => {
      if (horizontal || overlap <= 0) return;
      const timer = setTimeout(() => {
        const focused = TextInput.State.currentlyFocusedInput?.();
        if (!focused) return;
        focused.measureInWindow((_x, y, _w, h) => {
          const keyboardTop = Dimensions.get('window').height - overlap;
          const delta = y + h + 20 - keyboardTop;
          if (delta > 0) {
            innerRef.current?.scrollTo({
              y: Math.max(0, scrollY.current + delta),
              animated: true,
            });
          }
        });
      }, 80);
      return () => clearTimeout(timer);
    }, [horizontal, overlap]);

    if (horizontal) {
      return (
        <ScrollView
          {...rest}
          ref={setRefs}
          horizontal
          style={style}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}>
          {children}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        {...rest}
        ref={setRefs}
        style={style}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={contentContainerStyle}>
        {children}
        {overlap > 0 ? <View style={{ height: overlap + 24 }} /> : null}
      </ScrollView>
    );
  },
);
