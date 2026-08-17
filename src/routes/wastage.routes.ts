import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  checkWastage,
  submitWastage,
  overrideWastage,
  getWastageHistory,
} from '../controllers/wastage.controller';

const router = Router();

// All wastage routes require auth
router.use(requireAuth);

router.get('/check', checkWastage);         // ?date=YYYY-MM-DD
router.get('/history', getWastageHistory);
router.post('/', submitWastage);
router.put('/date/:date', overrideWastage);

export default router;
