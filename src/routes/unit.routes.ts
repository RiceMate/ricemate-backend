import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listUnitCategories,
  createUnitCategory,
  updateUnitCategory,
  deleteUnitCategory,
  listUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from '../controllers/unit.controller';

const router = Router();

router.use(requireAuth);

// Unit Categories
router.get('/categories', listUnitCategories);
router.post('/categories', createUnitCategory);
router.put('/categories/:id', updateUnitCategory);
router.delete('/categories/:id', deleteUnitCategory);

// Units
router.get('/', listUnits);
router.post('/', createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

export default router;
