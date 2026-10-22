import { Router } from 'express'
import {
  getEventReviews,
  addEventReview,
  deleteReview,
} from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router({ mergeParams: true })

router.get('/', getEventReviews)
router.post('/', protect, addEventReview)
router.delete('/:id', protect, deleteReview)

export default router
