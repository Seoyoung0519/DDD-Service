// src/api/auth.ts

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export type AuthGoogleResponse = {
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export async function loginWithGoogleIdToken(
  idToken: string,
  platform: 'web' | 'android' | 'ios',
): Promise<AuthGoogleResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken, platform }),
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch (e) {
    // ignore json parse error, handle below
  }

  if (!res.ok) {
    const message =
      body?.message || body?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body as AuthGoogleResponse;
}

