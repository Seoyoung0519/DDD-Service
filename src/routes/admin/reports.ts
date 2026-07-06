import { Router, Request, Response } from 'express';
import { AuthedRequest } from '../../middlewares/auth';
import {
  listReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} from '../../repositories/admin/reportRepository';
import { ReportStatus } from '../../types/admin';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? (req.query.status as ReportStatus) : undefined;
    const data = await listReports(status);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/reports] list error', err);
    return res.status(500).json({ success: false, message: '신고 목록 조회 실패' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await getReportById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: '신고를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/reports] get error', err);
    return res.status(500).json({ success: false, message: '신고 조회 실패' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { reporter_user_id, target_type, target_id, reason, description } = req.body as {
      reporter_user_id?: string;
      target_type?: string;
      target_id?: string;
      reason?: string;
      description?: string | null;
    };

    if (!reporter_user_id || !target_type?.trim() || !target_id?.trim() || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'reporter_user_id, target_type, target_id, reason은 필수입니다.',
      });
    }

    const data = await createReport({
      reporter_user_id,
      target_type: target_type.trim(),
      target_id: target_id.trim(),
      reason: reason.trim(),
      description,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[admin/reports] create error', err);
    return res.status(500).json({ success: false, message: '신고 생성 실패' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const authedReq = req as AuthedRequest;
    const { status, admin_note } = req.body as {
      status?: ReportStatus;
      admin_note?: string | null;
    };

    const data = await updateReport(req.params.id, {
      status,
      admin_note,
      resolved_by: authedReq.user?.id ?? null,
    });

    if (!data) {
      return res.status(404).json({ success: false, message: '신고를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/reports] update error', err);
    return res.status(500).json({ success: false, message: '신고 처리 실패' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await getReportById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '신고를 찾을 수 없습니다.' });
    }
    await deleteReport(req.params.id);
    return res.json({ success: true, message: '삭제되었습니다.' });
  } catch (err) {
    console.error('[admin/reports] delete error', err);
    return res.status(500).json({ success: false, message: '신고 삭제 실패' });
  }
});

export default router;
