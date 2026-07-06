"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserBasePpm = getUserBasePpm;
exports.updateUserBasePpm = updateUserBasePpm;
// src/repositories/userRepository.ts
const db_1 = require("../core/db");
/**
 * user_profiles.base_ppm 가져오기
 * - 없거나 0/음수면 null 리턴 (서비스에서 기본값으로 대체)
 */
async function getUserBasePpm(userId) {
    const { data, error } = await db_1.supabase
        .from('user_profiles') // 🔹 users → user_profiles 로 변경
        .select('base_ppm')
        .eq('user_id', userId) // 🔹 컬럼이 user_id 라고 가정 (FK)
        .maybeSingle();
    if (error) {
        console.error('[getUserBasePpm] error', error.message, error.details, error.hint);
        // 프로필이 아직 없거나 컬럼이 없을 수도 있으니, 그냥 null로 처리
        return null;
    }
    if (!data || data.base_ppm == null)
        return null;
    const basePpm = Number(data.base_ppm);
    if (!Number.isFinite(basePpm) || basePpm <= 0)
        return null;
    return basePpm;
}
/**
 * user_profiles.base_ppm 갱신 (없으면 insert)
 */
async function updateUserBasePpm(userId, ppm) {
    if (!Number.isFinite(ppm) || ppm <= 0) {
        throw new Error('ppm must be a positive number');
    }
    const nowIso = new Date().toISOString();
    const { data: updated, error: updateError } = await db_1.supabase
        .from('user_profiles')
        .update({ base_ppm: ppm, updated_at: nowIso })
        .eq('user_id', userId)
        .select('user_id');
    if (updateError) {
        console.error('[updateUserBasePpm] update error', updateError.message, updateError.details);
        throw new Error('failed to update user base_ppm');
    }
    if (updated && updated.length > 0)
        return;
    const { error: insertError } = await db_1.supabase.from('user_profiles').insert({
        user_id: userId,
        base_ppm: ppm,
        updated_at: nowIso,
    });
    if (insertError) {
        console.error('[updateUserBasePpm] insert error', insertError.message, insertError.details);
        throw new Error('failed to insert user base_ppm');
    }
}
