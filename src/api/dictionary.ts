import { publicContentRequest } from '@/src/api/contentApi';

/** GET /api/dictionary — 게시된 대독사전 (앱 UI는 기존 화면 유지, API만 준비) */
export type DictionaryEntry = {
  id: string;
  term: string;
  definition: string;
  category: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export function fetchDictionary(q?: string): Promise<DictionaryEntry[]> {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return publicContentRequest<DictionaryEntry[]>(`/api/dictionary${query}`);
}

export function fetchDictionaryEntry(id: string): Promise<DictionaryEntry> {
  return publicContentRequest<DictionaryEntry>(
    `/api/dictionary/${encodeURIComponent(id)}`,
  );
}
