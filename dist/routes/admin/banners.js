"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bannerRepository_1 = require("../../repositories/admin/bannerRepository");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const data = await (0, bannerRepository_1.listBanners)(false);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/banners] list error', err);
        return res.status(500).json({ success: false, message: '배너 목록 조회 실패' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const data = await (0, bannerRepository_1.getBannerById)(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/banners] get error', err);
        return res.status(500).json({ success: false, message: '배너 조회 실패' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { title, image_url, link_url, sort_order, is_active, starts_at, ends_at } = req.body;
        if (!(title === null || title === void 0 ? void 0 : title.trim()) || !(image_url === null || image_url === void 0 ? void 0 : image_url.trim())) {
            return res.status(400).json({ success: false, message: 'title, image_url은 필수입니다.' });
        }
        const data = await (0, bannerRepository_1.createBanner)({
            title: title.trim(),
            image_url: image_url.trim(),
            link_url,
            sort_order,
            is_active,
            starts_at,
            ends_at,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/banners] create error', err);
        return res.status(500).json({ success: false, message: '배너 생성 실패' });
    }
});
router.patch('/:id', async (req, res) => {
    try {
        const data = await (0, bannerRepository_1.updateBanner)(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/banners] update error', err);
        return res.status(500).json({ success: false, message: '배너 수정 실패' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const existing = await (0, bannerRepository_1.getBannerById)(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
        }
        await (0, bannerRepository_1.deleteBanner)(req.params.id);
        return res.json({ success: true, message: '삭제되었습니다.' });
    }
    catch (err) {
        console.error('[admin/banners] delete error', err);
        return res.status(500).json({ success: false, message: '배너 삭제 실패' });
    }
});
exports.default = router;
