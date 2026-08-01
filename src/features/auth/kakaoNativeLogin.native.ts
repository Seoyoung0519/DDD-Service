import {
  isKakaoTalkLoginAvailable,
  isLogined,
  login as kakaoSdkLogin,
  logout,
} from '@react-native-kakao/user';

import { ensureKakaoSdkInitialized, logKakaoAndroidKeyHash } from '@/src/features/auth/kakaoSdk';

const KAKAO_SCOPES = ['profile_nickname', 'profile_image', 'account_email'] as const;

type KakaoLoginToken = Awaited<ReturnType<typeof kakaoSdkLogin>>;

function isRetriableKakaoTalkLoginError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const lower = message.toLowerCase();
  return (
    lower.includes('access token not found') ||
    lower.includes('you must login first') ||
    lower.includes('not logged in') ||
    lower.includes('kakaotalk login failed') ||
    lower.includes('user cancelled') ||
    lower.includes('canceled') ||
    lower.includes('cancelled')
  );
}

async function prepareKakaoLoginSession(): Promise<void> {
  try {
    if (await isLogined()) {
      await logout();
    }
  } catch {
    await logout().catch(() => undefined);
  }
}

async function loginWithKakaoAccount(): Promise<KakaoLoginToken> {
  const token = await kakaoSdkLogin({ useKakaoAccountLogin: true });
  if (!token.accessToken?.trim()) {
    throw new Error('카카오 accessToken을 받지 못했습니다.');
  }
  if (__DEV__) {
    console.log('[KAKAO] SDK login OK', { scopes: token.scopes ?? [] });
  }
  return token;
}

export async function performKakaoNativeLogin(): Promise<KakaoLoginToken> {
  await ensureKakaoSdkInitialized();
  await prepareKakaoLoginSession();

  const talkAvailable = await isKakaoTalkLoginAvailable();
  if (__DEV__) {
    console.log('[KAKAO] native login start', { talkAvailable });
  }

  if (talkAvailable) {
    try {
      const talkToken = await kakaoSdkLogin({});
      if (talkToken.accessToken?.trim()) {
        if (__DEV__) {
          console.log('[KAKAO] KakaoTalk login OK', { scopes: talkToken.scopes ?? [] });
        }
        return talkToken;
      }
    } catch (error: unknown) {
      if (__DEV__) {
        console.warn('[KAKAO] KakaoTalk login failed — account login으로 전환:', error);
      }
      await prepareKakaoLoginSession();
      if (!isRetriableKakaoTalkLoginError(error)) {
        throw error;
      }
    }
  }

  if (__DEV__) console.log('[KAKAO] Kakao account login');
  return loginWithKakaoAccount();
}

export { logKakaoAndroidKeyHash, KAKAO_SCOPES };
