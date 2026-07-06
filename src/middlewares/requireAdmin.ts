import { Response, NextFunction, RequestHandler } from 'express';
import { authMiddleware, AuthedRequest } from './auth';
import { isUserAdmin } from '../clients/authClient';

/**
 * JWT 검증 후 관리자 권한 확인
 * 1) JWT payload role === "admin"
 * 2) auth 내부 API admin-status fallback
 */
export const requireAdmin: RequestHandler = (
  req,
  res: Response,
  next: NextFunction,
) => {
  authMiddleware(req, res, async (err?: unknown) => {
    if (err) {
      return next(err);
    }

    const authedReq = req as AuthedRequest;
    const userId = authedReq.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (authedReq.user?.role === 'admin') {
      return next();
    }

    const admin = await isUserAdmin(userId);
    if (!admin) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: '관리자 권한이 필요합니다.',
      });
    }

    authedReq.user = { ...authedReq.user!, role: 'admin' };
    return next();
  });
};
