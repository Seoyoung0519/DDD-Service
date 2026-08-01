import { adminRequest } from '@/src/api/adminApi';

export type AdminDictionaryEntry = {
  id: string;
  term: string;
  definition: string;
  category: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateAdminDictionaryEntryInput = {
  term: string;
  definition: string;
  category?: string | null;
  is_published?: boolean;
};

export type UpdateAdminDictionaryEntryInput = Partial<CreateAdminDictionaryEntryInput>;

export function fetchAdminDictionary(query?: string): Promise<AdminDictionaryEntry[]> {
  const search = query?.trim();
  return adminRequest<AdminDictionaryEntry[]>(
    `/api/admin/dictionary${search ? `?q=${encodeURIComponent(search)}` : ''}`,
  );
}

export function fetchAdminDictionaryEntry(id: string): Promise<AdminDictionaryEntry> {
  return adminRequest<AdminDictionaryEntry>(
    `/api/admin/dictionary/${encodeURIComponent(id)}`,
  );
}

export function createAdminDictionaryEntry(
  input: CreateAdminDictionaryEntryInput,
): Promise<AdminDictionaryEntry> {
  return adminRequest<AdminDictionaryEntry>('/api/admin/dictionary', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminDictionaryEntry(
  id: string,
  input: UpdateAdminDictionaryEntryInput,
): Promise<AdminDictionaryEntry> {
  return adminRequest<AdminDictionaryEntry>(
    `/api/admin/dictionary/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

export async function deleteAdminDictionaryEntry(id: string): Promise<void> {
  await adminRequest<void>(`/api/admin/dictionary/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
