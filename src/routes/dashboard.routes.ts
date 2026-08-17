import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getToday,
  getDaily,
  getMonthly,
  getYearly,
  getIncomeSources,
  getExpenseBreakdown,
  getWastageVsSales,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/today',             getToday);
router.get('/daily',             getDaily);             // ?date=YYYY-MM-DD  (defaults to today)
router.get('/monthly',           getMonthly);           // ?year=YYYY&month=MM
router.get('/yearly',            getYearly);            // ?year=YYYY
router.get('/income-sources',    getIncomeSources);     // ?date=YYYY-MM-DD OR ?year=YYYY&month=MM OR ?year=YYYY
router.get('/expense-breakdown', getExpenseBreakdown);   // ?date=YYYY-MM-DD OR ?year=YYYY&month=MM OR ?year=YYYY
router.get('/wastage-vs-sales',  getWastageVsSales);    // ?date=YYYY-MM-DD OR ?year=YYYY&month=MM OR ?year=YYYY

export default router;
