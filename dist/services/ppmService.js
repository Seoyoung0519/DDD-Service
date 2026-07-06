"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPM_MAX = exports.PPM_MIN = exports.PPM_EMA_ALPHA = exports.DEFAULT_PPM = void 0;
exports.clampPpm = clampPpm;
exports.computeActualPpm = computeActualPpm;
exports.computeEmaPpm = computeEmaPpm;
exports.updatePpmFromSession = updatePpmFromSession;
const userRepository_1 = require("../repositories/userRepository");
exports.DEFAULT_PPM = 0.8;
exports.PPM_EMA_ALPHA = 0.3;
exports.PPM_MIN = 0.3;
exports.PPM_MAX = 3.0;
function clampPpm(ppm) {
    return Math.max(exports.PPM_MIN, Math.min(exports.PPM_MAX, ppm));
}
/** actual_ppm = 실제 페이지 / 추천 시간(분) */
function computeActualPpm(actualPages, recommendedMinutes) {
    if (actualPages <= 0 || recommendedMinutes <= 0)
        return null;
    return actualPages / recommendedMinutes;
}
/** 이동평균(EMA): new_ppm = α × actual_ppm + (1-α) × old_ppm */
function computeEmaPpm(oldPpm, actualPpm, alpha = exports.PPM_EMA_ALPHA) {
    return clampPpm(alpha * actualPpm + (1 - alpha) * oldPpm);
}
/**
 * 세션 종료 시 actual_ppm 계산 → EMA로 base_ppm 갱신
 */
async function updatePpmFromSession(userId, actualPages, recommendedMinutes) {
    const actualPpm = computeActualPpm(actualPages, recommendedMinutes);
    if (actualPpm == null)
        return null;
    const storedPpm = await (0, userRepository_1.getUserBasePpm)(userId);
    const oldPpm = storedPpm !== null && storedPpm !== void 0 ? storedPpm : exports.DEFAULT_PPM;
    const newPpm = computeEmaPpm(oldPpm, actualPpm);
    await (0, userRepository_1.updateUserBasePpm)(userId, newPpm);
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
