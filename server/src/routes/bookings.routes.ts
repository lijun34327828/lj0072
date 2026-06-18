import { Router } from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
} from '../controllers/bookings.controller';

const router = Router();

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id/status', updateBookingStatus);

export default router;
