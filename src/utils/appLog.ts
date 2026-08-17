/**
 * 앱 상태 로그.
 * 토큰·이메일·요청/응답 본문·좌표·파일 경로 등 민감 정보는 넣지 마세요.
 * userId는 전체 대신 `maskUserId`로 일부만 남깁니다.
 */

const ID_KEY =
  /^(userId|user_id|reporter_user_id|reporterId|reporter_id)$/i;

function line(scope: string, message: string): string {
  return `[${scope}] ${message}`;
}

/** UUID 등 식별자 — 앞 4자 + … + 뒤 4자만 남깁니다. */
export function maskUserId(id: string | null | undefined): string {
  if (id == null || id === '') return '(none)';
  const s = String(id).trim();
  if (s.length <= 8) return `${s.slice(0, 2)}…`;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

/** 로그용 객체에서 userId 계열 필드를 마스킹합니다. */
export function redactLogData(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redactLogData);
  if (typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (ID_KEY.test(key) && (typeof nested === 'string' || nested == null)) {
      out[key] = maskUserId(nested as string | null | undefined);
    } else if (nested != null && typeof nested === 'object') {
      out[key] = redactLogData(nested);
    } else {
      out[key] = nested;
    }
  }
  return out;
}

export function logStatus(scope: string, message: string, data?: unknown): void {
  if (data !== undefined) {
    console.log(line(scope, message), redactLogData(data));
  } else {
    console.log(line(scope, message));
  }
}

export function logWarn(scope: string, message: string, data?: unknown): void {
  if (data !== undefined) {
    console.warn(line(scope, message), redactLogData(data));
  } else {
    console.warn(line(scope, message));
  }
}

export function logError(scope: string, message: string, data?: unknown): void {
  if (data !== undefined) {
    console.error(line(scope, message), redactLogData(data));
  } else {
    console.error(line(scope, message));
  }
}
