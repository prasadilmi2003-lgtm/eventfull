import mongoose from 'mongoose'
import User from '../models/User.js'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import { publicUser, presentEvent } from '../utils/presenters.js'

const CATEGORY_NAMES = {
  music: 'Music',
  tech: 'Tech',
  food: 'Food & Drink',
  sports: 'Sports',
  arts: 'Arts',
  business: 'Business',
  education: 'Education',
  charity: 'Charity',
}

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      usersCount,
      organizersCount,
      attendeesCount,
      eventsCount,
      pendingEvents,
      confirmedBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'organizer' }),
      User.countDocuments({ role: 'attendee' }),
      Event.countDocuments(),
      Event.find({ status: 'pending' }).populate('organizerId', 'name').sort({ createdAt: -1 }),
      Booking.find({ status: 'confirmed' }),
    ])

    const revenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)

    return res.status(200).json({
      stats: {
        users: usersCount,
        organizers: organizersCount,
        attendees: attendeesCount,
        events: eventsCount,
        pending: pendingEvents.length,
        bookings: confirmedBookings.length,
        revenue,
      },
      pendingEvents: pendingEvents.map((e) => presentEvent(e)),
    })
  } catch (error) {
    next(error)
  }
}

export const getAdminUsers = async (req, res, next) => {
  try {
    const { search = '', role = '' } = req.query
    const query = {}

    if (role && ['attendee', 'organizer', 'admin'].includes(role)) {
      query.role = role
    }

    if (search) {
      const sRegex = new RegExp(search.trim(), 'i')
      query.$or = [{ name: sRegex }, { email: sRegex }]
    }

    const users = await User.find(query).sort({ createdAt: -1 })
    return res.status(200).json(users.map((u) => publicUser(u)))
  } catch (error) {
    next(error)
  }
}

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { accountStatus } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!['active', 'suspended'].includes(accountStatus)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const targetUser = await User.findById(id)
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (targetUser._id.toString() === req.user._id.toString() || targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be suspended' })
    }

    targetUser.accountStatus = accountStatus
    await targetUser.save()

    return res.status(200).json(publicUser(targetUser))
  } catch (error) {
    next(error)
  }
}

export const getAdminEvents = async (req, res, next) => {
  try {
    const { status = '' } = req.query
    const query = {}

    if (status && ['draft', 'pending', 'published', 'rejected', 'cancelled'].includes(status)) {
      query.status = status
    }

    const events = await Event.find(query)
      .populate('organizerId', 'name')
      .sort({ createdAt: -1 })

    return res.status(200).json(events.map((e) => presentEvent(e)))
  } catch (error) {
    next(error)
  }
}

export const reviewEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const { decision, reason = '' } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const event = await Event.findById(id).populate('organizerId', 'name')
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    if (decision === 'approve') {
      if (event.status !== 'pending') {
        return res.status(409).json({ message: 'Only pending events can be approved' })
      }
      event.status = 'published'
      event.rejectionReason = ''
    } else if (decision === 'reject') {
      if (String(reason || '').trim().length < 5) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: { reason: 'Give a reason (at least 5 characters)' },
        })
      }
      event.status = 'rejected'
      event.rejectionReason = String(reason).trim()
    } else if (decision === 'unpublish') {
      if (event.status !== 'published') {
        return res.status(409).json({ message: 'Only published events can be unpublished' })
      }
      event.status = 'draft'
    } else {
      return res.status(400).json({ message: 'Invalid decision' })
    }

    await event.save()
    return res.status(200).json(presentEvent(event))
  } catch (error) {
    next(error)
  }
}

export const getAdminReports = async (req, res, next) => {
  try {
    const [allBookings, allEvents, allUsers] = await Promise.all([
      Booking.find(),
      Event.find().lean(),
      User.find().lean(),
    ])

    const confirmed = allBookings.filter((b) => b.status === 'confirmed')
    const cancelledCount = allBookings.length - confirmed.length

    let totalRevenue = 0
    let totalTickets = 0

    // Map bookings by event ID
    const eventRevenueMap = {}
    const eventTicketsMap = {}

    confirmed.forEach((b) => {
      totalRevenue += b.totalAmount || 0
      const evId = b.eventId.toString()
      eventRevenueMap[evId] = (eventRevenueMap[evId] || 0) + (b.totalAmount || 0)

      let bQty = 0
      b.items.forEach((it) => {
        bQty += it.quantity || 0
      })
      totalTickets += bQty
      eventTicketsMap[evId] = (eventTicketsMap[evId] || 0) + bQty
    })

    // Breakdown by category
    const byCategory = Object.entries(CATEGORY_NAMES).map(([slug, name]) => {
      const categoryEvents = allEvents.filter((e) => e.category === slug)
      const catEventIds = new Set(categoryEvents.map((e) => e._id.toString()))

      let tickets = 0
      let revenue = 0
      confirmed.forEach((b) => {
        if (catEventIds.has(b.eventId.toString())) {
          revenue += b.totalAmount || 0
          b.items.forEach((it) => {
            tickets += it.quantity || 0
          })
        }
      })

      return {
        category: name,
        tickets,
        revenue,
      }
    })

    // Top 5 events by tickets sold
    const topEvents = allEvents
      .map((e) => {
        const idStr = e._id.toString()
        const sold = eventTicketsMap[idStr] || 0
        const revenue = eventRevenueMap[idStr] || 0
        return {
          _id: idStr,
          title: e.title,
          sold,
          revenue,
        }
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)

    // Users by role
    const usersByRole = ['attendee', 'organizer', 'admin'].map((role) => ({
      role,
      count: allUsers.filter((u) => u.role === role).length,
    }))

    return res.status(200).json({
      totals: {
        bookings: confirmed.length,
        tickets: totalTickets,
        revenue: totalRevenue,
        cancelled: cancelledCount,
      },
      byCategory,
      topEvents,
      usersByRole,
    })
  } catch (error) {
    next(error)
  }
}
