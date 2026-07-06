"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dictionaryRepository_1 = require("../../repositories/admin/dictionaryRepository");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const search = typeof req.query.q === 'string' ? req.query.q : undefined;
        const data = await (0, dictionaryRepository_1.listDictionaryEntries)(false, search);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/dictionary] list error', err);
        return res.status(500).json({ success: false, message: '사전 목록 조회 실패' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const data = await (0, dictionaryRepository_1.getDictionaryEntryById)(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/dictionary] get error', err);
        return res.status(500).json({ success: false, message: '사전 항목 조회 실패' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { term, definition, category, is_published } = req.body;
        if (!(term === null || term === void 0 ? void 0 : term.trim()) || !(definition === null || definition === void 0 ? void 0 : definition.trim())) {
            return res.status(400).json({ success: false, message: 'term, definition은 필수입니다.' });
        }
        const data = await (0, dictionaryRepository_1.createDictionaryEntry)({
            term: term.trim(),
            definition: definition.trim(),
            category,
            is_published,
        });
        return res.status(201).json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/dictionary] create error', err);
        return res.status(500).json({ success: false, message: '사전 항목 생성 실패' });
    }
});
router.patch('/:id', async (req, res) => {
    try {
        const data = await (0, dictionaryRepository_1.updateDictionaryEntry)(req.params.id, req.body);
        if (!data) {
            return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
        }
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('[admin/dictionary] update error', err);
        return res.status(500).json({ success: false, message: '사전 항목 수정 실패' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const existing = await (0, dictionaryRepository_1.getDictionaryEntryById)(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
        }
        await (0, dictionaryRepository_1.deleteDictionaryEntry)(req.params.id);
        return res.json({ success: true, message: '삭제되었습니다.' });
    }
    catch (err) {
        console.error('[admin/dictionary] delete error', err);
        return res.status(500).json({ success: false, message: '사전 항목 삭제 실패' });
    }
});
exports.default = router;
