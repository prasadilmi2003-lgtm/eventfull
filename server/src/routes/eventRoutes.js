import { Router } from 'express'
import {
  getFeaturedEvents,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
} from '../controllers/eventController.js'
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/featured', getFeaturedEvents)
router.get('/', getEvents)
router.get('/:id', optionalAuth, getEventById)

router.post('/', protect, authorize('organizer', 'admin'), createEvent)
router.patch('/:id', protect, authorize('organizer', 'admin'), updateEvent)
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent)
router.post('/:id/publish', protect, authorize('organizer', 'admin'), publishEvent)
router.post('/:id/cancel', protect, authorize('organizer', 'admin'), cancelEvent)

export default router
