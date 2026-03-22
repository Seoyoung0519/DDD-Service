import { KEYRING_API_BASE_URL, KEYRING_CREATE_BOOK_ID_JSON_KEY } from '@/src/config/api';
import { getAccessToken } from '@/src/services/auth/authService';

/** `image_path`가 API 호스트가 아닌 스토리지/CDN 기준일 때만 설정 (미설정 시 API 베이스와 동일) */
const KEYRING_MEDIA_BASE_URL =
  process.env.EXPO_PUBLIC_KEYRING_MEDIA_BASE_URL ?? KEYRING_API_BASE_URL;

/**
 * 키링 목록은 `GET /keyrings` 로 조회.
 * 서버(DB)는 `image_path` 를 주고, 앱에서는 `Image` 의 `uri` 로 쓰기 위해 `imageUrl` 로 통일해 둠.
 */
export interface Keyring {
  keyringId: string;
  /** 원본 필드: API `imageUrl` / `image_url` / `image_path` 중 하나 */
  imageUrl: string;
  prompt: string;
  createdAt?: string;
}

/** 앱 내부용 — HTTP 본문은 기본 `{ "bookId": "..." }` (src/config/api.ts 참고) */
export interface GenerateKeyringPayload {
  bookId: string;
}

export interface GenerateKeyringResponse {
  keyringId: string;
  imageUrl: string;
  prompt: string;
}

type KeyringApiItem = {
  keyringId?: string;
  keyring_id?: string;
  imageUrl?: string;
  image_url?: string;
  image_path?: string;
  imagePath?: string;
  prompt?: string;
  createdAt?: string;
  created_at?: string;
};

/**
 * GET /keyrings 응답이 배열이 아니라 래핑된 경우가 많아 공통 추출
 * 예: { data: [...] }, { success, data: { keyrings: [...] } }, { keyrings: [...] }
 */
function extractKeyringsArray(raw: unknown): KeyringApiItem[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as KeyringApiItem[];

  if (typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;

  const tryArray = (v: unknown): KeyringApiItem[] | null =>
    Array.isArray(v) ? (v as KeyringApiItem[]) : null;

  for (const key of ['data', 'keyrings', 'items', 'results'] as const) {
    const hit = tryArray(o[key]);
    if (hit) return hit;
  }

  if (o.data != null && typeof o.data === 'object' && !Array.isArray(o.data)) {
    const d = o.data as Record<string, unknown>;
    for (const key of ['keyrings', 'items', 'data'] as const) {
      const hit = tryArray(d[key]);
      if (hit) return hit;
    }
  }

  return [];
}

/**
 * DB `image_path` 가 `/static/...` 처럼 상대경로일 때 RN Image 가 로드하려면 절대 URL 필요
 */
function resolveKeyringImageUrl(rawPath: string): string {
  const s = rawPath.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  const base = KEYRING_MEDIA_BASE_URL.replace(/\/+$/, '');
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

/** 키링 API가 로그인 JWT를 검증하지 못할 때 (서버 시크릿/issuer 불일치 등) */
export class KeyringInvalidTokenError extends Error {
  constructor() {
    super('KEYRING_INVALID_TOKEN');
    this.name = 'KeyringInvalidTokenError';
  }
}

/**
 * POST /badges/keyring 가 해당 호스트에 없을 때 (404, detail: Not Found 등)
 */
export class KeyringGenerateNotFoundError extends Error {
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    super(
      `키링 생성 API를 찾을 수 없습니다(404). 이 서버에 POST /badges/keyring 가 배포되어 있는지, EXPO_PUBLIC_KEYRING_API_BASE_URL 이 맞는지 확인해 주세요.\n현재 호스트: ${baseUrl}`,
    );
    this.name = 'KeyringGenerateNotFoundError';
    this.baseUrl = baseUrl;
  }
}

function isInvalidTokenDetail(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  try {
    const j = JSON.parse(t) as { detail?: string | string[] };
    const d = j?.detail;
    if (typeof d === 'string' && /invalid token/i.test(d)) return true;
    if (Array.isArray(d) && d.some((x) => typeof x === 'string' && /invalid token/i.test(x))) return true;
  } catch {
    if (/invalid token/i.test(t)) return true;
  }
  return false;
}

function isNotFoundResponse(status: number, text: string): boolean {
  if (status === 404) return true;
  const t = text.trim();
  if (!t) return false;
  try {
    const j = JSON.parse(t) as { detail?: string | string[] };
    const d = j?.detail;
    if (typeof d === 'string' && /not found/i.test(d)) return true;
    if (Array.isArray(d) && d.some((x) => typeof x === 'string' && /not found/i.test(x))) return true;
  } catch {
    if (/not found/i.test(t)) return true;
  }
  return false;
}

/** API 본문에서 FastAPI `detail` 등 추출 (422 validation 배열·객체 처리) */
function parseErrorMessageBody(text: string): string {
  const t = text.trim();
  if (!t) return '';
  try {
    const j = JSON.parse(t) as {
      detail?: unknown;
      message?: string;
    };
    if (typeof j.message === 'string') return j.message;
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'msg' in item) {
            const it = item as { loc?: unknown[]; msg?: string; type?: string };
            const loc = Array.isArray(it.loc) ? it.loc.join(' → ') : '';
            const msg = it.msg ?? JSON.stringify(item);
            return loc ? `[${loc}] ${msg}` : msg;
          }
          try {
            return JSON.stringify(item);
          } catch {
            return String(item);
          }
        })
        .join('\n');
    }
    if (j.detail != null && typeof j.detail === 'object') {
      try {
        return JSON.stringify(j.detail, null, 0);
      } catch {
        return String(j.detail);
      }
    }
  } catch {
    // plain text
  }
  return t.length > 280 ? `${t.slice(0, 280)}…` : t;
}

function formatKeyringPostError(status: number, bodyText: string): string {
  const parsed = parseErrorMessageBody(bodyText);
  const lines: string[] = [`키링 생성 요청 실패 (HTTP ${status})`];
  if (parsed) {
    lines.push(parsed);
  }
  if (status >= 500) {
    lines.push(
      '서버 내부 오류입니다. bookId·배지 API 구현·DB·외부 이미지 생성 등을 백엔드 로그에서 확인해 주세요.',
    );
  }
  return lines.join('\n');
}

function formatKeyringListError(status: number, bodyText: string): string {
  const parsed = parseErrorMessageBody(bodyText);
  const lines: string[] = [`키링 목록 조회 실패 (HTTP ${status})`];
  if (parsed) {
    lines.push(parsed);
  } else if (bodyText?.trim()) {
    lines.push(bodyText.trim().slice(0, 400));
  }
  if (status >= 500) {
    lines.push(
      '서버(500) 오류입니다. 백엔드 로그를 확인하세요. 호스트가 `EXPO_PUBLIC_KEYRING_API_BASE_URL` 과 일치하는지도 확인해 주세요.',
    );
  }
  return lines.join('\n');
}

/** 목록 조회 시 DB 스펙인 `image_path` 를 이미지 소스로 사용 (상대경로면 API 호스트로 보정) */
function normalizeKeyring(item: KeyringApiItem): Keyring {
  const rawImage =
    item.imageUrl ??
    item.image_url ??
    item.image_path ??
    item.imagePath ??
    '';
  return {
    keyringId: item.keyringId ?? item.keyring_id ?? '',
    imageUrl: resolveKeyringImageUrl(typeof rawImage === 'string' ? rawImage : String(rawImage)),
    prompt: item.prompt ?? '',
    createdAt: item.createdAt ?? item.created_at,
  };
}

async function authorizedFetch(input: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
  }

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };

  /** 메인 API와 동일 게이트웨이면 `x-api-key` 필요할 수 있음 */
  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

function buildGenerateKeyringBody(bookId: string): string {
  const id = bookId.trim();
  if (KEYRING_CREATE_BOOK_ID_JSON_KEY === 'bookId') {
    return JSON.stringify({ bookId: id });
  }
  return JSON.stringify({ book_id: id });
}

export async function generateKeyring(
  payload: GenerateKeyringPayload,
): Promise<GenerateKeyringResponse> {
  const url = `${KEYRING_API_BASE_URL}/badges/keyring`;
  const body = buildGenerateKeyringBody(payload.bookId);

  if (__DEV__) {
    console.log(
      '[keyring] POST /badges/keyring',
      'JSON key:',
      KEYRING_CREATE_BOOK_ID_JSON_KEY,
      'body:',
      body,
    );
  }

  const res = await authorizedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (isInvalidTokenDetail(text)) {
      throw new KeyringInvalidTokenError();
    }
    if (isNotFoundResponse(res.status, text)) {
      throw new KeyringGenerateNotFoundError(KEYRING_API_BASE_URL);
    }
    throw new Error(formatKeyringPostError(res.status, text));
  }

  const data = (await res.json()) as KeyringApiItem;
  const normalized = normalizeKeyring(data);
  return {
    keyringId: normalized.keyringId,
    imageUrl: normalized.imageUrl,
    prompt: normalized.prompt,
  };
}

/** 내 키링 컬렉션 조회 — 이미지는 응답의 `image_path`(또는 URL 필드)를 사용 */
export async function fetchKeyrings(): Promise<Keyring[]> {
  const url = `${KEYRING_API_BASE_URL}/keyrings`;

  const res = await authorizedFetch(url, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (isInvalidTokenDetail(text)) {
      throw new KeyringInvalidTokenError();
    }
    if (__DEV__) {
      console.error(
        '[keyring] GET /keyrings failed',
        '\n  url:',
        url,
        '\n  status:',
        res.status,
        '\n  body:',
        text?.slice(0, 600) || '(empty)',
      );
    }
    throw new Error(formatKeyringListError(res.status, text));
  }

  const raw = await res.json();
  const list = extractKeyringsArray(raw);

  if (__DEV__ && list.length === 0 && raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    console.warn(
      '[keyring] GET /keyrings: 목록 배열을 찾지 못했습니다. 응답 최상위 키:',
      Object.keys(raw as object),
      '호스트:',
      KEYRING_API_BASE_URL,
    );
  }

  return list.map(normalizeKeyring);
}

