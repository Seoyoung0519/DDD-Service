"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBanners = listBanners;
exports.getBannerById = getBannerById;
exports.createBanner = createBanner;
exports.updateBanner = updateBanner;
exports.deleteBanner = deleteBanner;
const db_1 = require("../../core/db");
function touchUpdatedAt(payload) {
    return { ...payload, updated_at: new Date().toISOString() };
}
async function listBanners(activeOnly = false) {
    let query = db_1.supabase.from('banners').select('*').order('sort_order', { ascending: true });
    if (activeOnly) {
        query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    if (!activeOnly || !data) {
        return data !== null && data !== void 0 ? data : [];
    }
    const now = Date.now();
    return data.filter((banner) => {
        const startsAt = banner.starts_at ? new Date(banner.starts_at).getTime() : 0;
        const endsAt = banner.ends_at ? new Date(banner.ends_at).getTime() : Number.POSITIVE_INFINITY;
        return startsAt <= now && endsAt >= now;
    });
}
async function getBannerById(id) {
    const { data, error } = await db_1.supabase.from('banners').select('*').eq('id', id).maybeSingle();
    if (error)
        throw error;
    return data;
}
async function createBanner(payload) {
    const { data, error } = await db_1.supabase
        .from('banners')
        .insert({ ...payload, updated_at: new Date().toISOString() })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
async function updateBanner(id, payload) {
    const { data, error } = await db_1.supabase
        .from('banners')
        .update(touchUpdatedAt(payload))
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function deleteBanner(id) {
    const { error } = await db_1.supabase.from('banners').delete().eq('id', id);
    if (error)
        throw error;
}
