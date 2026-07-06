"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const auth_1 = require("./auth");
const authClient_1 = require("../clients/authClient");
/**
 * JWT 검증 후 관리자 권한 확인
 * 1) JWT payload role === "admin"
 * 2) auth 내부 API admin-status fallback
 */
const requireAdmin = (req, res, next) => {
    (0, auth_1.authMiddleware)(req, res, async (err) => {
        var _a, _b;
        if (err) {
            return next(err);
        }
        const authedReq = req;
        const userId = (_a = authedReq.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (((_b = authedReq.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin') {
            return next();
        }
        const admin = await (0, authClient_1.isUserAdmin)(userId);
        if (!admin) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: '관리자 권한이 필요합니다.',
            });
        }
        authedReq.user = { ...authedReq.user, role: 'admin' };
        return next();
    });
};
exports.requireAdmin = requireAdmin;
