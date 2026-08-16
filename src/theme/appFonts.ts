import { useFonts } from 'expo-font';

/**
 * 화면에 이미 쓰인 Roboto / sans-serif 이름에 앱 전용 한글 폰트(Pretendard)를 연결합니다.
 * 삼성 글꼴 스타일을 바꿔도 이 파일이 로드되면 앱 글꼴이 유지됩니다.
 */
export function useAppFonts() {
  return useFonts({
    Roboto: require('../../assets/fonts/Pretendard-Regular.otf'),
    'Roboto-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
    'Roboto-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
    'sans-serif': require('../../assets/fonts/Pretendard-Regular.otf'),
    'sans-serif-medium': require('../../assets/fonts/Pretendard-Medium.otf'),
  });
}
