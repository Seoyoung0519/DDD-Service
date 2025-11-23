import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL
const BASE_URL = 'https://daedokdan-api.onrender.com';

// 임시 사용자 ID (토큰이 없을 때 fallback으로 사용)
const FALLBACK_USER_ID = 'yevin';

const ACCESS_TOKEN_KEY = 'daedokdan_access_token';

// 토큰 조회 함수
async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('[API Client] 토큰 조회 실패:', error);
    return null;
  }
}

// Axios 인스턴스 생성
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 헤더에 Authorization 추가 (토큰 필수)
client.interceptors.request.use(
  async (config) => {
    // accessToken 확인 (필수)
    const token = await getAccessToken();
    
    if (!token) {
      // 토큰이 없으면 에러 발생
      const error = new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      console.error('[API Client] 토큰 없음:', error.message);
      return Promise.reject(error);
    }
    
    // 토큰이 있으면 Bearer 토큰 사용
    config.headers['Authorization'] = `Bearer ${token}`;
    
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
      console.error('[API] Network Error:', error.message);
      if (Platform.OS !== 'web') {
        Alert.alert('오류', '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
      }
      return Promise.reject(error);
    }

    // HTTP 에러 (4xx, 5xx)
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.';

    console.error(`[API] Error ${status}:`, message);

    if (Platform.OS !== 'web') {
      Alert.alert('오류', message);
    }

    return Promise.reject(error);
  }
);

// 헬퍼 함수들
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.get<T>(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.post<T>(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.put<T>(url, data, config);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.delete<T>(url, config);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return client.patch<T>(url, data, config);
  },
};

export default client;

