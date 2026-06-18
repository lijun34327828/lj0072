import { Router } from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
} from '../controllers/bookings.controller';

const router = Router();

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id/status', updateBookingStatus);
router.post('/:id/cancel', cancelBooking);
router.post('/:id/reschedule', rescheduleBooking);

export default router;
