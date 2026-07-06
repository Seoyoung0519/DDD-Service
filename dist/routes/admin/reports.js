"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportRepository_1 = require("../../repositories/admin/reportRepository");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const data = await (0, reportRepository_1.listReports)(status);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/reports] list error', err);
        return res.status(500).json({ success: false, message: '신고 목록 조회 실패' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const data = await (0, reportRepository_1.getReportById)(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: '신고를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/reports] get error', err);
        return res.status(500).json({ success: false, message: '신고 조회 실패' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { reporter_user_id, target_type, target_id, reason, description } = req.body;
        if (!reporter_user_id || !(target_type === null || target_type === void 0 ? void 0 : target_type.trim()) || !(target_id === null || target_id === void 0 ? void 0 : target_id.trim()) || !(reason === null || reason === void 0 ? void 0 : reason.trim())) {
            return res.status(400).json({
                success: false,
                message: 'reporter_user_id, target_type, target_id, reason은 필수입니다.',
            });
        }
        const data = await (0, reportRepository_1.createReport)({
            reporter_user_id,
            target_type: target_type.trim(),
            target_id: target_id.trim(),
            reason: reason.trim(),
            description,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/reports] create error', err);
        return res.status(500).json({ success: false, message: '신고 생성 실패' });
    }
});
router.patch('/:id', async (req, res) => {
    var _a, _b;
    try {
        const authedReq = req;
        const { status, admin_note } = req.body;
        const data = await (0, reportRepository_1.updateReport)(req.params.id, {
            status,
            admin_note,
            resolved_by: (_b = (_a = authedReq.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
        });
        if (!data) {
            return res.status(404).json({ success: false, message: '신고를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/reports] update error', err);
        return res.status(500).json({ success: false, message: '신고 처리 실패' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const existing = await (0, reportRepository_1.getReportById)(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '신고를 찾을 수 없습니다.' });
        }
        await (0, reportRepository_1.deleteReport)(req.params.id);
        return res.json({ success: true, message: '삭제되었습니다.' });
    }
    catch (err) {
        console.error('[admin/reports] delete error', err);
        return res.status(500).json({ success: false, message: '신고 삭제 실패' });
    }
});
exports.default = router;
