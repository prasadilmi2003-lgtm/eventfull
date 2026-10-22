import { Router } from 'express'
import {
  getMyTickets,
  checkInTicket,
} from '../controllers/bookingController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/my', protect, getMyTickets)
router.post('/check-in', protect, authorize('organizer', 'admin'), checkInTicket)

export default router
