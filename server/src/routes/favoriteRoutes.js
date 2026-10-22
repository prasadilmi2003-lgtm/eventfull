import { Router } from 'express'
import { getFavorites, toggleFavorite } from '../controllers/favoriteController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.use(protect)

router.get('/', getFavorites)
router.post('/:id', toggleFavorite)

export default router
