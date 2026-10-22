import crypto from 'crypto'
import mongoose from 'mongoose'
import Booking from '../models/Booking.js'
import Event from '../models/Event.js'
import Ticket from '../models/Ticket.js'
import User from '../models/User.js'
import { presentBooking } from '../utils/presenters.js'

const generateCode = (prefix) => {
  return `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

const generateQrToken = () => {
  return crypto.randomBytes(24).toString('hex')
}

export const createBooking = async (req, res, next) => {
  try {
    const { eventId, items } = req.body

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: 'Event not found or not open for booking' })
    }

    const event = await Event.findById(eventId)
    if (!event || event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found or not open for booking' })
    }

    const now = new Date()
    if (new Date(event.endDate) < now) {
      return res.status(400).json({ message: 'This event has already ended' })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Select at least one ticket' })
    }

    let totalQuantity = 0
    const validatedItems = []

    for (const it of items) {
      const ticketTypeId = it.ticketTypeId
      const qty = Number(it.quantity)
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: 'Invalid quantity' })
      }

      const tt = event.ticketTypes.find((t) => t._id.toString() === String(ticketTypeId))
      if (!tt) {
        return res.status(400).json({ message: 'Invalid ticket type' })
      }

      if (tt.salesStart && new Date(tt.salesStart) > now) {
        return res.status(400).json({ message: `${tt.name} is not on sale yet` })
      }

      if (tt.salesEnd && new Date(tt.salesEnd) < now) {
        return res.status(400).json({ message: `Sales have ended for ${tt.name}` })
      }

      const remaining = Math.max(tt.quantity - tt.sold, 0)
      if (remaining < qty) {
        return res.status(409).json({ message: `Only ${remaining} left for ${tt.name}` })
      }

      totalQuantity += qty
      validatedItems.push({
        ticketType: tt,
        quantity: qty,
      })
    }

    if (totalQuantity > 10) {
      return res.status(400).json({ message: 'You can book at most 10 tickets at once' })
    }

    // Calculate total price server-side
    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.ticketType.price * item.quantity,
      0,
    )

    // Free event duplicate check
    if (totalAmount === 0) {
      const alreadyRegistered = await Booking.findOne({
        attendeeId: req.user._id,
        eventId: event._id,
        status: 'confirmed',
        totalAmount: 0,
      })

      if (alreadyRegistered) {
        return res.status(409).json({ message: 'You are already registered for this event' })
      }
    }

    // Atomic inventory decrement for each item to prevent overselling
    const updatedTicketTypes = []
    for (const item of validatedItems) {
      const updated = await Event.findOneAndUpdate(
        {
          _id: event._id,
          'ticketTypes._id': item.ticketType._id,
          'ticketTypes.sold': { $lte: item.ticketType.quantity - item.quantity },
        },
        {
          $inc: { 'ticketTypes.$.sold': item.quantity },
        },
        { new: true },
      )

      if (!updated) {
        // Rollback previously decremented tickets
        for (const rolled of updatedTicketTypes) {
          await Event.updateOne(
            { _id: event._id, 'ticketTypes._id': rolled.ticketTypeId },
            { $inc: { 'ticketTypes.$.sold': -rolled.quantity } },
          )
        }
        return res.status(409).json({
          message: `Tickets sold out for ${item.ticketType.name}. Please try again.`,
        })
      }

      updatedTicketTypes.push({
        ticketTypeId: item.ticketType._id,
        quantity: item.quantity,
      })
    }

    // Generate unique reference
    let reference = generateCode('EE')
    while (await Booking.findOne({ reference })) {
      reference = generateCode('EE')
    }

    const booking = await Booking.create({
      reference,
      attendeeId: req.user._id,
      eventId: event._id,
      items: validatedItems.map((item) => ({
        ticketTypeId: item.ticketType._id,
        name: item.ticketType.name,
        price: item.ticketType.price,
        quantity: item.quantity,
      })),
      totalAmount,
      currency: 'LKR',
      status: 'confirmed',
      paymentStatus: totalAmount === 0 ? 'not_required' : 'paid',
    })

    // Create tickets
    const ticketsToCreate = []
    for (const item of validatedItems) {
      for (let i = 0; i < item.quantity; i++) {
        ticketsToCreate.push({
          bookingId: booking._id,
          attendeeId: req.user._id,
          eventId: event._id,
          ticketTypeId: item.ticketType._id,
          ticketTypeName: item.ticketType.name,
          code: generateCode('TKT'),
          qrToken: generateQrToken(),
          status: 'valid',
          checkedInAt: null,
          checkedInBy: null,
        })
      }
    }

    const createdTickets = await Ticket.insertMany(ticketsToCreate)

    return res.status(201).json(presentBooking(booking, event, createdTickets))
  } catch (error) {
    next(error)
  }
}

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ attendeeId: req.user._id })
      .populate('eventId')
      .sort({ createdAt: -1 })

    const bookingIds = bookings.map((b) => b._id)
    const tickets = await Ticket.find({ bookingId: { $in: bookingIds } })

    const list = bookings.map((b) => {
      const bTickets = tickets.filter((t) => t.bookingId.toString() === b._id.toString())
      return presentBooking(b, b.eventId, bTickets)
    })

    return res.status(200).json(list)
  } catch (error) {
    next(error)
  }
}

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const booking = await Booking.findById(id).populate('eventId')
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const isOwner = booking.attendeeId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const tickets = await Ticket.find({ bookingId: booking._id })
    return res.status(200).json(presentBooking(booking, booking.eventId, tickets))
  } catch (error) {
    next(error)
  }
}

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const booking = await Booking.findById(id).populate('eventId')
    if (!booking || booking.attendeeId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const DAY = 24 * 60 * 60 * 1000
    const eventStartDate = new Date(booking.eventId.startDate).getTime()
    const canCancel = booking.status === 'confirmed' && eventStartDate - Date.now() > DAY

    if (!canCancel) {
      return res.status(409).json({
        message: 'This booking can no longer be cancelled (cancellation closes 24 hours before the event)',
      })
    }

    // Restore inventory
    for (const it of booking.items) {
      await Event.updateOne(
        { _id: booking.eventId._id, 'ticketTypes._id': it.ticketTypeId },
        { $inc: { 'ticketTypes.$.sold': -it.quantity } },
      )
    }

    // Mark tickets cancelled
    await Ticket.updateMany({ bookingId: booking._id }, { $set: { status: 'cancelled' } })

    booking.status = 'cancelled'
    booking.cancelledAt = new Date()
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded'
    }
    await booking.save()

    const tickets = await Ticket.find({ bookingId: booking._id })
    return res.status(200).json(presentBooking(booking, booking.eventId, tickets))
  } catch (error) {
    next(error)
  }
}

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ attendeeId: req.user._id })
      .populate('eventId')
      .populate('bookingId', 'reference')
      .lean()

    const list = tickets
      .map((t) => ({
        _id: t._id.toString(),
        code: t.code,
        qrToken: t.qrToken,
        ticketTypeName: t.ticketTypeName,
        status: t.status,
        checkedInAt: t.checkedInAt,
        bookingId: t.bookingId?._id?.toString() || '',
        bookingReference: t.bookingId?.reference || '',
        event: {
          _id: t.eventId?._id?.toString() || '',
          title: t.eventId?.title || '',
          category: t.eventId?.category || '',
          startDate: t.eventId?.startDate,
          endDate: t.eventId?.endDate,
          venue: t.eventId?.venue || '',
          city: t.eventId?.city || '',
          bannerImage: t.eventId?.bannerImage || '',
        },
      }))
      .sort((a, b) => new Date(a.event.startDate) - new Date(b.event.startDate))

    return res.status(200).json(list)
  } catch (error) {
    next(error)
  }
}

export const checkInTicket = async (req, res, next) => {
  try {
    const { eventId, token } = req.body
    const trimmed = String(token || '').trim()

    if (!trimmed) {
      return res.status(400).json({ message: 'Enter a ticket code' })
    }

    const ticket = await Ticket.findOne({
      $or: [{ qrToken: trimmed }, { code: trimmed.toUpperCase() }],
    }).populate('eventId')

    if (!ticket) {
      return res.status(404).json({ message: 'Invalid ticket: not found' })
    }

    const event = ticket.eventId
    const isOwner = event && event.organizerId && event.organizerId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'This ticket belongs to an event you do not manage' })
    }

    if (eventId && ticket.eventId._id.toString() !== String(eventId)) {
      return res.status(409).json({ message: `Wrong event: this ticket is for "${event.title}"` })
    }

    if (ticket.status === 'cancelled') {
      return res.status(409).json({ message: 'Ticket was cancelled' })
    }

    if (ticket.status === 'checked_in') {
      const checkedTime = ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString() : ''
      return res.status(409).json({ message: `Already checked in at ${checkedTime}` })
    }

    ticket.status = 'checked_in'
    ticket.checkedInAt = new Date()
    ticket.checkedInBy = req.user._id
    await ticket.save()

    const attendee = await User.findById(ticket.attendeeId).select('name')

    return res.status(200).json({
      _id: ticket._id.toString(),
      code: ticket.code,
      ticketTypeName: ticket.ticketTypeName,
      status: 'checked_in',
      checkedInAt: ticket.checkedInAt,
      attendeeName: attendee?.name || 'Attendee',
    })
  } catch (error) {
    next(error)
  }
}
