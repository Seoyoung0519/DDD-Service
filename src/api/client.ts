import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Alert, Platform } from 'react-native';
import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';

export type ApiRequestConfig = AxiosRequestConfig & {
  /** true면 인터셉터에서 console.error·Alert 생략 (호출부에서 처리) */
  suppressApiErrorLog?: boolean;
};

function isSuppressApiErrorLog(config: AxiosRequestConfig | undefined): boolean {
  return Boolean((config as ApiRequestConfig | undefined)?.suppressApiErrorLog);
}

/** 서버가 배열/객체 등으로 에러 본문을 줄 때 문자열 메시지로 정규화 */
function extractApiErrorMessage(data: unknown): string | undefined {
  if (data == null) return undefined;
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);

  if (Array.isArray(data) && data.length > 0) {
    for (const item of data) {
      const msg = extractApiErrorMessage(item);
      if (msg) return msg;
    }
    return undefined;
  }

  if (typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string') return o.error;
    if (o.error != null) {
      const nested = extractApiErrorMessage(o.error);
      if (nested) return nested;
    }
    if (typeof o.detail === 'string') return o.detail;
    if (typeof o.description === 'string') return o.description;
  }

  return undefined;
}

/** Axios/네트워크 오류에서 사용자·로그용 메시지 추출 */
export function formatAxiosApiError(error: unknown, fallback = '일시적인 오류가 발생했어요.'): string {
  if (axios.isAxiosError(error)) {
    const fromBody = extractApiErrorMessage(error.response?.data);
    if (fromBody) return fromBody;
    if (error.code === 'ECONNABORTED') {
      return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.';
    }
    if (!error.response) {
      return error.message || '네트워크 연결을 확인해 주세요.';
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

/** 로그용: 파싱 실패 시 JSON으로 남김 ([object Object] 방지) */
export function formatApiErrorBodyForLog(data: unknown, maxLen = 800): string {
  const msg = extractApiErrorMessage(data);
  if (msg) return msg;
  try {
    const s = JSON.stringify(data);
    if (s == null) return String(data);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return String(data);
  }
}

// 임시 사용자 ID (토큰이 없을 때 fallback으로 사용)
const FALLBACK_USER_ID = 'yevin';

let warnedMissingApiKey = false;

// NOTE: getMainApiAccessToken은 Authorization 토큰 선택 로직(google 우선/fallback)을 포함합니다.
async function getAccessToken(): Promise<string | null> {
  try {
    return await getMainApiAccessToken();
  } catch (error) {
    console.error('[API Client] 토큰 조회 실패:', error);
    return null;
  }
}

// Axios 인스턴스 생성
const client: AxiosInstance = axios.create({
  baseURL: MAIN_API_BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Authorization + API 키(선택)
client.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();

    if (!token) {
      const error = new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
      console.error('[API Client] 토큰 없음:', error.message);
      return Promise.reject(error);
    }

    config.headers['Authorization'] = `Bearer ${token}`;

    const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    } else if (__DEV__ && !warnedMissingApiKey) {
      warnedMissingApiKey = true;
      console.warn(
        '[API Client] EXPO_PUBLIC_DAEDOKDAN_API_KEY가 설정되지 않았습니다. 메인 API(통근 경로 등)가 502/ApiKeyAuthFailed를 반환할 수 있습니다. .env에 키를 넣고 Metro를 재시작하세요.',
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
client.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 네트워크 오류
    if (!error.response) {
      if (!isSuppressApiErrorLog(error.config)) {
        console.error('[API] Network Error');
        if (Platform.OS !== 'web') {
          Alert.alert('오류', '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
        }
      }
      return Promise.reject(error);
    }

    // HTTP 에러 (4xx, 5xx)
    const status = error.response?.status;
    const rawData = error.response?.data;
    const errorMessage = extractApiErrorMessage(rawData);
    const logLine = formatApiErrorBodyForLog(rawData);

    // 500 에러인 경우 더 구체적인 메시지
    let message = errorMessage || '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
    if (status === 500 && errorMessage?.includes('Aladin')) {
      message = '도서 검색 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.';
    }

    if (!isSuppressApiErrorLog(error.config)) {
      console.error(`[API] Error status=${status}`);
    }

    const isApiKeyAuthFailed =
      (typeof errorMessage === 'string' && errorMessage.includes('ApiKeyAuthFailed')) ||
      logLine.includes('ApiKeyAuthFailed');
    if (isApiKeyAuthFailed && Platform.OS !== 'web') {
      Alert.alert(
        'API 키 오류',
        '메인 서버용 API 키(EXPO_PUBLIC_DAEDOKDAN_API_KEY)가 없거나 잘못되었습니다. 프로젝트 루트 .env에 올바른 키를 설정한 뒤 Metro(Expo)를 다시 시작해 주세요.',
      );
    }
    
    // 500 에러는 Alert를 표시하지 않음 (각 컴포넌트에서 처리하도록)
    // 4xx 에러만 Alert 표시
    if (status && status >= 400 && status < 500 && Platform.OS !== 'web' && !isApiKeyAuthFailed) {
      Alert.alert('오류', message);
    }

    return Promise.reject(error);
  }
);

// 헬퍼 함수들
export const apiClient = {
  get: <T = any>(url: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return client.get<T>(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return client.post<T>(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return client.put<T>(url, data, config);
  },

  delete: <T = any>(url: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return client.delete<T>(url, config);
  },

  patch: <T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return client.patch<T>(url, data, config);
  },
};

export default client;

