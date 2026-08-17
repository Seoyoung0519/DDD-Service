import { useFonts } from 'expo-font';

/**
 * Pretendard를 전용 패밀리명으로 등록합니다.
 * Android에서 `Roboto` 이름으로 올리면 시스템 폰트에 밀리므로 쓰지 않습니다.
 */
export function useAppFonts() {
  return useFonts({
    'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
    // 구 코드/스타일 호환
    Pretendard: require('../../assets/fonts/Pretendard-Regular.otf'),
  });
}
