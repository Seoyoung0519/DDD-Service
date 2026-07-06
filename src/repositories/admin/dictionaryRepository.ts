import { supabase } from '../../core/db';

function touchUpdatedAt<T extends Record<string, unknown>>(payload: T): T & { updated_at: string } {
  return { ...payload, updated_at: new Date().toISOString() };
}

export async function listDictionaryEntries(publishedOnly = false, search?: string) {
  let query = supabase.from('dictionary_entries').select('*').order('term', { ascending: true });
  if (publishedOnly) {
    query = query.eq('is_published', true);
  }
  if (search?.trim()) {
    query = query.or(`term.ilike.%${search.trim()}%,definition.ilike.%${search.trim()}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getDictionaryEntryById(id: string) {
  const { data, error } = await supabase
    .from('dictionary_entries')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDictionaryEntry(payload: {
  term: string;
  definition: string;
  category?: string | null;
  is_published?: boolean;
}) {
  const { data, error } = await supabase
    .from('dictionary_entries')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateDictionaryEntry(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('dictionary_entries')
    .update(touchUpdatedAt(payload))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteDictionaryEntry(id: string) {
  const { error } = await supabase.from('dictionary_entries').delete().eq('id', id);
  if (error) throw error;
}
