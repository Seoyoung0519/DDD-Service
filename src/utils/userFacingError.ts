/**
 * 프로덕션에서 사용자에게는 **미리 정의한 안내만** 보이고,
 * 원문 에러(메시지·스택·API 본문)는 `reportAppError`로만 남깁니다.
 */
import { logError } from '@/src/utils/appLog';

export const USER_FACING = {
  /** 일반 실패 */
  generic: '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  /** 네트워크 의심 */
  network: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  /** 도서 상세 로드 */
  bookLoad: '도서 정보를 불러오지 못했습니다.',
  /** 찜/완독 등에서 넘긴 제목과 상세가 맞지 않을 때 */
  bookMismatch: '요청한 도서와 일치하는 상세를 찾지 못했습니다.',
  /** 리뷰/피드 탭 */
  reviewsLoad: '리뷰를 불러오지 못했습니다.',
  /** 찜하기 — 예상 밖 예외(서버 원문 노출 금지) */
  wishlistUnknown: '찜한 도서에 담는 중 문제가 발생했어요.',
} as const;

export type UserFacingKey = keyof typeof USER_FACING;

export function userFacingMessage(key: UserFacingKey): string {
  return USER_FACING[key];
}

export type ReportAppErrorContext = {
  /** 로그/Sentry 태그용 구분 (예: BookDetail.load) */
  scope?: string;
  extra?: Record<string, unknown>;
};

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}

/**
 * 상세 에러 기록 — 사용자 UI에는 넣지 말 것.
 * - 개발: console.error로 전부
 * - 프로덕션: Sentry 패키지가 있으면 capture (선택 의존성)
 */
export function reportAppError(error: unknown, context: ReportAppErrorContext = {}): void {
  const err = toError(error);
  const scope = context.scope ?? 'App';

  if (__DEV__) {
    logError('AppError', `${scope} ${err.name}`);
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/react-native') as {
      captureException?: (e: unknown, opts?: { tags?: Record<string, string>; extra?: Record<string, unknown> }) => void;
    };
    Sentry.captureException?.(err, {
      tags: { scope },
      extra: context.extra,
    });
  } catch {
    /* @sentry/react-native 미설치 시 무시 */
  }
}
