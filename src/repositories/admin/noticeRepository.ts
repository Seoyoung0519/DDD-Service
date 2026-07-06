import { supabase } from '../../core/db';

function touchUpdatedAt<T extends Record<string, unknown>>(payload: T): T & { updated_at: string } {
  return { ...payload, updated_at: new Date().toISOString() };
}

export async function listNotices(publishedOnly = false) {
  let query = supabase.from('notices').select('*').order('created_at', { ascending: false });
  if (publishedOnly) {
    query = query.eq('is_published', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getNoticeById(id: string) {
  const { data, error } = await supabase.from('notices').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createNotice(payload: {
  title: string;
  content?: string;
  is_published?: boolean;
  published_at?: string | null;
}) {
  const now = new Date().toISOString();
  const row = {
    title: payload.title,
    content: payload.content ?? '',
    is_published: payload.is_published ?? false,
    published_at: payload.is_published ? (payload.published_at ?? now) : null,
    updated_at: now,
  };
  const { data, error } = await supabase.from('notices').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateNotice(id: string, payload: Record<string, unknown>) {
  const updates = touchUpdatedAt({ ...payload });
  if (payload.is_published === true && !payload.published_at) {
    updates.published_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from('notices')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteNotice(id: string) {
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) throw error;
}
