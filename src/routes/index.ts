import { Router } from 'express';
import incomeRouter    from './income.routes';
import expenseRouter   from './expense.routes';
import dashboardRouter from './dashboard.routes';

const router = Router();

router.use('/income',    incomeRouter);
router.use('/expenses',  expenseRouter);
router.use('/dashboard', dashboardRouter);

export default router;
