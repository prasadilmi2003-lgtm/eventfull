import mongoose from 'mongoose'
import Review from '../models/Review.js'
import Booking from '../models/Booking.js'
import Event from '../models/Event.js'

export const getEventReviews = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const reviews = await Review.find({ eventId: id })
      .populate('userId', 'name profileImage')
      .sort({ createdAt: -1 })

    const list = reviews.map((r) => ({
      _id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        _id: r.userId?._id?.toString() || '',
        name: r.userId?.name || 'Anonymous',
        profileImage: r.userId?.profileImage || '',
      },
    }))

    const averageRating =
      list.length > 0 ? (list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1) : 0

    return res.status(200).json({
      reviews: list,
      averageRating: Number(averageRating),
      totalReviews: list.length,
    })
  } catch (error) {
    next(error)
  }
}

export const addEventReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const { rating, comment = '' } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const event = await Event.findById(id)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const numRating = Number(rating)
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' })
    }

    // Verify user has booked this event
    const hasBooking = await Booking.findOne({
      eventId: event._id,
      attendeeId: req.user._id,
      status: 'confirmed',
    })

    if (!hasBooking && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only registered attendees can review this event.',
      })
    }

    const existingReview = await Review.findOne({
      eventId: event._id,
      userId: req.user._id,
    })

    if (existingReview) {
      existingReview.rating = numRating
      existingReview.comment = String(comment).trim()
      await existingReview.save()
      return res.status(200).json({
        message: 'Review updated successfully',
        review: existingReview,
      })
    }

    const review = await Review.create({
      eventId: event._id,
      userId: req.user._id,
      rating: numRating,
      comment: String(comment).trim(),
    })

    return res.status(201).json({
      message: 'Review added successfully',
      review,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const review = await Review.findById(id)
    if (!review) return res.status(404).json({ message: 'Review not found' })

    const isOwner = review.userId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own reviews' })
    }

    await Review.deleteOne({ _id: review._id })
    return res.status(200).json({ message: 'Review deleted successfully' })
  } catch (error) {
    next(error)
  }
}
