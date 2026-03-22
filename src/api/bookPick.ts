import { MAIN_API_BASE_URL } from '@/src/config/api';

export interface BookPickVideoItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  duration: string;
  description?: string;
  externalUrl: string;
}

export interface BookPickSection {
  playlistId: string;
  title: string;
  items: BookPickVideoItem[];
}

export interface BookPickVideosResponse {
  success: boolean;
  data: {
    sections: BookPickSection[];
  };
}

/**
 * 북 PICK 데이터 조회
 * - GET /book-picks/videos
 * - 인증 필요 없음(문서 기준)
 */
export async function fetchBookPickVideos(): Promise<BookPickSection[]> {
  // 일부 백엔드는 라우팅 프리픽스로 `/api`를 붙이는 경우가 있어
  // 1) `/api/book-picks/videos` 시도 → 2) 실패 시 `/book-picks/videos` 폴백
  const candidates = [
    `${MAIN_API_BASE_URL}/api/book-picks/videos`,
    `${MAIN_API_BASE_URL}/book-picks/videos`,
  ];

  let lastError: any = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        lastError = text || `북PICK 조회 실패 (status: ${res.status})`;
        continue;
      }

      const body = (await res.json()) as BookPickVideosResponse;
      return body?.data?.sections ?? [];
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(lastError || '북PICK 조회 실패');
}

