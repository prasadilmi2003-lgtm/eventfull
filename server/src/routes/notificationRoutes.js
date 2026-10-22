import { Router } from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getNotifications)
router.patch('/:id/read', markAsRead)
router.patch('/read-all', markAllAsRead)

export default router
