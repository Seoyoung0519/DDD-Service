"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
exports.getEventById = getEventById;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
const db_1 = require("../../core/db");
function touchUpdatedAt(payload) {
    return { ...payload, updated_at: new Date().toISOString() };
}
async function listEvents(activeOnly = false) {
    let query = db_1.supabase.from('events').select('*').order('starts_at', { ascending: false });
    if (activeOnly) {
        const now = new Date().toISOString();
        query = query.eq('is_active', true).lte('starts_at', now).gte('ends_at', now);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data !== null && data !== void 0 ? data : [];
}
async function getEventById(id) {
    const { data, error } = await db_1.supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (error)
        throw error;
    return data;
}
async function createEvent(payload) {
    const { data, error } = await db_1.supabase
        .from('events')
        .insert({
        description: '',
        ...payload,
        updated_at: new Date().toISOString(),
    })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
async function updateEvent(id, payload) {
    const { data, error } = await db_1.supabase
        .from('events')
        .update(touchUpdatedAt(payload))
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function deleteEvent(id) {
    const { error } = await db_1.supabase.from('events').delete().eq('id', id);
    if (error)
        throw error;
}
