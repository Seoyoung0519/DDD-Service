// src/repositories/userRepository.ts
import { supabase } from '../core/db';

/**
 * user_profiles.base_ppm 가져오기
 * - 없거나 0/음수면 null 리턴 (서비스에서 기본값으로 대체)
 */
export async function getUserBasePpm(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('user_profiles')        // 🔹 users → user_profiles 로 변경
    .select('base_ppm')
    .eq('user_id', userId)        // 🔹 컬럼이 user_id 라고 가정 (FK)
    .maybeSingle();

  if (error) {
    console.error('[getUserBasePpm] error', error.message, error.details, error.hint);
    // 프로필이 아직 없거나 컬럼이 없을 수도 있으니, 그냥 null로 처리
    return null;
  }

  if (!data || data.base_ppm == null) return null;

  const basePpm = Number(data.base_ppm);
  if (!Number.isFinite(basePpm) || basePpm <= 0) return null;

  return basePpm;
}

/**
 * user_profiles.base_ppm 갱신 (없으면 insert)
 */
export async function updateUserBasePpm(userId: string, ppm: number): Promise<void> {
  if (!Number.isFinite(ppm) || ppm <= 0) {
    throw new Error('ppm must be a positive number');
  }

  const nowIso = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('user_profiles')
    .update({ base_ppm: ppm, updated_at: nowIso })
    .eq('user_id', userId)
    .select('user_id');

  if (updateError) {
    console.error('[updateUserBasePpm] update error', updateError.message, updateError.details);
    throw new Error('failed to update user base_ppm');
  }

  if (updated && updated.length > 0) return;

  const { error: insertError } = await supabase.from('user_profiles').insert({
    user_id: userId,
    base_ppm: ppm,
    updated_at: nowIso,
  });

  if (insertError) {
    console.error('[updateUserBasePpm] insert error', insertError.message, insertError.details);
    throw new Error('failed to insert user base_ppm');
  }
}
