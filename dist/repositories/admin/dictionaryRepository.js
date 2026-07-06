"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDictionaryEntries = listDictionaryEntries;
exports.getDictionaryEntryById = getDictionaryEntryById;
exports.createDictionaryEntry = createDictionaryEntry;
exports.updateDictionaryEntry = updateDictionaryEntry;
exports.deleteDictionaryEntry = deleteDictionaryEntry;
const db_1 = require("../../core/db");
function touchUpdatedAt(payload) {
    return { ...payload, updated_at: new Date().toISOString() };
}
async function listDictionaryEntries(publishedOnly = false, search) {
    let query = db_1.supabase.from('dictionary_entries').select('*').order('term', { ascending: true });
    if (publishedOnly) {
        query = query.eq('is_published', true);
    }
    if (search === null || search === void 0 ? void 0 : search.trim()) {
        query = query.or(`term.ilike.%${search.trim()}%,definition.ilike.%${search.trim()}%`);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return data !== null && data !== void 0 ? data : [];
}
async function getDictionaryEntryById(id) {
    const { data, error } = await db_1.supabase
        .from('dictionary_entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function createDictionaryEntry(payload) {
    const { data, error } = await db_1.supabase
        .from('dictionary_entries')
        .insert({ ...payload, updated_at: new Date().toISOString() })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
async function updateDictionaryEntry(id, payload) {
    const { data, error } = await db_1.supabase
        .from('dictionary_entries')
        .update(touchUpdatedAt(payload))
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function deleteDictionaryEntry(id) {
    const { error } = await db_1.supabase.from('dictionary_entries').delete().eq('id', id);
    if (error)
        throw error;
}
