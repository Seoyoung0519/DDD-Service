import { Router, Request, Response } from 'express';
import {
  listBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../../repositories/admin/bannerRepository';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await listBanners(false);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/banners] list error', err);
    return res.status(500).json({ success: false, message: '배너 목록 조회 실패' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await getBannerById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/banners] get error', err);
    return res.status(500).json({ success: false, message: '배너 조회 실패' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, image_url, link_url, sort_order, is_active, starts_at, ends_at } = req.body as {
      title?: string;
      image_url?: string;
      link_url?: string | null;
      sort_order?: number;
      is_active?: boolean;
      starts_at?: string | null;
      ends_at?: string | null;
    };

    if (!title?.trim() || !image_url?.trim()) {
      return res.status(400).json({ success: false, message: 'title, image_url은 필수입니다.' });
    }

    const data = await createBanner({
      title: title.trim(),
      image_url: image_url.trim(),
      link_url,
      sort_order,
      is_active,
      starts_at,
      ends_at,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[admin/banners] create error', err);
    return res.status(500).json({ success: false, message: '배너 생성 실패' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const data = await updateBanner(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[admin/banners] update error', err);
    return res.status(500).json({ success: false, message: '배너 수정 실패' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await getBannerById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
    }
    await deleteBanner(req.params.id);
    return res.json({ success: true, message: '삭제되었습니다.' });
  } catch (err) {
    console.error('[admin/banners] delete error', err);
    return res.status(500).json({ success: false, message: '배너 삭제 실패' });
  }
});

export default router;
