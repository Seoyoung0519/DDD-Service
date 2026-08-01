import { isKakaoSdkInitialized } from '@/src/features/auth/kakaoSdk';
import { clearAccessToken } from '@/src/services/auth/authService';

/** 서비스 JWT 삭제 + 소셜 SDK 세션 정리 */
export async function logoutFromApp(): Promise<void> {
  if (isKakaoSdkInitialized()) {
    try {
      const kakaoUser = await import('@react-native-kakao/user');
      await kakaoUser.logout().catch(() => undefined);
    } catch {
      // Kakao SDK 미연동·웹
    }
  }

  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut().catch(() => undefined);
  } catch {
    // Google 로그인 미사용
  }

  await clearAccessToken();
}
