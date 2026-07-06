"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInquiries = listInquiries;
exports.getInquiryById = getInquiryById;
exports.createInquiry = createInquiry;
exports.updateInquiry = updateInquiry;
exports.deleteInquiry = deleteInquiry;
const db_1 = require("../../core/db");
function touchUpdatedAt(payload) {
    return { ...payload, updated_at: new Date().toISOString() };
}
async function listInquiries(status, userId) {
    let query = db_1.supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    if (status) {
        query = query.eq('status', status);
    }
    if (userId) {
        query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data !== null && data !== void 0 ? data : [];
}
async function getInquiryById(id) {
    const { data, error } = await db_1.supabase.from('inquiries').select('*').eq('id', id).maybeSingle();
    if (error)
        throw error;
    return data;
}
async function createInquiry(payload) {
    const { data, error } = await db_1.supabase
        .from('inquiries')
        .insert({ ...payload, updated_at: new Date().toISOString() })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
async function updateInquiry(id, payload) {
    var _a;
    const updates = { ...payload };
    if (payload.admin_reply) {
        updates.replied_at = new Date().toISOString();
        updates.status = (_a = payload.status) !== null && _a !== void 0 ? _a : 'answered';
    }
    const { data, error } = await db_1.supabase
        .from('inquiries')
        .update(touchUpdatedAt(updates))
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function deleteInquiry(id) {
    const { error } = await db_1.supabase.from('inquiries').delete().eq('id', id);
    if (error)
        throw error;
}
