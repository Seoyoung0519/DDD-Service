export type ReadingStaminaRangeKey = '100' | '200' | '400' | '400plus';

/** API `range` 쿼리 값 (문서: 0-100, 100-200, 200-400, 400+) */
export const RANGE_TO_API_PARAM: Record<ReadingStaminaRangeKey, string> = {
  '100': '0-100',
  '200': '100-200',
  '400': '200-400',
  '400plus': '400+',
};

export const PAGE_RANGE_OPTIONS: { key: ReadingStaminaRangeKey; label: string }[] = [
  { key: '100', label: '≤ 100쪽' },
  { key: '200', label: '≤ 200쪽' },
  { key: '400', label: '≤ 400쪽' },
  { key: '400plus', label: '> 400쪽' },
];

export function getRangeDescription(range: ReadingStaminaRangeKey): string {
  switch (range) {
    case '100':
      return '짧은 시간에 집중해서 읽고 싶을 때 추천해요. (에세이, 단편집, 단편소설)';
    case '200':
      return '하루 종일 읽기 좋은 분량이에요. (중편소설, 에세이집)';
    case '400':
      return '주말에 몰아서 읽기 좋은 책들이에요. (장편소설, 논픽션)';
    case '400plus':
      return '여유롭게 천천히 읽어보세요. (대작, 시리즈)';
    default:
      return '';
  }
}

export type ReadingStaminaBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pageCount: number;
  aladinItemId?: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function formatStaminaAuthor(authors: unknown): string {
  if (Array.isArray(authors)) {
    const first = authors.find((a) => typeof a === 'string' && a.trim());
    if (typeof first === 'string') {
      return first.replace(/\s*\(지은이\)\s*/gi, '').trim();
    }
  }
  if (typeof authors === 'string' && authors.trim()) {
    return authors.replace(/\s*\(지은이\)\s*/gi, '').trim();
  }
  return '';
}

export function normalizeStaminaBook(raw: unknown): ReadingStaminaBook | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = String(o.id ?? '').trim();
  const title = String(o.title ?? '').trim();
  if (!id || !title) return null;

  const thumb = o.thumbnail_url ?? o.thumbnailUrl ?? o.coverUrl ?? o.cover_url;
  const pageRaw = o.page_count ?? o.pageCount;
  const pageCount = typeof pageRaw === 'number' ? pageRaw : Number(pageRaw);
  const aladinRaw = o.aladin_item_id ?? o.aladinItemId;

  return {
    id,
    title,
    author: formatStaminaAuthor(o.authors ?? o.author) || ' ',
    coverUrl: thumb != null && String(thumb).trim() ? String(thumb).trim() : '',
    pageCount: Number.isFinite(pageCount) ? pageCount : 0,
    aladinItemId:
      aladinRaw != null && String(aladinRaw).trim() ? String(aladinRaw).trim() : null,
  };
}

export function staminaDetailRouteId(book: ReadingStaminaBook): string {
  const a = book.aladinItemId?.trim();
  if (a) return a;
  return book.id;
}
