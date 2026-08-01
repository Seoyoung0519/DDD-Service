import { publicContentRequest } from '@/src/api/contentApi';

/** GET /api/events — 진행 중(is_active + 기간 내) 이벤트, starts_at DESC */
export type DaedokEventItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export function fetchEvents(): Promise<DaedokEventItem[]> {
  return publicContentRequest<DaedokEventItem[]>('/api/events');
}

export function fetchEvent(id: string): Promise<DaedokEventItem> {
  return publicContentRequest<DaedokEventItem>(`/api/events/${encodeURIComponent(id)}`);
}
