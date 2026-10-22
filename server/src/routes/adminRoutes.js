import { Router } from 'express'
import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  getAdminEvents,
  reviewEvent,
  getAdminReports,
} from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect, authorize('admin'))

router.get('/dashboard', getAdminDashboard)
router.get('/users', getAdminUsers)
router.patch('/users/:id/status', updateUserStatus)
router.get('/events', getAdminEvents)
router.patch('/events/:id/review', reviewEvent)
router.get('/reports', getAdminReports)

export default router
