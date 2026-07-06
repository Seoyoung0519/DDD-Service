"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPicks = listPicks;
exports.getPickById = getPickById;
exports.createPick = createPick;
exports.updatePick = updatePick;
exports.deletePick = deletePick;
const db_1 = require("../../core/db");
function touchUpdatedAt(payload) {
    return { ...payload, updated_at: new Date().toISOString() };
}
async function listPicks(activeOnly = false) {
    let query = db_1.supabase.from('picks').select('*').order('sort_order', { ascending: true });
    if (activeOnly) {
        query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data !== null && data !== void 0 ? data : [];
}
async function getPickById(id) {
    const { data, error } = await db_1.supabase.from('picks').select('*').eq('id', id).maybeSingle();
    if (error)
        throw error;
    return data;
}
async function createPick(payload) {
    const { data, error } = await db_1.supabase
        .from('picks')
        .insert({ ...payload, updated_at: new Date().toISOString() })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
async function updatePick(id, payload) {
    const { data, error } = await db_1.supabase
        .from('picks')
        .update(touchUpdatedAt(payload))
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function deletePick(id) {
    const { error } = await db_1.supabase.from('picks').delete().eq('id', id);
    if (error)
        throw error;
}
