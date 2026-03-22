import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

/** 로그인/메인과 맞춰 스택·윈도우 배경을 고정 (다크 모드에서도 Navigation 배경만 검게 되는 현상 완화) */
const ROOT_STACK_BG = '#F0EEEB';

/**
 * 파일 기반 라우트(app/*.tsx)를 자동 등록하고, 옵션만 필요한 화면만 Stack.Screen 으로 지정합니다.
 * (수십 개를 수동 나열하면 일부 라우트와 불일치 시 WARN 이 날 수 있음)
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 번들 로드 직후 스플래시가 남거나 윈도우가 검게 보이는 경우 완화
    void SplashScreen.hideAsync();
    void SystemUI.setBackgroundColorAsync(ROOT_STACK_BG);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { flex: 1, backgroundColor: ROOT_STACK_BG },
        }}>
        <Stack.Screen name="ReadingSession_4" options={{ animation: 'none' }} />
        <Stack.Screen
          name="CommuteReadingRecommendScreen"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
