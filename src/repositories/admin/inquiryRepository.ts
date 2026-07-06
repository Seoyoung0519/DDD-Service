import { supabase } from '../../core/db';
import { InquiryStatus } from '../../types/admin';

function touchUpdatedAt<T extends Record<string, unknown>>(payload: T): T & { updated_at: string } {
  return { ...payload, updated_at: new Date().toISOString() };
}

export async function listInquiries(status?: InquiryStatus, userId?: string) {
  let query = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getInquiryById(id: string) {
  const { data, error } = await supabase.from('inquiries').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createInquiry(payload: {
  user_id: string;
  subject: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from('inquiries')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateInquiry(
  id: string,
  payload: {
    status?: InquiryStatus;
    admin_reply?: string | null;
    replied_by?: string | null;
    subject?: string;
    content?: string;
  },
) {
  const updates: Record<string, unknown> = { ...payload };
  if (payload.admin_reply) {
    updates.replied_at = new Date().toISOString();
    updates.status = payload.status ?? 'answered';
  }
  const { data, error } = await supabase
    .from('inquiries')
    .update(touchUpdatedAt(updates))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteInquiry(id: string) {
  const { error } = await supabase.from('inquiries').delete().eq('id', id);
  if (error) throw error;
}
