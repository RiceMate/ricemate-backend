import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getRootCategories,
  getCategoryChildren,
  createCategory,
  updateCategory,
  checkExpenses,
  submitExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expense.controller';

const router = Router();

router.use(requireAuth);

// Categories
router.get('/categories', getRootCategories);
router.get('/categories/:id/children', getCategoryChildren);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);

// Expense instances
router.get('/check', checkExpenses); // ?date=YYYY-MM-DD
router.post('/', submitExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
