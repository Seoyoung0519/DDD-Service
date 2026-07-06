import { supabase } from '../../core/db';

function touchUpdatedAt<T extends Record<string, unknown>>(payload: T): T & { updated_at: string } {
  return { ...payload, updated_at: new Date().toISOString() };
}

export async function listEvents(activeOnly = false) {
  let query = supabase.from('events').select('*').order('starts_at', { ascending: false });
  if (activeOnly) {
    const now = new Date().toISOString();
    query = query.eq('is_active', true).lte('starts_at', now).gte('ends_at', now);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getEventById(id: string) {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEvent(payload: {
  title: string;
  description?: string;
  image_url?: string | null;
  link_url?: string | null;
  starts_at: string;
  ends_at: string;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      description: '',
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('events')
    .update(touchUpdatedAt(payload))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
