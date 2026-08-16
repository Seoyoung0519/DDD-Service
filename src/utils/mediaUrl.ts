import { BANNER_API_BASE_URL } from '@/src/config/api';

function stripEmptyQuery(url: URL): string {
  const qs = url.searchParams.toString();
  url.search = qs ? `?${qs}` : '';
  return url.toString();
}

function hasImageExtension(url: URL): boolean {
  const last = url.pathname.split('/').pop() ?? '';
  return /\.(jpe?g|png|gif|webp|bmp|avif|svg)$/i.test(last);
}

function decodeHexAscii(value: string): string {
  if (!/^[0-9A-Fa-f]+$/.test(value) || value.length % 2 !== 0) return '';
  try {
    return value
      .match(/.{2}/g)!
      .map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join('');
  } catch {
    return '';
  }
}

/**
 * `/utl/webimg/.../696D6167652F6A706567` 처럼 확장자 없이 MIME만 실린 주소.
 * 안드로이드 이미지 로더는 경로에 .jpg가 없으면 JPEG를 건너뛰는 경우가 있습니다.
 */
function hintImageExtension(url: string): string {
  try {
    const parsed = new URL(url);
    if (hasImageExtension(parsed) || parsed.hash) return url;

    const last = parsed.pathname.split('/').pop() ?? '';
    const decoded = decodeHexAscii(last).toLowerCase();
    if (decoded === 'image/jpeg' || decoded === 'image/jpg' || last.toLowerCase().includes('jpeg')) {
      parsed.hash = '.jpg';
      return parsed.toString();
    }
    if (decoded === 'image/png' || last.toLowerCase().includes('png')) {
      parsed.hash = '.png';
      return parsed.toString();
    }
    if (decoded === 'image/webp') {
      parsed.hash = '.webp';
      return parsed.toString();
    }
    if (decoded === 'image/gif') {
      parsed.hash = '.gif';
      return parsed.toString();
    }

    // 확장자가 전혀 없는 원격 이미지는 JPEG로 힌트
    if (last && !last.includes('.')) {
      parsed.hash = '.jpg';
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/** Bing 검색 썸네일은 `rm=` 이 있으면 앱에서 404를 줍니다. */
function rewriteBingImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)bing\.com$|(^|\.)bing\.net$/i.test(parsed.hostname)) return url;
    parsed.searchParams.delete('rm');
    parsed.searchParams.delete('o');
    parsed.searchParams.delete('pid');
    parsed.searchParams.delete('r');
    const width = Number(parsed.searchParams.get('w'));
    if (!Number.isFinite(width) || width < 400) {
      parsed.searchParams.set('w', '800');
    }
    return stripEmptyQuery(parsed);
  } catch {
    return url;
  }
}

function rewriteHostedImageUrl(url: string): string {
  const bing = rewriteBingImageUrl(url);
  if (bing !== url) return hintImageExtension(bing);

  const driveId =
    url.match(/drive\.google\.com\/file\/d\/([^/]+)/)?.[1] ??
    url.match(/[?&]id=([^&]+)/)?.[1];
  if (/drive\.google\.com/i.test(url) && driveId && !/uc\?export=/i.test(url)) {
    return `https://drive.google.com/uc?export=view&id=${driveId}`;
  }
  if (/dropbox\.com/i.test(url) && /[?&]dl=0/.test(url)) {
    return hintImageExtension(url.replace(/([?&])dl=0/, '$1dl=1'));
  }
  return hintImageExtension(url);
}

export function resolveRemoteImageUrl(raw: string, baseUrl: string = BANNER_API_BASE_URL): string {
  const s = raw.trim();
  if (!s) return '';
  if (/^data:|^file:/i.test(s)) return s;
  if (s.startsWith('//')) return rewriteHostedImageUrl(`https:${s}`);
  if (/^https?:\/\//i.test(s)) return rewriteHostedImageUrl(s);
  const base = baseUrl.replace(/\/+$/, '');
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
}

/** 서버가 snake_case / camelCase 중 하나만 줄 때도 이미지를 찾습니다. */
export function pickRemoteImageUrl(item: {
  image_url?: string | null;
  imageUrl?: string | null;
  image_path?: string | null;
  imagePath?: string | null;
}): string {
  return resolveRemoteImageUrl(
    item.image_url || item.imageUrl || item.image_path || item.imagePath || '',
  );
}

export function remoteImageSource(uri: string): {
  uri: string;
  headers?: Record<string, string>;
} {
  const resolved = resolveRemoteImageUrl(uri);
  if (/bing\.com|bing\.net/i.test(resolved)) {
    return {
      uri: resolved,
      headers: { Referer: 'https://www.bing.com/' },
    };
  }
  return {
    uri: resolved,
    headers: { Accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8' },
  };
}
