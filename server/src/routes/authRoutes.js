import { Router } from 'express'
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', protect, getMe)
router.patch('/me', protect, updateMe)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
