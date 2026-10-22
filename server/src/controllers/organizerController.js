import mongoose from 'mongoose'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import Ticket from '../models/Ticket.js'
import User from '../models/User.js'
import { presentEvent } from '../utils/presenters.js'

export const getOrganizerEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizerId: req.user._id })
      .populate('organizerId', 'name')
      .sort({ createdAt: -1 })

    return res.status(200).json(events.map((e) => presentEvent(e)))
  } catch (error) {
    next(error)
  }
}

export const getOrganizerDashboard = async (req, res, next) => {
  try {
    const myEvents = await Event.find({ organizerId: req.user._id })
      .populate('organizerId', 'name')
      .sort({ createdAt: -1 })

    const eventIds = myEvents.map((e) => e._id)
    const bookings = await Booking.find({ eventId: { $in: eventIds }, status: 'confirmed' })

    const totalEvents = myEvents.length
    const published = myEvents.filter((e) => e.status === 'published').length
    const pending = myEvents.filter((e) => e.status === 'pending').length
    const drafts = myEvents.filter((e) => e.status === 'draft').length

    let ticketsSold = 0
    let revenue = 0
    bookings.forEach((b) => {
      revenue += b.totalAmount || 0
      b.items.forEach((it) => {
        ticketsSold += it.quantity || 0
      })
    })

    const recentEvents = myEvents.slice(0, 5).map((e) => presentEvent(e))

    return res.status(200).json({
      stats: {
        totalEvents,
        published,
        pending,
        drafts,
        ticketsSold,
        revenue,
      },
      recentEvents,
    })
  } catch (error) {
    next(error)
  }
}

export const getEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const event = await Event.findById(id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const isOwner = event.organizerId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only view attendees for your own events' })
    }

    const tickets = await Ticket.find({ eventId: event._id })
      .populate('attendeeId', 'name email')
      .populate('bookingId', 'reference')
      .sort({ createdAt: -1 })

    const list = tickets.map((t) => ({
      _id: t._id.toString(),
      code: t.code,
      attendeeName: t.attendeeId?.name || 'Unknown',
      attendeeEmail: t.attendeeId?.email || '',
      ticketType: t.ticketTypeName,
      status: t.status,
      checkedInAt: t.checkedInAt,
      bookingReference: t.bookingId?.reference || '',
    }))

    return res.status(200).json(list)
  } catch (error) {
    next(error)
  }
}

export const getEventAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const event = await Event.findById(id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const isOwner = event.organizerId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only view analytics for your own events' })
    }

    const bookings = await Booking.find({ eventId: event._id, status: 'confirmed' })
    const tickets = await Ticket.find({ eventId: event._id, status: { $ne: 'cancelled' } })

    let revenue = 0
    const byDayMap = {}

    bookings.forEach((b) => {
      revenue += b.totalAmount || 0
      const dateStr = new Date(b.createdAt).toISOString().slice(0, 10)
      const count = b.items.reduce((s, it) => s + (it.quantity || 0), 0)
      byDayMap[dateStr] = (byDayMap[dateStr] || 0) + count
    })

    const ticketsSold = tickets.length
    const checkedIn = tickets.filter((t) => t.status === 'checked_in').length
    const capacityUsed = event.capacity ? Math.round((ticketsSold / event.capacity) * 100) : 0

    const byTicketType = (event.ticketTypes || []).map((t) => ({
      name: t.name,
      sold: t.sold || 0,
      quantity: t.quantity || 0,
      revenue: (t.sold || 0) * (t.price || 0),
    }))

    const byDay = Object.entries(byDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, ticketsCount]) => ({ date, tickets: ticketsCount }))

    return res.status(200).json({
      event: {
        _id: event._id.toString(),
        title: event.title,
        capacity: event.capacity,
      },
      totals: {
        ticketsSold,
        revenue,
        checkedIn,
        capacityUsed,
      },
      byTicketType,
      byDay,
    })
  } catch (error) {
    next(error)
  }
}
