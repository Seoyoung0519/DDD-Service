/**
 * user_books 찜하기 — 확장 API (`LIBRARY_API_BASE_URL`, 기본 daedokdan-api-8s8k)
 * POST /user-books/wish
 */
import { libraryAuthedFetch } from '@/src/api/library';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export type WishAddResponse = {
  ok: true;
  userBookId: string;
  bookId: string;
  /** 백엔드가 내려주면 알라딘 품번 (상세·검색과 동일 id) */
  aladinItemId?: string | null;
  status: 'wish';
};

export class WishAddFailure extends Error {
  constructor(
    message: string,
    public readonly code: 'not_found' | 'conflict' | 'unknown',
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'WishAddFailure';
  }
}

/** FastAPI: `detail` 문자열 또는 검증 오류 배열 */
function parseDetail(json: unknown): string {
  const o = asRecord(json);
  const d = o?.detail;
  if (typeof d === 'string') return d.trim();
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0];
    const r = asRecord(first);
    const msg = r?.msg;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return '';
}

function messageForHttpStatus(status: number, detail: string): string {
  if (detail) return detail;
  if (status >= 500) {
    return '서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요.';
  }
  if (status === 401 || status === 403) {
    return '로그인이 필요하거나 권한이 없습니다. 다시 로그인한 뒤 시도해 주세요.';
  }
  if (status === 422) {
    return '요청 형식이 올바르지 않습니다.';
  }
  return `찜하기에 실패했습니다. (${status})`;
}

/** 409 detail → 사용자용 문구 (서버 문구에 status 포함 가정) */
function messageFrom409Detail(detail: string): string {
  const d = detail.toLowerCase();
  if (d.includes('wish')) return '이미 찜한 책입니다.';
  if (d.includes('reading')) return '이미 읽는 중인 책입니다.';
  if (d.includes('completed')) return '이미 완독한 책입니다.';
  /** 예: `Book already in shelf with status 'planned'` */
  if (d.includes('planned') || d.includes('shelf')) {
    return '이미 서랍장에 담은 책입니다.';
  }
  if (detail) return detail;
  return '이미 내 서재에 있는 책입니다.';
}

/**
 * 책 찜하기 — 로그인 필요
 * 성공 시 201 + { ok, userBookId, bookId, status: "wish" }
 */
export async function addBookToWish(bookId: string): Promise<WishAddResponse> {
  const trimmed = bookId.trim();
  if (!trimmed) {
    throw new WishAddFailure('도서 ID가 없습니다.', 'unknown', 400);
  }

  const res = await libraryAuthedFetch('/user-books/wish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId: trimmed }),
  });

  const raw = await res.text().catch(() => '');
  let json: unknown;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = {};
  }

  if (res.status === 404) {
    const detail = parseDetail(json);
    throw new WishAddFailure(
      detail || '존재하지 않는 책입니다.',
      'not_found',
      404,
    );
  }

  if (res.status === 409) {
    const detail = parseDetail(json);
    throw new WishAddFailure(messageFrom409Detail(detail), 'conflict', 409);
  }

  if (!res.ok) {
    const detail = parseDetail(json);
    throw new WishAddFailure(
      messageForHttpStatus(res.status, detail),
      'unknown',
      res.status,
    );
  }

  const o = asRecord(json);
  const ok = o?.ok === true;
  const userBookId = o?.userBookId != null ? String(o.userBookId) : '';
  const bid = o?.bookId != null ? String(o.bookId) : trimmed;
  const status = o?.status === 'wish' ? 'wish' : ('wish' as const);
  const aladinRaw = o?.aladinItemId ?? o?.aladin_item_id;
  const aladinItemId =
    aladinRaw != null && String(aladinRaw).trim() ? String(aladinRaw).trim() : null;

  if (!ok || !userBookId) {
    throw new WishAddFailure('찜하기 응답 형식이 올바르지 않습니다.', 'unknown', res.status);
  }

  return {
    ok: true,
    userBookId,
    bookId: bid,
    aladinItemId,
    status,
  };
}
