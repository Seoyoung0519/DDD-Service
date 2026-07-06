import { supabase } from '../../core/db';

function touchUpdatedAt<T extends Record<string, unknown>>(payload: T): T & { updated_at: string } {
  return { ...payload, updated_at: new Date().toISOString() };
}

export async function listBanners(activeOnly = false) {
  let query = supabase.from('banners').select('*').order('sort_order', { ascending: true });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) throw error;

  if (!activeOnly || !data) {
    return data ?? [];
  }

  const now = Date.now();
  return data.filter((banner) => {
    const startsAt = banner.starts_at ? new Date(banner.starts_at as string).getTime() : 0;
    const endsAt = banner.ends_at ? new Date(banner.ends_at as string).getTime() : Number.POSITIVE_INFINITY;
    return startsAt <= now && endsAt >= now;
  });
}

export async function getBannerById(id: string) {
  const { data, error } = await supabase.from('banners').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBanner(payload: {
  title: string;
  image_url: string;
  link_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  const { data, error } = await supabase
    .from('banners')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateBanner(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('banners')
    .update(touchUpdatedAt(payload))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}
