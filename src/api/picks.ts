import { publicContentRequest } from '@/src/api/contentApi';

/** GET /api/picks — 활성(is_active=true) Pick, sort_order ASC */
export type DaedokPickItem = {
  id: string;
  title: string;
  description: string | null;
  book_isbn: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export function fetchPicks(): Promise<DaedokPickItem[]> {
  return publicContentRequest<DaedokPickItem[]>('/api/picks');
}

export function fetchPick(id: string): Promise<DaedokPickItem> {
  return publicContentRequest<DaedokPickItem>(`/api/picks/${encodeURIComponent(id)}`);
}
