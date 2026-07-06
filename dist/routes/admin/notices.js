"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const noticeRepository_1 = require("../../repositories/admin/noticeRepository");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const data = await (0, noticeRepository_1.listNotices)(false);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/notices] list error', err);
        return res.status(500).json({ success: false, message: '공지 목록 조회 실패' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const data = await (0, noticeRepository_1.getNoticeById)(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: '공지를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/notices] get error', err);
        return res.status(500).json({ success: false, message: '공지 조회 실패' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { title, content, is_published, published_at } = req.body;
        if (!(title === null || title === void 0 ? void 0 : title.trim())) {
            return res.status(400).json({ success: false, message: 'title은 필수입니다.' });
        }
        const data = await (0, noticeRepository_1.createNotice)({
            title: title.trim(),
            content,
            is_published,
            published_at,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/notices] create error', err);
        return res.status(500).json({ success: false, message: '공지 생성 실패' });
    }
});
router.patch('/:id', async (req, res) => {
    try {
        const data = await (0, noticeRepository_1.updateNotice)(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ success: false, message: '공지를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/notices] update error', err);
        return res.status(500).json({ success: false, message: '공지 수정 실패' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const existing = await (0, noticeRepository_1.getNoticeById)(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '공지를 찾을 수 없습니다.' });
        }
        await (0, noticeRepository_1.deleteNotice)(req.params.id);
        return res.json({ success: true, message: '삭제되었습니다.' });
    }
    catch (err) {
        console.error('[admin/notices] delete error', err);
        return res.status(500).json({ success: false, message: '공지 삭제 실패' });
    }
});
exports.default = router;
