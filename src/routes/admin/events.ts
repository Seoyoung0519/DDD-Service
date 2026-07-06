import { Router, Request, Response } from 'express';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../repositories/admin/eventRepository';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await listEvents(false);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/events] list error', err);
    return res.status(500).json({ success: false, message: '이벤트 목록 조회 실패' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await getEventById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/events] get error', err);
    return res.status(500).json({ success: false, message: '이벤트 조회 실패' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, image_url, link_url, starts_at, ends_at, is_active } = req.body as {
      title?: string;
      description?: string;
      image_url?: string | null;
      link_url?: string | null;
      starts_at?: string;
      ends_at?: string;
      is_active?: boolean;
    };

    if (!title?.trim() || !starts_at || !ends_at) {
      return res.status(400).json({
        success: false,
        message: 'title, starts_at, ends_at은 필수입니다.',
      });
    }

    const data = await createEvent({
      title: title.trim(),
      description,
      image_url,
      link_url,
      starts_at,
      ends_at,
      is_active,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[admin/events] create error', err);
    return res.status(500).json({ success: false, message: '이벤트 생성 실패' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const data = await updateEvent(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/events] update error', err);
    return res.status(500).json({ success: false, message: '이벤트 수정 실패' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await getEventById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
    }
    await deleteEvent(req.params.id);
    return res.json({ success: true, message: '삭제되었습니다.' });
  } catch (err) {
    console.error('[admin/events] delete error', err);
    return res.status(500).json({ success: false, message: '이벤트 삭제 실패' });
  }
});

export default router;
