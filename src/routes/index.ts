import { Router } from 'express';
import incomeRouter    from './income.routes';
import expenseRouter   from './expense.routes';
import dashboardRouter from './dashboard.routes';
import unitRouter      from './unit.routes';

const router = Router();

router.use('/income',    incomeRouter);
router.use('/expenses',  expenseRouter);
router.use('/dashboard', dashboardRouter);
router.use('/units',     unitRouter);

export default router;
