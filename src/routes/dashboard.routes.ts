import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getToday,
  getDaily,
  getMonthly,
  getYearly,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/today',   getToday);
router.get('/daily',   getDaily);    // ?date=YYYY-MM-DD  (defaults to today)
router.get('/monthly', getMonthly);  // ?year=YYYY&month=MM
router.get('/yearly',  getYearly);   // ?year=YYYY

export default router;
