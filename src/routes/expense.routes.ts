import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getRootCategories,
  getCategoryChildren,
  checkExpenses,
  submitExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expense.controller';

const router = Router();

router.use(requireAuth);

// Categories (no auth needed conceptually, but kept consistent)
router.get('/categories',              getRootCategories);
router.get('/categories/:id/children', getCategoryChildren);

// Expense instances
router.get('/check',   checkExpenses);    // ?date=YYYY-MM-DD
router.post('/',       submitExpense);
router.put('/:id',     updateExpense);
router.delete('/:id',  deleteExpense);

export default router;
