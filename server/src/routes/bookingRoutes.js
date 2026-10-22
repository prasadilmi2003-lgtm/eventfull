import { Router } from 'express'
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from '../controllers/bookingController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.post('/', createBooking)
router.get('/my', getMyBookings)
router.get('/:id', getBookingById)
router.post('/:id/cancel', cancelBooking)

export default router
