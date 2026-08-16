import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

/**
 * 키보드가 화면을 가리는 높이(px).
 * 윈도우가 이미 줄어든 만큼은 빼고, 가려진 나머지만 반환합니다.
 */
export function useKeyboardOverlap(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardHeight <= 0) return 0;

  const screenH = Dimensions.get('screen').height;
  const windowH = Dimensions.get('window').height;
  const alreadyShrunk = Math.max(0, screenH - windowH);
  return Math.max(0, keyboardHeight - alreadyShrunk);
}
