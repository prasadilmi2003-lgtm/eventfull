import { Router } from 'express'
import {
  getOrganizerEvents,
  getOrganizerDashboard,
  getEventAttendees,
  getEventAnalytics,
} from '../controllers/organizerController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect, authorize('organizer', 'admin'))

router.get('/events', getOrganizerEvents)
router.get('/dashboard', getOrganizerDashboard)
router.get('/events/:id/attendees', getEventAttendees)
router.get('/events/:id/analytics', getEventAnalytics)

export default router
