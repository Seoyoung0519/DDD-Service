import { adminRequest } from '@/src/api/adminApi';

export type AdminEvent = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateAdminEventInput = {
  title: string;
  description?: string;
  image_url?: string | null;
  link_url?: string | null;
  starts_at: string;
  ends_at: string;
  is_active?: boolean;
};

export type UpdateAdminEventInput = Partial<CreateAdminEventInput>;

export function fetchAdminEvents(): Promise<AdminEvent[]> {
  return adminRequest<AdminEvent[]>('/api/admin/events');
}

export function fetchAdminEvent(id: string): Promise<AdminEvent> {
  return adminRequest<AdminEvent>(`/api/admin/events/${encodeURIComponent(id)}`);
}

export function createAdminEvent(input: CreateAdminEventInput): Promise<AdminEvent> {
  return adminRequest<AdminEvent>('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminEvent(
  id: string,
  input: UpdateAdminEventInput,
): Promise<AdminEvent> {
  return adminRequest<AdminEvent>(`/api/admin/events/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminEvent(id: string): Promise<void> {
  await adminRequest<void>(`/api/admin/events/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
