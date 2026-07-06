import { Router, Request, Response } from 'express';
import { AuthedRequest } from '../../middlewares/auth';
import {
  listInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
} from '../../repositories/admin/inquiryRepository';
import { InquiryStatus } from '../../types/admin';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? (req.query.status as InquiryStatus) : undefined;
    const data = await listInquiries(status);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/inquiries] list error', err);
    return res.status(500).json({ success: false, message: '문의 목록 조회 실패' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await getInquiryById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/inquiries] get error', err);
    return res.status(500).json({ success: false, message: '문의 조회 실패' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, subject, content } = req.body as {
      user_id?: string;
      subject?: string;
      content?: string;
    };

    if (!user_id || !subject?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'user_id, subject, content는 필수입니다.',
      });
    }

    const data = await createInquiry({
      user_id,
      subject: subject.trim(),
      content: content.trim(),
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[admin/inquiries] create error', err);
    return res.status(500).json({ success: false, message: '문의 생성 실패' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const authedReq = req as AuthedRequest;
    const { status, admin_reply, subject, content } = req.body as {
      status?: InquiryStatus;
      admin_reply?: string | null;
      subject?: string;
      content?: string;
    };

    const data = await updateInquiry(req.params.id, {
      status,
      admin_reply,
      subject,
      content,
      replied_by: admin_reply ? authedReq.user?.id ?? null : undefined,
    });

    if (!data) {
      return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/inquiries] update error', err);
    return res.status(500).json({ success: false, message: '문의 처리 실패' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await getInquiryById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '문의를 찾을 수 없습니다.' });
    }
    await deleteInquiry(req.params.id);
    return res.json({ success: true, message: '삭제되었습니다.' });
  } catch (err) {
    console.error('[admin/inquiries] delete error', err);
    return res.status(500).json({ success: false, message: '문의 삭제 실패' });
  }
});

export default router;
