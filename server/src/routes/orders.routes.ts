import { Router } from 'express';
import {
  getAllOrders,
  getOrderById,
  calculateOrder,
  applyDiscount,
  completeOrder,
} from '../controllers/orders.controller';

const router = Router();

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.post('/:id/calculate', calculateOrder);
router.post('/:id/apply-discount', applyDiscount);
router.post('/:id/complete', completeOrder);

export default router;
