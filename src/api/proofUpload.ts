import { PROOF_API_BASE_URL } from '@/src/config/api';
import {
  getExtendedAccessToken,
  getGoogleIdToken,
} from '@/src/services/auth/authService';
import {
  collectBearerAuthDiagnostics,
  describeBearerTokenKind,
  getProofUploadBearerCandidates,
  isInvalidTokenDetail,
  maskBearerToken,
  parseApiErrorDetail,
} from '@/src/utils/extendedApiAuth';
import {
  cacheDirectory,
  copyAsync,
  getInfoAsync,
} from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { logStatus } from '@/src/utils/appLog';

/** POST /proofs/upload 200 응답 */
export type ProofUploadResult = {
  id: string;
  userId: string | null;
  bookId: string | null;
  readingSessionId: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  pageNumber: number | null;
  capturedAt: string | null;
  isPublic: boolean | null;
  createdAt: string | null;
};

/** POST /proofs/upload — multipart/form-data (OpenAPI) */
export type ProofUploadInput = {
  uri: string;
  bookId: string;
  capturedAt: string;
  readingSessionId?: string;
  pageNumber?: number;
  isPublic?: boolean;
};

type ProofUploadResponse = {
  id?: string;
  userId?: string;
  bookId?: string;
  readingSessionId?: string;
  imagePath?: string;
  imageUrl?: string;
  pageNumber?: number;
  capturedAt?: string;
  isPublic?: boolean;
  createdAt?: string;
};

function proofLog(message: string, _data?: Record<string, unknown>): void {
  logStatus('proofUpload', message);
}

function headersForDiagnostics(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === 'authorization') {
      const raw = value.startsWith('Bearer ') ? value.slice(7) : value;
      out[key] = maskBearerToken(raw).authorizationHeader ?? value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function responseHeadersForDiagnostics(response: Response): Record<string, string> {
  const out: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function normalizeUploadUri(uri: string): string {
  const trimmed = uri.trim();
  if (
    Platform.OS === 'android' &&
    !trimmed.startsWith('file://') &&
    !trimmed.startsWith('content://')
  ) {
    return `file://${trimmed}`;
  }
  return trimmed;
}

async function prepareProofImageUri(
  uri: string,
): Promise<{ uri: string; mimeType: string; size: number }> {
  const normalized = normalizeUploadUri(uri);
  const isPng = /\.png(\?|$)/i.test(normalized);
  const mimeType = isPng ? 'image/png' : 'image/jpeg';

  const hasKnownExt = /\.(jpe?g|png)(\?|$)/i.test(normalized.split('?')[0] ?? normalized);
  if (hasKnownExt) {
    const info = await getInfoAsync(normalized);
    if (info.exists && (info.size ?? 0) > 0) {
      proofLog('using existing image file', { size: info.size, mimeType });
      return { uri: normalized, mimeType, size: info.size ?? 0 };
    }
  }

  if (!cacheDirectory) {
    throw new Error('캐시 디렉터리를 사용할 수 없습니다.');
  }

  const ext = isPng ? 'png' : 'jpg';
  const dest = `${cacheDirectory}proof-upload-${Date.now()}.${ext}`;
  await copyAsync({ from: normalized, to: dest });

  const copied = await getInfoAsync(dest);
  if (!copied.exists || (copied.size ?? 0) <= 0) {
    throw new Error('업로드할 이미지를 준비하지 못했습니다.');
  }

  proofLog('prepared image copied', { uri: dest, size: copied.size });

  return { uri: dest, mimeType, size: copied.size ?? 0 };
}

function buildMultipartBody(
  fileUri: string,
  mimeType: string,
  input: ProofUploadInput,
): FormData {
  const formData = new FormData();
  const fileName = mimeType === 'image/png' ? 'proof.png' : 'proof.jpg';
  formData.append('file', {
    uri: fileUri,
    type: mimeType,
    name: fileName,
  } as unknown as Blob);

  formData.append('bookId', input.bookId);
  formData.append('capturedAt', input.capturedAt);

  if (input.readingSessionId) {
    formData.append('readingSessionId', input.readingSessionId);
  }
  if (input.pageNumber != null) {
    formData.append('pageNumber', String(input.pageNumber));
  }
  if (input.isPublic != null) {
    formData.append('isPublic', String(input.isPublic));
  }

  return formData;
}

async function postProofMultipart(
  url: string,
  fileUri: string,
  mimeType: string,
  input: ProofUploadInput,
  bearerTokens: string[],
): Promise<{ status: number; body: string; responseHeaders: Record<string, string> }> {
  const extended = await getExtendedAccessToken();
  const idToken = await getGoogleIdToken();
  let lastStatus = 0;
  let lastBody = '';
  let lastResponseHeaders: Record<string, string> = {};

  for (let i = 0; i < bearerTokens.length; i += 1) {
    const token = bearerTokens[i];
    const tokenDiag = maskBearerToken(token);
    const kind = describeBearerTokenKind(token, extended, idToken);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    proofLog('auth diagnostics — request', {
      attempt: i + 1,
      totalCandidates: bearerTokens.length,
      tokenKind: kind,
      hasAuthorizationHeader: headers.Authorization.startsWith('Bearer '),
      authorizationValue: tokenDiag.authorizationHeader,
      tokenPresent: tokenDiag.present,
      tokenIsNull: tokenDiag.isNull,
      tokenIsUndefined: tokenDiag.isUndefined,
      tokenIsEmptyString: tokenDiag.isEmptyString,
      tokenLength: tokenDiag.length,
      requestHeaders: headersForDiagnostics(headers),
      note: 'Content-Type은 multipart/form-data로 fetch가 자동 설정 (boundary 포함)',
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: buildMultipartBody(fileUri, mimeType, input),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : '네트워크 연결을 확인해 주세요. 인증샷 서버에 연결할 수 없습니다.';
      if (__DEV__) {
        proofLog('network error — Render 로그에 요청이 없을 수 있음', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw new Error(message);
    }

    const body = await response.text().catch(() => '');
    const responseHeaders = responseHeadersForDiagnostics(response);
    lastStatus = response.status;
    lastBody = body;
    lastResponseHeaders = responseHeaders;

    proofLog('auth diagnostics — response', {
      attempt: i + 1,
      tokenKind: kind,
      status: response.status,
      responseHeaders,
      responseBody: body,
    });

    if (response.ok) {
      return { status: response.status, body, responseHeaders };
    }

    const hasAnotherToken = i < bearerTokens.length - 1;
    if (response.status === 401 && isInvalidTokenDetail(body) && hasAnotherToken) {
      proofLog('401 invalid token — trying next bearer candidate', { nextIndex: i + 2 });
      continue;
    }

    return { status: response.status, body, responseHeaders };
  }

  return { status: lastStatus || 401, body: lastBody, responseHeaders: lastResponseHeaders };
}

function formatProofUploadError(status: number, body: string): string {
  if (isInvalidTokenDetail(body)) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  }
  if (status === 404) {
    return '인증샷 업로드 API를 찾을 수 없습니다. 서버 URL 설정을 확인해 주세요.';
  }
  const detail = parseApiErrorDetail(body);
  if (detail && !/^internal server error$/i.test(detail)) {
    return detail;
  }
  const htmlPre = body.match(/<pre>([^<]+)<\/pre>/i)?.[1]?.trim();
  if (htmlPre) return htmlPre;
  if (status === 422) {
    return detail || '인증샷 요청 형식이 올바르지 않습니다.';
  }
  if (status >= 500) {
    return '인증샷 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.';
  }
  return detail || `인증샷 업로드 실패 (HTTP ${status})`;
}

function parseProofUploadResponse(raw: string): ProofUploadResult {
  const data = raw ? (JSON.parse(raw) as ProofUploadResponse) : null;
  const id = data?.id;
  if (!id) {
    throw new Error('인증샷 응답 형식이 올바르지 않습니다.');
  }
  return {
    id,
    userId: data?.userId ?? null,
    bookId: data?.bookId ?? null,
    readingSessionId: data?.readingSessionId ?? null,
    imagePath: data?.imagePath ?? null,
    imageUrl: data?.imageUrl ?? null,
    pageNumber: data?.pageNumber ?? null,
    capturedAt: data?.capturedAt ?? null,
    isPublic: data?.isPublic ?? null,
    createdAt: data?.createdAt ?? null,
  };
}

export async function uploadReadingProof(input: ProofUploadInput): Promise<ProofUploadResult> {
  const authDiagnostics = await collectBearerAuthDiagnostics();
  proofLog('auth diagnostics — summary (백엔드 공유용)', authDiagnostics as unknown as Record<string, unknown>);

  proofLog('uploadReadingProof called', {
    uriPrefix: input.uri.slice(0, 40),
    bookId: input.bookId,
    readingSessionId: input.readingSessionId,
    pageNumber: input.pageNumber,
    capturedAt: input.capturedAt,
    isPublic: input.isPublic,
  });

  if (!input.bookId.trim()) {
    throw new Error('책 정보가 없어 인증샷을 저장할 수 없습니다.');
  }

  const url = `${PROOF_API_BASE_URL.replace(/\/$/, '')}/proofs/upload`;
  const { uri: fileUri, mimeType, size } = await prepareProofImageUri(input.uri);
  proofLog('image ready', { size, mimeType });

  const bearerTokens = await getProofUploadBearerCandidates();
  if (bearerTokens.length === 0) {
    throw new Error('로그인이 필요합니다.');
  }

  const uploadHost = (() => {
    try {
      return new URL(url).host;
    } catch {
      return PROOF_API_BASE_URL;
    }
  })();

  proofLog('POST fetch multipart', {
    url,
    host: uploadHost,
    fileSize: size,
    mimeType,
    tokenCandidates: bearerTokens.length,
    proofUploadMatchesLibraryFirst: authDiagnostics.proofUploadMatchesLibraryFirst,
    fields: {
      bookId: input.bookId,
      capturedAt: input.capturedAt,
      ...(input.readingSessionId ? { readingSessionId: input.readingSessionId } : {}),
      ...(input.pageNumber != null ? { pageNumber: input.pageNumber } : {}),
      ...(input.isPublic != null ? { isPublic: input.isPublic } : {}),
    },
  });

  const result = await postProofMultipart(url, fileUri, mimeType, input, bearerTokens);

  if (result.status >= 200 && result.status < 300) {
    proofLog('OK', { status: result.status, host: uploadHost });
    return parseProofUploadResponse(result.body);
  }

  proofLog('failed — 백엔드 공유용 캡처', {
    status: result.status,
    host: uploadHost,
    requestUrl: url,
    responseHeaders: result.responseHeaders,
    responseBody: result.body,
    authDiagnostics,
  });

  throw new Error(formatProofUploadError(result.status, result.body));
}

function formatProofDeleteError(status: number, body: string): string {
  if (isInvalidTokenDetail(body)) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  }
  if (status === 403) {
    return '본인 인증샷만 삭제할 수 있습니다.';
  }
  if (status === 404) {
    return '삭제할 인증샷을 찾을 수 없습니다.';
  }
  if (status === 405) {
    return '서버에 인증샷 삭제 API가 아직 없습니다. 백엔드 배포를 확인해 주세요.';
  }
  const detail = parseApiErrorDetail(body);
  if (detail && !/^internal server error$/i.test(detail)) {
    return detail;
  }
  if (status >= 500) {
    return '인증샷 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.';
  }
  return detail || `인증샷 삭제 실패 (HTTP ${status})`;
}

function formatProofListError(status: number, body: string): string {
  if (isInvalidTokenDetail(body)) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  }
  const detail = parseApiErrorDetail(body);
  if (detail && !/^internal server error$/i.test(detail)) {
    return detail;
  }
  if (status >= 500) {
    return '인증샷 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.';
  }
  return detail || `인증샷 목록 조회 실패 (HTTP ${status})`;
}

function resolveProofMediaUrl(rawPath: string): string {
  const s = rawPath.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  const base = PROOF_API_BASE_URL.replace(/\/$/, '');
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
}

function asProofRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeProofListItem(raw: unknown): ProofListItem | null {
  const o = asProofRecord(raw);
  if (!o) return null;
  const idRaw = o.id ?? o.proofId ?? o.proof_id;
  const id = idRaw != null && String(idRaw).trim() ? String(idRaw).trim() : '';
  if (!id) return null;

  const imageRaw =
    o.imageUrl ?? o.image_url ?? o.imagePath ?? o.image_path ?? o.proofImageUrl ?? o.proof_image_url;
  const imageUrl =
    imageRaw != null && String(imageRaw).trim()
      ? resolveProofMediaUrl(String(imageRaw))
      : null;

  const capturedAtRaw = o.capturedAt ?? o.captured_at;
  const createdAtRaw = o.createdAt ?? o.created_at;
  const bookIdRaw = o.bookId ?? o.book_id;

  return {
    id,
    imageUrl,
    bookId:
      bookIdRaw != null && String(bookIdRaw).trim() ? String(bookIdRaw).trim() : null,
    capturedAt:
      typeof capturedAtRaw === 'string' && capturedAtRaw.trim() ? capturedAtRaw.trim() : null,
    createdAt:
      typeof createdAtRaw === 'string' && createdAtRaw.trim() ? createdAtRaw.trim() : null,
  };
}

/** ISO / 날짜 문자열 → 로컬 YYYY-MM-DD (캘린더 날짜와 매칭) */
export function proofLocalDateKey(isoOrDate: string | null | undefined): string | null {
  if (!isoOrDate?.trim()) return null;
  const s = isoOrDate.trim();
  const plain = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (plain && (s.length === 10 || s[10] === 'T' || s[10] === ' ')) {
    // date-only는 타임존 변환 없이 그대로 사용
    if (s.length === 10) return plain[1];
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return plain ? plain[1] : null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type ProofListItem = {
  id: string;
  imageUrl: string | null;
  bookId: string | null;
  capturedAt: string | null;
  createdAt: string | null;
};

export type ListMyProofsOptions = {
  limit?: number;
  before?: string | null;
  bookId?: string | null;
};

/** GET /proofs — 내 인증샷 목록 */
export async function listMyProofs(
  options: ListMyProofsOptions = {},
): Promise<ProofListItem[]> {
  const bearerTokens = await getProofUploadBearerCandidates();
  if (bearerTokens.length === 0) {
    throw new Error('로그인이 필요합니다.');
  }

  const params = new URLSearchParams();
  const limit = Math.min(50, Math.max(1, options.limit ?? 50));
  params.set('limit', String(limit));
  if (options.before?.trim()) params.set('before', options.before.trim());
  if (options.bookId?.trim()) params.set('bookId', options.bookId.trim());

  const url = `${PROOF_API_BASE_URL.replace(/\/$/, '')}/proofs?${params.toString()}`;
  let lastStatus = 0;
  let lastBody = '';

  for (let i = 0; i < bearerTokens.length; i += 1) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${bearerTokens[i]}`,
      Accept: 'application/json',
    };
    const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;

    proofLog('GET proofs', { attempt: i + 1, url });

    let response: Response;
    try {
      response = await fetch(url, { method: 'GET', headers });
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error
          ? error.message
          : '네트워크 연결을 확인해 주세요. 인증샷 서버에 연결할 수 없습니다.',
      );
    }

    const body = await response.text().catch(() => '');
    lastStatus = response.status;
    lastBody = body;

    if (response.ok) {
      let json: unknown = {};
      try {
        json = body ? JSON.parse(body) : {};
      } catch {
        json = {};
      }
      const root = asProofRecord(json);
      const itemsRaw = Array.isArray(json)
        ? json
        : Array.isArray(root?.items)
          ? root.items
          : Array.isArray(root?.proofs)
            ? root.proofs
            : [];
      return itemsRaw
        .map(normalizeProofListItem)
        .filter((x): x is ProofListItem => x != null);
    }

    const hasAnotherToken = i < bearerTokens.length - 1;
    if (response.status === 401 && isInvalidTokenDetail(body) && hasAnotherToken) {
      continue;
    }

    throw new Error(formatProofListError(response.status, body));
  }

  throw new Error(formatProofListError(lastStatus || 401, lastBody));
}

/**
 * 해당 연·월에 찍힌 인증샷을 모은다 (페이지네이션).
 * 실패 시 빈 배열 — 캘린더 조회는 막지 않음.
 */
export async function listMyProofsForMonth(
  year: number,
  month: number,
): Promise<ProofListItem[]> {
  const y = Math.floor(year);
  const m = Math.floor(month);
  if (!Number.isFinite(y) || m < 1 || m > 12) return [];

  const monthPrefix = `${y}-${String(m).padStart(2, '0')}`;
  const lastDay = new Date(y, m, 0).getDate();
  const monthStart = `${monthPrefix}-01`;
  const monthEnd = `${monthPrefix}-${String(lastDay).padStart(2, '0')}`;
  const collected: ProofListItem[] = [];
  const seen = new Set<string>();
  let before: string | null = null;
  let guard = 0;

  try {
    while (guard < 8) {
      guard += 1;
      const page = await listMyProofs({ limit: 50, before });
      if (page.length === 0) break;

      let reachedOlder = false;
      for (const item of page) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        const key = proofLocalDateKey(item.capturedAt ?? item.createdAt);
        if (!key) continue;
        if (key >= monthStart && key <= monthEnd) {
          collected.push(item);
        } else if (key < monthStart) {
          reachedOlder = true;
        }
      }

      const last = page[page.length - 1];
      const nextBefore = last?.createdAt ?? last?.capturedAt ?? null;
      if (!nextBefore || nextBefore === before || page.length < 50 || reachedOlder) {
        break;
      }
      before = nextBefore;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[listMyProofsForMonth] failed', error);
    }
    return collected;
  }

  return collected;
}

/** DELETE /proofs/{proofId} — 본인 인증샷 삭제 (성공 시 204) */
export async function deleteReadingProof(proofId: string): Promise<void> {
  const id = proofId.trim();
  if (!id) {
    throw new Error('삭제할 인증샷 ID가 없습니다.');
  }

  const url = `${PROOF_API_BASE_URL.replace(/\/$/, '')}/proofs/${encodeURIComponent(id)}`;
  const bearerTokens = await getProofUploadBearerCandidates();
  if (bearerTokens.length === 0) {
    throw new Error('로그인이 필요합니다.');
  }

  let lastStatus = 0;
  let lastBody = '';

  for (let i = 0; i < bearerTokens.length; i += 1) {
    const token = bearerTokens[i];
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;

    proofLog('DELETE proof', { attempt: i + 1, proofId: id, url });

    let response: Response;
    try {
      response = await fetch(url, { method: 'DELETE', headers });
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error
          ? error.message
          : '네트워크 연결을 확인해 주세요. 인증샷 서버에 연결할 수 없습니다.',
      );
    }

    const body = await response.text().catch(() => '');
    lastStatus = response.status;
    lastBody = body;

    if (response.status === 204 || (response.status >= 200 && response.status < 300)) {
      proofLog('DELETE OK', { status: response.status, proofId: id });
      return;
    }

    proofLog('DELETE failed', {
      status: response.status,
      proofId: id,
      body: body.slice(0, 300),
    });

    const hasAnotherToken = i < bearerTokens.length - 1;
    if (response.status === 401 && isInvalidTokenDetail(body) && hasAnotherToken) {
      continue;
    }

    throw new Error(formatProofDeleteError(response.status, body));
  }

  throw new Error(formatProofDeleteError(lastStatus || 401, lastBody));
}
