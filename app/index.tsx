// app/index.tsx — 앱 실행 후 첫 화면 (스플래시)

import { useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppLaunchSplash } from '@/src/components/splash/AppLaunchSplash';
import { getAccessToken, clearAccessToken } from '@/src/services/auth/authService';
import { fetchBootstrapSessionAndOnboarding } from '@/src/services/onboarding/onboardingService';
import { isOnboardingSkipped } from '@/src/services/onboarding/onboardingSkip';
import { resolveAgreementsGateRoute } from '@/src/services/settings/agreementGate';
import { initializePushNotifications } from '@/src/services/push/pushNotificationService';

const SPLASH_MIN_MS = 2000;

async function resolveInitialRoute(): Promise<Href> {
  const token = await getAccessToken();
  if (!token) return '/intro';

  try {
    const { hasValidSession, onboarding } = await fetchBootstrapSessionAndOnboarding();
    if (!hasValidSession) {
      await clearAccessToken();
      return '/intro';
    }

    if (await isOnboardingSkipped()) {
      void initializePushNotifications();
      return '/DaedokPick';
    }

    if (onboarding?.isOnboarded) {
      void initializePushNotifications();
      return '/Drawer_1';
    }

    if (onboarding) {
      const agreementsRoute = await resolveAgreementsGateRoute('onboarding');
      if (agreementsRoute) return agreementsRoute;
      return '/onboarding';
    }

    const agreementsRoute = await resolveAgreementsGateRoute('onboarding');
    if (agreementsRoute) return agreementsRoute;
  } catch (e) {
    console.warn('[SPLASH] 세션 복원 실패, 로그인으로 이동:', e);
    await clearAccessToken();
  }

  return '/intro';
}

export default function SplashRoute() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [route] = await Promise.all([
          resolveInitialRoute(),
          new Promise<void>((resolve) => setTimeout(resolve, SPLASH_MIN_MS)),
        ]);

        if (cancelled) return;
        router.replace(route);
      } finally {
        if (!cancelled) {
          await SplashScreen.hideAsync();
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <AppLaunchSplash />;
}
