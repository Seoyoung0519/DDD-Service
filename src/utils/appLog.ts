/**
 * 앱 상태 로그.
 * 토큰·이메일·요청/응답 본문·좌표·파일 경로 등 민감 정보는 넣지 마세요.
 */
function line(scope: string, message: string): string {
  return `[${scope}] ${message}`;
}

export function logStatus(scope: string, message: string): void {
  console.log(line(scope, message));
}

export function logWarn(scope: string, message: string): void {
  console.warn(line(scope, message));
}

export function logError(scope: string, message: string): void {
  console.error(line(scope, message));
}
