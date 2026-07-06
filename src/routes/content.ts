import { Router, Request, Response } from 'express';
import { authMiddleware, AuthedRequest } from '../middlewares/auth';
import { listNotices, getNoticeById } from '../repositories/admin/noticeRepository';
import { listBanners, getBannerById } from '../repositories/admin/bannerRepository';
import { listPicks, getPickById } from '../repositories/admin/pickRepository';
import {
  listDictionaryEntries,
  getDictionaryEntryById,
} from '../repositories/admin/dictionaryRepository';
import { listEvents, getEventById } from '../repositories/admin/eventRepository';
import { createReport } from '../repositories/admin/reportRepository';
import { createInquiry, listInquiries, getInquiryById } from '../repositories/admin/inquiryRepository';

const router = Router();

// --- 공개 콘텐츠 조회 ---

router.get('/notices', async (_req: Request, res: Response) => {
  try {
    const data = await listNotices(true);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/notices] list error', err);
    return res.status(500).json({ success: false, message: '공지 목록 조회 실패' });
  }
});

router.get('/notices/:id', async (req: Request, res: Response) => {
  try {
    const data = await getNoticeById(req.params.id);
    if (!data || !data.is_published) {
      return res.status(404).json({ success: false, message: '공지를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/notices] get error', err);
    return res.status(500).json({ success: false, message: '공지 조회 실패' });
  }
});

router.get('/banners', async (_req: Request, res: Response) => {
  try {
    const data = await listBanners(true);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/banners] list error', err);
    return res.status(500).json({ success: false, message: '배너 목록 조회 실패' });
  }
});

router.get('/banners/:id', async (req: Request, res: Response) => {
  try {
    const data = await getBannerById(req.params.id);
    if (!data || !data.is_active) {
      return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/banners] get error', err);
    return res.status(500).json({ success: false, message: '배너 조회 실패' });
  }
});

router.get('/picks', async (_req: Request, res: Response) => {
  try {
    const data = await listPicks(true);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/picks] list error', err);
    return res.status(500).json({ success: false, message: 'Pick 목록 조회 실패' });
  }
});

router.get('/picks/:id', async (req: Request, res: Response) => {
  try {
    const data = await getPickById(req.params.id);
    if (!data || !data.is_active) {
      return res.status(404).json({ success: false, message: 'Pick을 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/picks] get error', err);
    return res.status(500).json({ success: false, message: 'Pick 조회 실패' });
  }
});

router.get('/dictionary', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.q === 'string' ? req.query.q : undefined;
    const data = await listDictionaryEntries(true, search);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/dictionary] list error', err);
    return res.status(500).json({ success: false, message: '사전 목록 조회 실패' });
  }
});

router.get('/dictionary/:id', async (req: Request, res: Response) => {
  try {
    const data = await getDictionaryEntryById(req.params.id);
    if (!data || !data.is_published) {
      return res.status(404).json({ success: false, message: '사전 항목을 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/dictionary] get error', err);
    return res.status(500).json({ success: false, message: '사전 항목 조회 실패' });
  }
});

router.get('/events', async (_req: Request, res: Response) => {
  try {
    const data = await listEvents(true);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/events] list error', err);
    return res.status(500).json({ success: false, message: '이벤트 목록 조회 실패' });
  }
});

router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const data = await getEventById(req.params.id);
    if (!data || !data.is_active) {
      return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/events] get error', err);
    return res.status(500).json({ success: false, message: '이벤트 조회 실패' });
  }
});

// --- 사용자 신고/문의 (로그인 필요) ---

router.post('/reports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authedReq = req as AuthedRequest;
    const { target_type, target_id, reason, description } = req.body as {
      target_type?: string;
      target_id?: string;
      reason?: string;
      description?: string | null;
    };

    if (!target_type?.trim() || !target_id?.trim() || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'target_type, target_id, reason은 필수입니다.',
      });
    }

    const data = await createReport({
      reporter_user_id: authedReq.user!.id,
      target_type: target_type.trim(),
      target_id: target_id.trim(),
      reason: reason.trim(),
      description,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[content/reports] create error', err);
    return res.status(500).json({ success: false, message: '신고 접수 실패' });
  }
});

router.post('/inquiries', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authedReq = req as AuthedRequest;
    const { subject, content } = req.body as { subject?: string; content?: string };

    if (!subject?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'subject, content는 필수입니다.' });
    }

    const data = await createInquiry({
      user_id: authedReq.user!.id,
      subject: subject.trim(),
      content: content.trim(),
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[content/inquiries] create error', err);
    return res.status(500).json({ success: false, message: '문의 접수 실패' });
  }
});

router.get('/inquiries/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authedReq = req as AuthedRequest;
    const data = await listInquiries(undefined, authedReq.user!.id);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/inquiries/me] list error', err);
    return res.status(500).json({ success: false, message: '내 문의 목록 조회 실패' });
  }
});

router.get('/inquiries/me/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authedReq = req as AuthedRequest;
    const data = await getInquiryById(req.params.id);
    if (!data || data.user_id !== authedReq.user!.id) {
      return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[content/inquiries/me] get error', err);
    return res.status(500).json({ success: false, message: '문의 조회 실패' });
  }
});

export default router;
