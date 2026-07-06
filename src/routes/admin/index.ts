import { Router } from 'express';
import { requireAdmin } from '../../middlewares/requireAdmin';
import noticesRouter from './notices';
import bannersRouter from './banners';
import picksRouter from './picks';
import dictionaryRouter from './dictionary';
import eventsRouter from './events';
import reportsRouter from './reports';
import inquiriesRouter from './inquiries';

const router = Router();

router.use(requireAdmin);

router.use('/notices', noticesRouter);
router.use('/banners', bannersRouter);
router.use('/picks', picksRouter);
router.use('/dictionary', dictionaryRouter);
router.use('/events', eventsRouter);
router.use('/reports', reportsRouter);
router.use('/inquiries', inquiriesRouter);

export default router;
