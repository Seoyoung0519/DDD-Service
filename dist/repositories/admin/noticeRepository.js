"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotices = listNotices;
exports.getNoticeById = getNoticeById;
exports.createNotice = createNotice;
exports.updateNotice = updateNotice;
exports.deleteNotice = deleteNotice;
const db_1 = require("../../core/db");
function touchUpdatedAt(payload) {
    return { ...payload, updated_at: new Date().toISOString() };
}
async function listNotices(publishedOnly = false) {
    let query = db_1.supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (publishedOnly) {
        query = query.eq('is_published', true);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data !== null && data !== void 0 ? data : [];
}
async function getNoticeById(id) {
    const { data, error } = await db_1.supabase.from('notices').select('*').eq('id', id).maybeSingle();
    if (error)
        throw error;
    return data;
}
async function createNotice(payload) {
    var _a, _b, _c;
    const now = new Date().toISOString();
    const row = {
        title: payload.title,
        content: (_a = payload.content) !== null && _a !== void 0 ? _a : '',
        is_published: (_b = payload.is_published) !== null && _b !== void 0 ? _b : false,
        published_at: payload.is_published ? ((_c = payload.published_at) !== null && _c !== void 0 ? _c : now) : null,
        updated_at: now,
    };
    const { data, error } = await db_1.supabase.from('notices').insert(row).select('*').single();
    if (error)
        throw error;
    return data;
}
async function updateNotice(id, payload) {
    const updates = touchUpdatedAt({ ...payload });
    if (payload.is_published === true && !payload.published_at) {
        updates.published_at = new Date().toISOString();
    }
    const { data, error } = await db_1.supabase
        .from('notices')
        .update(updates)
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function deleteNotice(id) {
    const { error } = await db_1.supabase.from('notices').delete().eq('id', id);
    if (error)
        throw error;
}
