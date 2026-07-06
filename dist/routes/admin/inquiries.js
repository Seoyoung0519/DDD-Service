"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inquiryRepository_1 = require("../../repositories/admin/inquiryRepository");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const data = await (0, inquiryRepository_1.listInquiries)(status);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/inquiries] list error', err);
        return res.status(500).json({ success: false, message: '문의 목록 조회 실패' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const data = await (0, inquiryRepository_1.getInquiryById)(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/inquiries] get error', err);
        return res.status(500).json({ success: false, message: '문의 조회 실패' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { user_id, subject, content } = req.body;
        if (!user_id || !(subject === null || subject === void 0 ? void 0 : subject.trim()) || !(content === null || content === void 0 ? void 0 : content.trim())) {
            return res.status(400).json({
                success: false,
                message: 'user_id, subject, content는 필수입니다.',
            });
        }
        const data = await (0, inquiryRepository_1.createInquiry)({
            user_id,
            subject: subject.trim(),
            content: content.trim(),
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/inquiries] create error', err);
        return res.status(500).json({ success: false, message: '문의 생성 실패' });
    }
});
router.patch('/:id', async (req, res) => {
    var _a, _b;
    try {
        const authedReq = req;
        const { status, admin_reply, subject, content } = req.body;
        const data = await (0, inquiryRepository_1.updateInquiry)(req.params.id, {
            status,
            admin_reply,
            subject,
            content,
            replied_by: admin_reply ? (_b = (_a = authedReq.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null : undefined,
        });
        if (!data) {
            return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/inquiries] update error', err);
        return res.status(500).json({ success: false, message: '문의 처리 실패' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const existing = await (0, inquiryRepository_1.getInquiryById)(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
        }
        await (0, inquiryRepository_1.deleteInquiry)(req.params.id);
        return res.json({ success: true, message: '삭제되었습니다.' });
    }
    catch (err) {
        console.error('[admin/inquiries] delete error', err);
        return res.status(500).json({ success: false, message: '문의 삭제 실패' });
    }
});
exports.default = router;
