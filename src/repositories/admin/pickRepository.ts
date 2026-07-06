import { supabase } from '../../core/db';

function touchUpdatedAt<T extends Record<string, unknown>>(payload: T): T & { updated_at: string } {
  return { ...payload, updated_at: new Date().toISOString() };
}

export async function listPicks(activeOnly = false) {
  let query = supabase.from('picks').select('*').order('sort_order', { ascending: true });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPickById(id: string) {
  const { data, error } = await supabase.from('picks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPick(payload: {
  title: string;
  description?: string | null;
  book_isbn?: string | null;
  cover_image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('picks')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePick(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('picks')
    .update(touchUpdatedAt(payload))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deletePick(id: string) {
  const { error } = await supabase.from('picks').delete().eq('id', id);
  if (error) throw error;
}
