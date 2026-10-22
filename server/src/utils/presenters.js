const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0)

export const publicUser = (user) => {
  if (!user) return null
  const u = user.toObject ? user.toObject() : user
  return {
    _id: u._id.toString(),
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    profileImage: u.profileImage || '',
    accountStatus: u.accountStatus || 'active',
    emailVerified: !!u.emailVerified,
    favorites: (u.favorites || []).map((f) => f.toString()),
    createdAt: u.createdAt,
  }
}

export const eventSummary = (event) => {
  if (!event) return null
  const e = event.toObject ? event.toObject() : event
  return {
    _id: e._id.toString(),
    title: e.title,
    category: e.category,
    startDate: e.startDate,
    endDate: e.endDate,
    venue: e.venue,
    city: e.city,
    bannerImage: e.bannerImage || '',
  }
}

export const ticketView = (ticket) => {
  if (!ticket) return null
  const t = ticket.toObject ? ticket.toObject() : ticket
  return {
    _id: t._id.toString(),
    code: t.code,
    qrToken: t.qrToken,
    ticketTypeName: t.ticketTypeName,
    status: t.status,
    checkedInAt: t.checkedInAt,
  }
}

export const presentEvent = (event, organizer = null) => {
  if (!event) return null
  const e = event.toObject ? event.toObject() : event
  const ticketTypes = (e.ticketTypes || []).map((t) => {
    const quantity = Number(t.quantity) || 0
    const sold = Number(t.sold) || 0
    return {
      _id: t._id.toString(),
      name: t.name,
      description: t.description || '',
      price: Number(t.price) || 0,
      quantity,
      sold,
      remaining: Math.max(quantity - sold, 0),
      salesStart: t.salesStart || null,
      salesEnd: t.salesEnd || null,
    }
  })

  const prices = ticketTypes.map((t) => t.price)
  const orgObj = organizer || (e.organizerId && typeof e.organizerId === 'object' && e.organizerId.name ? e.organizerId : null)

  return {
    _id: e._id.toString(),
    title: e.title,
    description: e.description,
    category: e.category,
    bannerImage: e.bannerImage || '',
    venue: e.venue,
    address: e.address || '',
    city: e.city,
    country: e.country || 'Sri Lanka',
    startDate: e.startDate,
    endDate: e.endDate,
    capacity: e.capacity,
    status: e.status,
    rejectionReason: e.rejectionReason || '',
    featured: !!e.featured,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    organizer: {
      _id: orgObj ? orgObj._id.toString() : (e.organizerId ? e.organizerId.toString() : ''),
      name: orgObj?.name || 'Organizer',
    },
    ticketTypes,
    minPrice: prices.length ? Math.min(...prices) : 0,
    isFree: prices.length > 0 && prices.every((p) => p === 0),
    soldCount: sum(ticketTypes, (t) => t.sold),
    remaining: sum(ticketTypes, (t) => t.remaining),
  }
}

const DAY = 24 * 60 * 60 * 1000

export const presentBooking = (booking, event, tickets = []) => {
  if (!booking) return null
  const b = booking.toObject ? booking.toObject() : booking
  const evSummary = eventSummary(event)
  const startDate = event ? new Date(event.startDate).getTime() : 0
  const canCancel = b.status === 'confirmed' && (startDate - Date.now() > DAY)

  return {
    _id: b._id.toString(),
    reference: b.reference,
    attendeeId: b.attendeeId ? b.attendeeId.toString() : undefined,
    eventId: b.eventId ? b.eventId.toString() : undefined,
    items: (b.items || []).map((it) => ({
      ticketTypeId: it.ticketTypeId.toString(),
      name: it.name,
      price: it.price,
      quantity: it.quantity,
    })),
    totalAmount: b.totalAmount,
    currency: b.currency || 'LKR',
    status: b.status,
    paymentStatus: b.paymentStatus,
    cancelledAt: b.cancelledAt,
    createdAt: b.createdAt,
    event: evSummary,
    tickets: tickets.map(ticketView),
    canCancel,
  }
}
