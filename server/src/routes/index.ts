import { Router } from 'express';
import servicesRoutes from './services.routes';
import techniciansRoutes from './technicians.routes';
import bookingsRoutes from './bookings.routes';
import ordersRoutes from './orders.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/services', servicesRoutes);
router.use('/technicians', techniciansRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/orders', ordersRoutes);
router.use('/settings', settingsRoutes);

export default router;
