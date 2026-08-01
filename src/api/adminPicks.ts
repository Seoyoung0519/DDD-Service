import { adminRequest } from '@/src/api/adminApi';

export type AdminPick = {
  id: string;
  title: string;
  description: string | null;
  book_isbn: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateAdminPickInput = {
  title: string;
  description?: string | null;
  book_isbn?: string | null;
  cover_image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type UpdateAdminPickInput = Partial<CreateAdminPickInput>;

export function fetchAdminPicks(): Promise<AdminPick[]> {
  return adminRequest<AdminPick[]>('/api/admin/picks');
}

export function fetchAdminPick(id: string): Promise<AdminPick> {
  return adminRequest<AdminPick>(`/api/admin/picks/${encodeURIComponent(id)}`);
}

export function createAdminPick(input: CreateAdminPickInput): Promise<AdminPick> {
  return adminRequest<AdminPick>('/api/admin/picks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminPick(
  id: string,
  input: UpdateAdminPickInput,
): Promise<AdminPick> {
  return adminRequest<AdminPick>(`/api/admin/picks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminPick(id: string): Promise<void> {
  await adminRequest<void>(`/api/admin/picks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
