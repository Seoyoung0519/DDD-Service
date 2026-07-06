import { supabase } from '../../core/db';
import { ReportStatus } from '../../types/admin';

function touchUpdatedAt<T extends Record<string, unknown>>(payload: T): T & { updated_at: string } {
  return { ...payload, updated_at: new Date().toISOString() };
}

export async function listReports(status?: ReportStatus) {
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReportById(id: string) {
  const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createReport(payload: {
  reporter_user_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description?: string | null;
}) {
  const { data, error } = await supabase
    .from('reports')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateReport(
  id: string,
  payload: {
    status?: ReportStatus;
    admin_note?: string | null;
    resolved_by?: string | null;
  },
) {
  const updates: Record<string, unknown> = { ...payload };
  if (payload.status === 'resolved' || payload.status === 'dismissed') {
    updates.resolved_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from('reports')
    .update(touchUpdatedAt(updates))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}
