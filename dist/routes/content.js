"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const noticeRepository_1 = require("../repositories/admin/noticeRepository");
const bannerRepository_1 = require("../repositories/admin/bannerRepository");
const pickRepository_1 = require("../repositories/admin/pickRepository");
const dictionaryRepository_1 = require("../repositories/admin/dictionaryRepository");
const eventRepository_1 = require("../repositories/admin/eventRepository");
const reportRepository_1 = require("../repositories/admin/reportRepository");
const inquiryRepository_1 = require("../repositories/admin/inquiryRepository");
const router = (0, express_1.Router)();
// --- 공개 콘텐츠 조회 ---
router.get('/notices', async (_req, res) => {
    try {
        const data = await (0, noticeRepository_1.listNotices)(true);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/notices] list error', err);
        return res.status(500).json({ success: false, message: '공지 목록 조회 실패' });
    }
});
router.get('/notices/:id', async (req, res) => {
    try {
        const data = await (0, noticeRepository_1.getNoticeById)(req.params.id);
        if (!data || !data.is_published) {
            return res.status(404).json({ success: false, message: '공지를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/notices] get error', err);
        return res.status(500).json({ success: false, message: '공지 조회 실패' });
    }
});
router.get('/banners', async (_req, res) => {
    try {
        const data = await (0, bannerRepository_1.listBanners)(true);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/banners] list error', err);
        return res.status(500).json({ success: false, message: '배너 목록 조회 실패' });
    }
});
router.get('/banners/:id', async (req, res) => {
    try {
        const data = await (0, bannerRepository_1.getBannerById)(req.params.id);
        if (!data || !data.is_active) {
            return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/banners] get error', err);
        return res.status(500).json({ success: false, message: '배너 조회 실패' });
    }
});
router.get('/picks', async (_req, res) => {
    try {
        const data = await (0, pickRepository_1.listPicks)(true);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/picks] list error', err);
        return res.status(500).json({ success: false, message: 'Pick 목록 조회 실패' });
    }
});
router.get('/picks/:id', async (req, res) => {
    try {
        const data = await (0, pickRepository_1.getPickById)(req.params.id);
        if (!data || !data.is_active) {
            return res.status(404).json({ success: false, message: 'Pick을 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/picks] get error', err);
        return res.status(500).json({ success: false, message: 'Pick 조회 실패' });
    }
});
router.get('/dictionary', async (req, res) => {
    try {
        const search = typeof req.query.q === 'string' ? req.query.q : undefined;
        const data = await (0, dictionaryRepository_1.listDictionaryEntries)(true, search);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/dictionary] list error', err);
        return res.status(500).json({ success: false, message: '사전 목록 조회 실패' });
    }
});
router.get('/dictionary/:id', async (req, res) => {
    try {
        const data = await (0, dictionaryRepository_1.getDictionaryEntryById)(req.params.id);
        if (!data || !data.is_published) {
            return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/dictionary] get error', err);
        return res.status(500).json({ success: false, message: '사전 항목 조회 실패' });
    }
});
router.get('/events', async (_req, res) => {
    try {
        const data = await (0, eventRepository_1.listEvents)(true);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/events] list error', err);
        return res.status(500).json({ success: false, message: '이벤트 목록 조회 실패' });
    }
});
router.get('/events/:id', async (req, res) => {
    try {
        const data = await (0, eventRepository_1.getEventById)(req.params.id);
        if (!data || !data.is_active) {
            return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/events] get error', err);
        return res.status(500).json({ success: false, message: '이벤트 조회 실패' });
    }
});
// --- 사용자 신고/문의 (로그인 필요) ---
router.post('/reports', auth_1.authMiddleware, async (req, res) => {
    try {
        const authedReq = req;
        const { target_type, target_id, reason, description } = req.body;
        if (!(target_type === null || target_type === void 0 ? void 0 : target_type.trim()) || !(target_id === null || target_id === void 0 ? void 0 : target_id.trim()) || !(reason === null || reason === void 0 ? void 0 : reason.trim())) {
            return res.status(400).json({
                success: false,
                message: 'target_type, target_id, reason은 필수입니다.',
            });
        }
        const data = await (0, reportRepository_1.createReport)({
            reporter_user_id: authedReq.user.id,
            target_type: target_type.trim(),
            target_id: target_id.trim(),
            reason: reason.trim(),
            description,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[content/reports] create error', err);
        return res.status(500).json({ success: false, message: '신고 접수 실패' });
    }
});
router.post('/inquiries', auth_1.authMiddleware, async (req, res) => {
    try {
        const authedReq = req;
        const { subject, content } = req.body;
        if (!(subject === null || subject === void 0 ? void 0 : subject.trim()) || !(content === null || content === void 0 ? void 0 : content.trim())) {
            return res.status(400).json({ success: false, message: 'subject, content는 필수입니다.' });
        }
        const data = await (0, inquiryRepository_1.createInquiry)({
            user_id: authedReq.user.id,
            subject: subject.trim(),
            content: content.trim(),
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[content/inquiries] create error', err);
        return res.status(500).json({ success: false, message: '문의 접수 실패' });
    }
});
router.get('/inquiries/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const authedReq = req;
        const data = await (0, inquiryRepository_1.listInquiries)(undefined, authedReq.user.id);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/inquiries/me] list error', err);
        return res.status(500).json({ success: false, message: '내 문의 목록 조회 실패' });
    }
});
router.get('/inquiries/me/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const authedReq = req;
        const data = await (0, inquiryRepository_1.getInquiryById)(req.params.id);
        if (!data || data.user_id !== authedReq.user.id) {
            return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[content/inquiries/me] get error', err);
        return res.status(500).json({ success: false, message: '문의 조회 실패' });
    }
});
exports.default = router;
