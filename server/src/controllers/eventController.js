import mongoose from 'mongoose'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import Ticket from '../models/Ticket.js'
import User from '../models/User.js'
import { presentEvent } from '../utils/presenters.js'

const VALID_CATEGORIES = ['music', 'tech', 'food', 'sports', 'arts', 'business', 'education', 'charity']

const validateEventInput = (body) => {
  const errors = {}
  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  const category = String(body.category || '').trim()
  const venue = String(body.venue || '').trim()
  const city = String(body.city || '').trim()
  const capacity = Number(body.capacity)
  const startDate = body.startDate ? new Date(body.startDate) : null
  const endDate = body.endDate ? new Date(body.endDate) : null

  if (title.length < 3) errors.title = 'Title must be at least 3 characters'
  if (!VALID_CATEGORIES.includes(category)) errors.category = 'Choose a valid category'
  if (description.length < 20) errors.description = 'Description must be at least 20 characters'
  if (!venue) errors.venue = 'Venue is required'
  if (!city) errors.city = 'City is required'
  if (!body.startDate || isNaN(startDate?.getTime())) errors.startDate = 'Start date is required'
  if (!body.endDate || isNaN(endDate?.getTime())) errors.endDate = 'End date is required'
  if (startDate && endDate && endDate <= startDate) errors.endDate = 'End date must be after start date'
  if (!Number.isInteger(capacity) || capacity < 1) errors.capacity = 'Capacity must be at least 1'

  if (body.bannerImage && typeof body.bannerImage === 'string' && body.bannerImage.trim()) {
    try {
      const url = new URL(body.bannerImage.trim())
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.bannerImage = 'Enter a valid image URL'
      }
    } catch {
      errors.bannerImage = 'Enter a valid image URL'
    }
  }

  const ticketTypes = Array.isArray(body.ticketTypes) ? body.ticketTypes : []
  if (!ticketTypes.length) {
    errors.ticketTypes = 'Add at least one ticket type'
  } else {
    let totalQty = 0
    ticketTypes.forEach((t, i) => {
      const name = String(t.name || '').trim()
      const price = Number(t.price)
      const qty = Number(t.quantity)
      if (!name) errors[`tickets.${i}.name`] = 'Name is required'
      if (isNaN(price) || price < 0) errors[`tickets.${i}.price`] = 'Price cannot be negative'
      if (!Number.isInteger(qty) || qty < 1) errors[`tickets.${i}.quantity`] = 'Quantity must be at least 1'
      totalQty += qty
    })

    if (capacity && totalQty > capacity) {
      errors.ticketsSummary = `Total ticket quantity (${totalQty}) cannot exceed event capacity (${capacity})`
    }
  }

  return errors
}

export const getFeaturedEvents = async (req, res, next) => {
  try {
    const now = new Date()
    const filter = { status: 'published', endDate: { $gte: now } }

    let events = await Event.find({ ...filter, featured: true })
      .populate('organizerId', 'name')
      .sort({ startDate: 1 })
      .limit(6)

    if (events.length === 0) {
      events = await Event.find(filter)
        .populate('organizerId', 'name')
        .sort({ startDate: 1 })
        .limit(6)
    }

    return res.status(200).json(events.map((e) => presentEvent(e)))
  } catch (error) {
    next(error)
  }
}

export const getEvents = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      city = '',
      date = '',
      price = '',
      sort = 'date',
      page = 1,
      limit = 9,
    } = req.query

    const now = new Date()
    const query = { status: 'published', endDate: { $gte: now } }

    if (category && VALID_CATEGORIES.includes(category)) {
      query.category = category
    }

    if (city) {
      const cityRegex = new RegExp(city.trim(), 'i')
      query.$or = [{ city: cityRegex }, { venue: cityRegex }]
    }

    if (search) {
      const sRegex = new RegExp(search.trim(), 'i')
      const searchConditions = [{ title: sRegex }, { description: sRegex }, { venue: sRegex }, { city: sRegex }]
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }]
        delete query.$or
      } else {
        query.$or = searchConditions
      }
    }

    if (date) {
      const from = new Date(`${date}T00:00:00.000Z`)
      const to = new Date(`${date}T23:59:59.999Z`)
      query.startDate = { $lte: to }
      query.endDate = { $gte: from }
    }

    let events = await Event.find(query)
      .populate('organizerId', 'name')
      .lean()

    let items = events.map((e) => presentEvent(e))

    if (price === 'free') items = items.filter((e) => e.isFree)
    if (price === 'paid') items = items.filter((e) => !e.isFree)

    const sorters = {
      date: (a, b) => new Date(a.startDate) - new Date(b.startDate),
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      price_asc: (a, b) => a.minPrice - b.minPrice,
      price_desc: (a, b) => b.minPrice - a.minPrice,
    }
    items.sort(sorters[sort] || sorters.date)

    const lim = Math.min(Math.max(Number(limit) || 9, 1), 50)
    const total = items.length
    const pages = Math.max(Math.ceil(total / lim), 1)
    const p = Math.min(Math.max(Number(page) || 1, 1), pages)
    const paginated = items.slice((p - 1) * lim, p * lim)

    return res.status(200).json({
      data: paginated,
      page: p,
      pages,
      total,
    })
  } catch (error) {
    next(error)
  }
}

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const event = await Event.findById(id).populate('organizerId', 'name')
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const user = req.user
    const isOwner = user && event.organizerId && (event.organizerId._id.toString() === user._id.toString())
    const isAdmin = user && user.role === 'admin'
    const isPubliclyVisible = event.status === 'published' || event.status === 'cancelled'

    if (!isPubliclyVisible && !isOwner && !isAdmin) {
      return res.status(404).json({ message: 'Event not found' })
    }

    return res.status(200).json(presentEvent(event))
  } catch (error) {
    next(error)
  }
}

export const createEvent = async (req, res, next) => {
  try {
    const errors = validateEventInput(req.body)
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      })
    }

    const b = req.body
    const ticketTypes = (b.ticketTypes || []).map((t) => ({
      _id: new mongoose.Types.ObjectId(),
      name: t.name.trim(),
      description: (t.description || '').trim(),
      price: Number(t.price),
      quantity: Number(t.quantity),
      sold: 0,
      salesStart: t.salesStart ? new Date(t.salesStart) : null,
      salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
    }))

    const event = await Event.create({
      title: b.title.trim(),
      description: b.description.trim(),
      category: b.category,
      bannerImage: (b.bannerImage || '').trim(),
      venue: b.venue.trim(),
      address: (b.address || '').trim(),
      city: b.city.trim(),
      country: (b.country || 'Sri Lanka').trim(),
      startDate: new Date(b.startDate),
      endDate: new Date(b.endDate),
      capacity: Number(b.capacity),
      status: 'draft',
      rejectionReason: '',
      featured: false,
      organizerId: req.user._id,
      ticketTypes,
    })

    const populated = await Event.findById(event._id).populate('organizerId', 'name')
    return res.status(201).json(presentEvent(populated))
  } catch (error) {
    next(error)
  }
}

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const event = await Event.findById(id).populate('organizerId', 'name')
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const isOwner = event.organizerId && event.organizerId._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage your own events' })
    }

    if (event.status === 'cancelled') {
      return res.status(409).json({ message: 'A cancelled event cannot be edited' })
    }

    const errors = validateEventInput(req.body)

    // Check ticket quantity constraints against sold counts
    const incomingTypes = Array.isArray(req.body.ticketTypes) ? req.body.ticketTypes : []
    const updatedTypes = incomingTypes.map((t) => {
      const old = event.ticketTypes.find((x) => x._id.toString() === String(t._id))
      const quantity = Number(t.quantity)
      if (old && quantity < old.sold) {
        errors.ticketsSummary = `${old.name}: ${old.sold} already sold, quantity cannot go below that`
      }
      return {
        _id: old ? old._id : new mongoose.Types.ObjectId(),
        name: t.name.trim(),
        description: (t.description || '').trim(),
        price: Number(t.price),
        quantity,
        sold: old ? old.sold : 0,
        salesStart: t.salesStart ? new Date(t.salesStart) : null,
        salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
      }
    })

    // Check if any removed ticket type had sales
    const removedTypeWithSales = event.ticketTypes.find(
      (o) => o.sold > 0 && !updatedTypes.some((r) => r._id.toString() === o._id.toString()),
    )
    if (removedTypeWithSales) {
      errors.ticketsSummary = `${removedTypeWithSales.name} has sales and cannot be removed`
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      })
    }

    const b = req.body
    event.title = b.title.trim()
    event.description = b.description.trim()
    event.category = b.category
    event.bannerImage = (b.bannerImage || '').trim()
    event.venue = b.venue.trim()
    event.address = (b.address || '').trim()
    event.city = b.city.trim()
    event.country = (b.country || 'Sri Lanka').trim()
    event.startDate = new Date(b.startDate)
    event.endDate = new Date(b.endDate)
    event.capacity = Number(b.capacity)
    event.ticketTypes = updatedTypes

    await event.save()
    return res.status(200).json(presentEvent(event))
  } catch (error) {
    next(error)
  }
}

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const event = await Event.findById(id)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const isOwner = event.organizerId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage your own events' })
    }

    const confirmedCount = await Booking.countDocuments({ eventId: event._id, status: 'confirmed' })
    if (confirmedCount > 0) {
      return res.status(409).json({ message: 'This event has bookings. Cancel the event instead of deleting it.' })
    }

    await Event.deleteOne({ _id: event._id })
    await Booking.deleteMany({ eventId: event._id })
    await Ticket.deleteMany({ eventId: event._id })
    await User.updateMany({ favorites: event._id.toString() }, { $pull: { favorites: event._id.toString() } })

    return res.status(200).json({ message: 'Event deleted' })
  } catch (error) {
    next(error)
  }
}

export const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id).populate('organizerId', 'name')
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const isOwner = event.organizerId && event.organizerId._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage your own events' })
    }

    if (!['draft', 'rejected'].includes(event.status)) {
      return res.status(409).json({ message: 'Only draft or rejected events can be submitted' })
    }

    event.status = 'pending'
    event.rejectionReason = ''
    await event.save()

    return res.status(200).json(presentEvent(event))
  } catch (error) {
    next(error)
  }
}

export const cancelEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id).populate('organizerId', 'name')
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const isOwner = event.organizerId && event.organizerId._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage your own events' })
    }

    if (event.status === 'cancelled') {
      return res.status(409).json({ message: 'Event is already cancelled' })
    }

    event.status = 'cancelled'
    await event.save()

    // Cancel all confirmed bookings and tickets
    await Booking.updateMany(
      { eventId: event._id, status: 'confirmed' },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
    )
    await Ticket.updateMany(
      { eventId: event._id, status: 'valid' },
      { $set: { status: 'cancelled' } },
    )

    return res.status(200).json(presentEvent(event))
  } catch (error) {
    next(error)
  }
}
