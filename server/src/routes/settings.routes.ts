import { Router } from 'express';
import {
  getAllSettings,
  updateSettings,
  getWorkloadLimit,
  updateWorkloadLimit,
} from '../controllers/settings.controller';

const router = Router();

router.get('/', getAllSettings);
router.put('/', updateSettings);
router.get('/workload-limit', getWorkloadLimit);
router.put('/workload-limit', updateWorkloadLimit);

export default router;
