"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pickRepository_1 = require("../../repositories/admin/pickRepository");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const data = await (0, pickRepository_1.listPicks)(false);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/picks] list error', err);
        return res.status(500).json({ success: false, message: 'Pick 목록 조회 실패' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const data = await (0, pickRepository_1.getPickById)(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Pick을 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/picks] get error', err);
        return res.status(500).json({ success: false, message: 'Pick 조회 실패' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { title, description, book_isbn, cover_image_url, sort_order, is_active } = req.body;
        if (!(title === null || title === void 0 ? void 0 : title.trim())) {
            return res.status(400).json({ success: false, message: 'title은 필수입니다.' });
        }
        const data = await (0, pickRepository_1.createPick)({
            title: title.trim(),
            description,
            book_isbn,
            cover_image_url,
            sort_order,
            is_active,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/picks] create error', err);
        return res.status(500).json({ success: false, message: 'Pick 생성 실패' });
    }
});
router.patch('/:id', async (req, res) => {
    try {
        const data = await (0, pickRepository_1.updatePick)(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Pick을 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/picks] update error', err);
        return res.status(500).json({ success: false, message: 'Pick 수정 실패' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const existing = await (0, pickRepository_1.getPickById)(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Pick을 찾을 수 없습니다.' });
        }
        await (0, pickRepository_1.deletePick)(req.params.id);
        return res.json({ success: true, message: '삭제되었습니다.' });
    }
    catch (err) {
        console.error('[admin/picks] delete error', err);
        return res.status(500).json({ success: false, message: 'Pick 삭제 실패' });
    }
});
exports.default = router;
