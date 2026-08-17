import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AdminReturnFab } from '@/src/components/admin/AdminReturnFab';
import { useAppFonts } from '@/src/theme/appFonts';
import '@/src/theme/disableSystemFontScaling';

void SplashScreen.preventAutoHideAsync().catch(() => {});

/** 로그인/메인과 맞춰 스택·윈도우 배경을 고정 (다크 모드에서도 Navigation 배경만 검게 되는 현상 완화) */
const ROOT_STACK_BG = '#E8F3ED';

/**
 * 파일 기반 라우트(app/*.tsx)를 자동 등록하고, 옵션만 필요한 화면만 Stack.Screen 으로 지정합니다.
 * (수십 개를 수동 나열하면 일부 라우트와 불일치 시 WARN 이 날 수 있음)
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useAppFonts();
  // 폰트 로드 실패 시에도 앱은 뜨게 하되, Pretendard 등록 성공을 우선 기다립니다.
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontError) {
      console.warn('[fonts] Pretendard load failed; falling back to system fonts', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(ROOT_STACK_BG);
  }, []);

  // 폰트 로딩 중에는 네이티브 스플래시(민트 배경)만 유지 → index의 AppLaunchSplash 1회만 표시
  if (!fontsReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { flex: 1, backgroundColor: ROOT_STACK_BG },
        }}>
        <Stack.Screen name="intro" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="ReadingSessionScreen"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ReadingSession_1"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="ReadingSession_4" options={{ animation: 'none' }} />
        <Stack.Screen
          name="CommuteReadingRecommendScreen"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="ReadingSessionFinishFlowScreen"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="AccountManagementScreen" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="ProfileEditScreen" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="OnboardingProfileEditScreen"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <AdminReturnFab />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
