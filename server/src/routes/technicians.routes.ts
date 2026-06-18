import { Router } from 'express';
import {
  getAllTechnicians,
  getTechnicianById,
  getTechnicianWorkload,
  getTechnicianAvailableSlots,
  createTechnician,
  updateTechnician,
} from '../controllers/technicians.controller';

const router = Router();

router.get('/', getAllTechnicians);
router.get('/:id', getTechnicianById);
router.get('/:id/workload', getTechnicianWorkload);
router.get('/:id/available-slots', getTechnicianAvailableSlots);
router.post('/', createTechnician);
router.put('/:id', updateTechnician);

export default router;
