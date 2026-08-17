import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listIncomeSources,
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
  checkIncome,
  submitIncome,
  overrideIncome,
} from '../controllers/income.controller';

const router = Router();

// All income routes require auth (system user stub)
router.use(requireAuth);

// Income Sources
router.get('/sources', listIncomeSources);
router.post('/sources', createIncomeSource);
router.put('/sources/:id', updateIncomeSource);
router.delete('/sources/:id', deleteIncomeSource);

// Income Instances
router.get('/check', checkIncome);         // ?date=YYYY-MM-DD
router.post('/', submitIncome);
router.put('/date/:date', overrideIncome);

export default router;
