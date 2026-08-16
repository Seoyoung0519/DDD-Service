/**
 * 알라딘 등 서점 썸네일을 캐러셀/그리드용 고해상도 URL로 바꿉니다.
 * `coversum`(~75px)을 그대로 쓰면 표지가 흐릿해집니다.
 */
export function toHighResCoverUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (/aladin\.co\.kr/i.test(trimmed)) {
    return trimmed
      .replace(/\/coversum\//gi, '/cover500/')
      .replace(/\/cover200\//gi, '/cover500/')
      .replace(/\/cover150\//gi, '/cover500/')
      .replace(/\/cover(?!500)\//gi, '/cover500/');
  }

  return trimmed;
}
