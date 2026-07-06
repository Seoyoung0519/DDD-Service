import { Router, Request, Response } from 'express';
import {
  listDictionaryEntries,
  getDictionaryEntryById,
  createDictionaryEntry,
  updateDictionaryEntry,
  deleteDictionaryEntry,
} from '../../repositories/admin/dictionaryRepository';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.q === 'string' ? req.query.q : undefined;
    const data = await listDictionaryEntries(false, search);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/dictionary] list error', err);
    return res.status(500).json({ success: false, message: '사전 목록 조회 실패' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await getDictionaryEntryById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/dictionary] get error', err);
    return res.status(500).json({ success: false, message: '사전 항목 조회 실패' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { term, definition, category, is_published } = req.body as {
      term?: string;
      definition?: string;
      category?: string | null;
      is_published?: boolean;
    };

    if (!term?.trim() || !definition?.trim()) {
      return res.status(400).json({ success: false, message: 'term, definition은 필수입니다.' });
    }

    const data = await createDictionaryEntry({
      term: term.trim(),
      definition: definition.trim(),
      category,
      is_published,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[admin/dictionary] create error', err);
    return res.status(500).json({ success: false, message: '사전 항목 생성 실패' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const data = await updateDictionaryEntry(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/dictionary] update error', err);
    return res.status(500).json({ success: false, message: '사전 항목 수정 실패' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await getDictionaryEntryById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
    }
    await deleteDictionaryEntry(req.params.id);
    return res.json({ success: true, message: '삭제되었습니다.' });
  } catch (err) {
    console.error('[admin/dictionary] delete error', err);
    return res.status(500).json({ success: false, message: '사전 항목 삭제 실패' });
  }
});

export default router;
