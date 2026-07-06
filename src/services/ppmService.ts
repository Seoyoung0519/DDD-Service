import { getUserBasePpm, updateUserBasePpm } from '../repositories/userRepository';

export const DEFAULT_PPM = 0.8;
export const PPM_EMA_ALPHA = 0.3;
export const PPM_MIN = 0.3;
export const PPM_MAX = 3.0;

export function clampPpm(ppm: number): number {
  return Math.max(PPM_MIN, Math.min(PPM_MAX, ppm));
}

/** actual_ppm = 실제 페이지 / 추천 시간(분) */
export function computeActualPpm(
  actualPages: number,
  recommendedMinutes: number,
): number | null {
  if (actualPages <= 0 || recommendedMinutes <= 0) return null;
  return actualPages / recommendedMinutes;
}

/** 이동평균(EMA): new_ppm = α × actual_ppm + (1-α) × old_ppm */
export function computeEmaPpm(
  oldPpm: number,
  actualPpm: number,
  alpha: number = PPM_EMA_ALPHA,
): number {
  return clampPpm(alpha * actualPpm + (1 - alpha) * oldPpm);
}

export interface PpmUpdateResult {
  oldPpm: number;
  actualPpm: number;
  newPpm: number;
}

/**
 * 세션 종료 시 actual_ppm 계산 → EMA로 base_ppm 갱신
 */
export async function updatePpmFromSession(
  userId: string,
  actualPages: number,
  recommendedMinutes: number,
): Promise<PpmUpdateResult | null> {
  const actualPpm = computeActualPpm(actualPages, recommendedMinutes);
  if (actualPpm == null) return null;

  const storedPpm = await getUserBasePpm(userId);
  const oldPpm = storedPpm ?? DEFAULT_PPM;
  const newPpm = computeEmaPpm(oldPpm, actualPpm);

  await updateUserBasePpm(userId, newPpm);

  console.log('[updatePpmFromSession]', {
    userId,
    actualPages,
    recommendedMinutes,
    actualPpm: Number(actualPpm.toFixed(4)),
    oldPpm: Number(oldPpm.toFixed(4)),
    newPpm: Number(newPpm.toFixed(4)),
  });

  return { oldPpm, actualPpm, newPpm };
}
