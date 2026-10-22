import Event from '../models/Event.js'
import { presentEvent } from '../utils/presenters.js'

export const getFavorites = async (req, res, next) => {
  try {
    const favoriteIds = req.user.favorites || []
    const events = await Event.find({
      _id: { $in: favoriteIds },
      status: 'published',
    }).populate('organizerId', 'name')

    return res.status(200).json(events.map((e) => presentEvent(e)))
  } catch (error) {
    next(error)
  }
}

export const toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const eventIdStr = event._id.toString()
    let favorites = (req.user.favorites || []).map((f) => f.toString())

    if (favorites.includes(eventIdStr)) {
      favorites = favorites.filter((f) => f !== eventIdStr)
    } else {
      favorites.push(eventIdStr)
    }

    req.user.favorites = favorites
    await req.user.save()

    return res.status(200).json({ favorites })
  } catch (error) {
    next(error)
  }
}
