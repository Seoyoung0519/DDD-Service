export const KAKAO_SCOPES = ['profile_nickname', 'profile_image', 'account_email'] as const;

export async function performKakaoNativeLogin(): Promise<never> {
  throw new Error('performKakaoNativeLogin is only available on native platforms.');
}

export async function logKakaoAndroidKeyHash(): Promise<void> {
  // no-op on web
}
