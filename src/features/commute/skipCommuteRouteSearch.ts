import type { Router } from 'expo-router';
import { Alert } from 'react-native';

import {
  buildDemoCommuteReadingRecommendPayload,
  isSkipCommuteRouteSearchEnabled,
} from '@/src/constants/demoCommuteFlow';
import { fetchCurrentUser } from '@/src/services/auth/authService';
import { setCommuteReadingRecommend } from '@/src/state/commuteReadingRecommend';
import type { CurrentReadingItem } from '@/src/types/reading';

export { isSkipCommuteRouteSearchEnabled };

/** 출·도착 검색(RS4) 건너뛰고 분량 추천 화면으로 이동 */
export async function navigateToDemoCommuteRecommend(
  router: Router,
  book: CurrentReadingItem,
): Promise<void> {
  try {
    if (__DEV__) {
      console.warn('[skipCommuteRouteSearch] 출·도착 검색 건너뛰기 → 분량 추천');
    }
    const user = await fetchCurrentUser();
    setCommuteReadingRecommend(buildDemoCommuteReadingRecommendPayload(user.id, book));
    router.replace({
      pathname: '/ReadingSession_1',
      params: { hidePickModal: '1' },
    });
  } catch (e: unknown) {
    const msg =
      typeof e === 'object' && e != null && 'message' in e
        ? String((e as { message: unknown }).message)
        : '로그인 정보를 확인할 수 없습니다.';
    Alert.alert('오류', msg);
  }
}
