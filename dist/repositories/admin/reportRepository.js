"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReports = listReports;
exports.getReportById = getReportById;
exports.createReport = createReport;
exports.updateReport = updateReport;
exports.deleteReport = deleteReport;
const db_1 = require("../../core/db");
function touchUpdatedAt(payload) {
    return { ...payload, updated_at: new Date().toISOString() };
}
async function listReports(status) {
    let query = db_1.supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (status) {
        query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data !== null && data !== void 0 ? data : [];
}
async function getReportById(id) {
    const { data, error } = await db_1.supabase.from('reports').select('*').eq('id', id).maybeSingle();
    if (error)
        throw error;
    return data;
}
async function createReport(payload) {
    const { data, error } = await db_1.supabase
        .from('reports')
        .insert({ ...payload, updated_at: new Date().toISOString() })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
async function updateReport(id, payload) {
    const updates = { ...payload };
    if (payload.status === 'resolved' || payload.status === 'dismissed') {
        updates.resolved_at = new Date().toISOString();
    }
    const { data, error } = await db_1.supabase
        .from('reports')
        .update(touchUpdatedAt(updates))
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function deleteReport(id) {
    const { error } = await db_1.supabase.from('reports').delete().eq('id', id);
    if (error)
        throw error;
}
