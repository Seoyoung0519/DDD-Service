/**
 * 카테고리별 추천 — GET `/api/books/category?categoryId=`, `/api/books/sections`
 */
import { apiClient } from '@/src/api/client';

export type CategoryBook = {
  id?: string;
  aladinItemId: string;
  title: string;
  author: string;
  coverUrl: string;
  isbn13?: string | null;
};

export type CategorySection = {
  title: string;
  books: CategoryBook[];
  /** 섹션 상세 — GET /api/books/category?categoryId= */
  categoryId?: number;
};

type CategoryBooksResponse = {
  success?: boolean;
  data?: { books?: unknown[] };
  error?: string | null;
};

type CategorySectionsResponse = {
  success?: boolean;
  data?: {
    category?: string;
    sections?: { title?: string; books?: unknown[]; categoryId?: unknown; category_id?: unknown }[];
  };
  error?: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function parseOptionalInt(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function formatCategoryAuthor(authors: unknown): string {
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

export function normalizeCategoryBook(raw: unknown): CategoryBook | null {
  const o = asRecord(raw);
  if (!o) return null;

  const title = String(o.title ?? '').trim();
  if (!title) return null;

  const aladinRaw = o.aladin_item_id ?? o.aladinItemId;
  const idRaw = o.id;
  const thumb = o.thumbnail_url ?? o.thumbnailUrl ?? o.coverUrl;

  const aladinItemId =
    aladinRaw != null && String(aladinRaw).trim() ? String(aladinRaw).trim() : '';
  if (!aladinItemId && !idRaw) return null;

  return {
    id: idRaw != null ? String(idRaw) : undefined,
    aladinItemId: aladinItemId || String(idRaw),
    title,
    author: formatCategoryAuthor(o.authors ?? o.author) || ' ',
    coverUrl: thumb != null && String(thumb).trim() ? String(thumb).trim() : '',
    isbn13: o.isbn13 != null ? String(o.isbn13) : null,
  };
}

function normalizeBooks(raw: unknown): CategoryBook[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCategoryBook).filter((b): b is CategoryBook => b != null);
}

function normalizeCategorySection(raw: unknown): CategorySection | null {
  const o = asRecord(raw);
  if (!o) return null;

  const title = String(o.title ?? '').trim();
  if (!title) return null;

  const books = normalizeBooks(o.books);
  const categoryId =
    parseOptionalInt(o.categoryId) ??
    parseOptionalInt(o.category_id) ??
    parseOptionalInt(o.aladinCategoryId) ??
    parseOptionalInt(o.aladin_category_id);

  return { title, books, categoryId };
}

export function categoryBookDetailRouteId(book: CategoryBook): string {
  return book.aladinItemId?.trim() || book.id || '';
}

export type FetchCategoryBooksOptions = {
  limit?: number;
};

/** GET /api/books/sections — 신작·베스트 섹션당 서버 최대 반환 권수 */
export const CATEGORY_SECTIONS_MAX_BOOKS = 20;

/** GET /api/books/category?categoryId= — 전체 보기(칩) limit 상한 */
export const CATEGORY_BOOKS_MAX_LIMIT = 1000;

/** GET /api/books/category?categoryId={id} */
export async function fetchBooksByCategoryId(
  categoryId: number,
  options: FetchCategoryBooksOptions = {},
): Promise<CategoryBook[]> {
  const res = await apiClient.get<CategoryBooksResponse>('/api/books/category', {
    params: {
      categoryId,
      ...(options.limit != null ? { limit: options.limit } : {}),
    },
  });
  return normalizeBooks(res.data?.data?.books ?? []);
}

/**
 * GET /api/books/sections?category={novel|essay|...}
 * — 알라딘 ItemNewAll / Bestseller 병렬 호출, 섹션당 최대 20권
 */
export async function fetchCategorySections(
  category: string,
): Promise<{ categoryName: string; sections: CategorySection[] }> {
  const res = await apiClient.get<CategorySectionsResponse>('/api/books/sections', {
    params: { category },
  });

  const data = res.data?.data;
  const sections = (data?.sections ?? [])
    .map(normalizeCategorySection)
    .filter((s): s is CategorySection => s != null && s.title.length > 0 && s.books.length > 0);

  return {
    categoryName: String(data?.category ?? category).trim(),
    sections,
  };
}

/** 섹션 상세 — sections API 재조회 후 title 로 매칭 (최대 20권) */
export async function fetchCategorySectionBooks(
  category: string,
  sectionTitle: string,
): Promise<CategoryBook[]> {
  const { sections } = await fetchCategorySections(category);
  const section = sections.find((s) => s.title === sectionTitle);
  return section?.books ?? [];
}
