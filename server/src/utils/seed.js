import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import User from '../models/User.js'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import Ticket from '../models/Ticket.js'
import ContactMessage from '../models/ContactMessage.js'

const photo = (id, width = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`

const ids = {
  concert: '1470229722913-7c0e2dbbafd3',
  openMic: '1475721027785-f74eccf877e2',
  coding: '1498050108023-c5249f4df085',
  streetFood: '1504674900247-0877df9cc836',
  run: '1461896836934-ffe607ba8211',
  gallery: '1578301978693-85fa9c0320b9',
  pitch: '1531058020387-3be344556be6',
  students: '1523580494863-6f3031224c94',
  band: '1429962714451-bb934ecdc4ec',
  jazz: '1415201364774-f6f0bb35f28f',
}

const isoIn = (days, hour = 18) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d
}

const generateCode = (prefix) => `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
const generateQrToken = () => crypto.randomBytes(24).toString('hex')

export const seedDatabase = async () => {
  console.log('Seeding database...')
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventease'
  await mongoose.connect(uri)

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Booking.deleteMany({}),
    Ticket.deleteMany({}),
    ContactMessage.deleteMany({}),
  ])

  console.log('Cleared existing collections.')

  const demoPasswordHash = await bcrypt.hash('Demo@1234', 12)
  const testPasswordHash = await bcrypt.hash('EventEase123', 12)

  // Create Users
  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@demo.com',
    passwordHash: demoPasswordHash,
    role: 'admin',
    accountStatus: 'active',
    emailVerified: true,
  })

  const org1 = await User.create({
    name: 'Pulse Events',
    email: 'organizer@demo.com',
    passwordHash: demoPasswordHash,
    role: 'organizer',
    accountStatus: 'active',
    emailVerified: true,
  })

  const org2 = await User.create({
    name: 'DevLanka',
    email: 'organizer2@demo.com',
    passwordHash: demoPasswordHash,
    role: 'organizer',
    accountStatus: 'active',
    emailVerified: true,
  })

  const att = await User.create({
    name: 'Demo Attendee',
    email: 'attendee@demo.com',
    passwordHash: demoPasswordHash,
    role: 'attendee',
    accountStatus: 'active',
    emailVerified: true,
  })

  const att2 = await User.create({
    name: 'Kasun Silva',
    email: 'kasun@demo.com',
    passwordHash: demoPasswordHash,
    role: 'attendee',
    accountStatus: 'active',
    emailVerified: true,
  })

  const att3 = await User.create({
    name: 'Nadeesha Fernando',
    email: 'nadeesha@demo.com',
    passwordHash: demoPasswordHash,
    role: 'attendee',
    accountStatus: 'active',
    emailVerified: true,
  })

  await User.create({
    name: 'Suspended Sample',
    email: 'suspended@demo.com',
    passwordHash: demoPasswordHash,
    role: 'attendee',
    accountStatus: 'suspended',
    emailVerified: false,
  })

  await User.create({
    name: 'Test User',
    email: 'testuser@example.com',
    passwordHash: testPasswordHash,
    role: 'attendee',
    accountStatus: 'active',
    emailVerified: true,
  })

  console.log('Created Users.')

  const tt = (name, price, quantity, description = '') => ({
    _id: new mongoose.Types.ObjectId(),
    name,
    description,
    price,
    quantity,
    sold: 0,
    salesStart: null,
    salesEnd: null,
  })

  // Create Events
  const eventsData = [
    {
      title: 'Neon Nights Live Concert',
      bannerImage: photo(ids.concert),
      description:
        'A huge open-air night of live bands, light shows and good vibes. Gates open at 5 PM in Colombo.',
      category: 'music',
      organizerId: org1._id,
      venue: 'Open Air Arena',
      address: '12 Stadium Road',
      city: 'Colombo',
      startDate: isoIn(18, 18),
      endDate: isoIn(18, 23),
      capacity: 500,
      featured: true,
      status: 'published',
      ticketTypes: [
        tt('General Admission', 3500, 300, 'Standing area'),
        tt('VIP', 8000, 50, 'Front zone with lounge access'),
        tt('Student', 2500, 100, 'Valid student ID required at the gate'),
      ],
    },
    {
      title: 'CodeCamp: Web Dev Bootcamp',
      bannerImage: photo(ids.coding),
      description:
        'A full-day, hands-on bootcamp covering HTML, CSS, JavaScript and React for beginners in Kandy.',
      category: 'tech',
      organizerId: org2._id,
      venue: 'Tech Hub',
      address: '88 Hill Street',
      city: 'Kandy',
      startDate: isoIn(10, 9),
      endDate: isoIn(10, 17),
      capacity: 120,
      featured: true,
      status: 'published',
      ticketTypes: [tt('Free Registration', 0, 120, 'Lunch not included')],
    },
    {
      title: 'Street Food Carnival',
      bannerImage: photo(ids.streetFood),
      description:
        'Dozens of street food stalls, cooking demos and live music inside the historic Galle Fort.',
      category: 'food',
      organizerId: org1._id,
      venue: 'Fort Grounds',
      address: 'Fort Road',
      city: 'Galle',
      startDate: isoIn(25, 11),
      endDate: isoIn(25, 21),
      capacity: 800,
      featured: true,
      status: 'published',
      ticketTypes: [tt('Entry Pass', 500, 800, 'Includes 2 tasting coupons')],
    },
    {
      title: 'Charity 10K Fun Run',
      bannerImage: photo(ids.run),
      description:
        "Run or walk 10 kilometres along the coast to raise funds for local children's education.",
      category: 'sports',
      organizerId: org2._id,
      venue: 'Galle Face Green',
      address: 'Galle Road',
      city: 'Colombo',
      startDate: isoIn(32, 6),
      endDate: isoIn(32, 10),
      capacity: 1000,
      status: 'published',
      ticketTypes: [tt('Runner', 0, 1000, 'T-shirt collected on race day')],
    },
    {
      title: 'Modern Art Exhibition',
      bannerImage: photo(ids.gallery),
      description:
        'Paintings, sculpture and installations from twenty emerging Sri Lankan artists in Colombo.',
      category: 'arts',
      organizerId: org1._id,
      venue: 'City Gallery',
      address: '21 Art Avenue',
      city: 'Colombo',
      startDate: isoIn(40, 10),
      endDate: isoIn(40, 18),
      capacity: 200,
      status: 'published',
      ticketTypes: [
        tt('Standard', 800, 150),
        tt('Guided Tour', 1500, 50, 'Includes a curator-led tour'),
      ],
    },
    {
      title: 'Startup Pitch Night',
      bannerImage: photo(ids.pitch),
      description:
        'Ten early-stage startups pitch to a panel of investors, followed by networking and refreshments.',
      category: 'business',
      organizerId: org2._id,
      venue: 'Innovation Centre',
      address: '5 Tech Park',
      city: 'Colombo',
      startDate: isoIn(45, 17),
      endDate: isoIn(45, 21),
      capacity: 150,
      status: 'published',
      ticketTypes: [tt('Attendee', 1500, 130), tt('Investor Pass', 4000, 20)],
    },
    {
      title: 'AI for Students Workshop',
      bannerImage: photo(ids.students),
      description:
        'Learn how to use AI tools responsibly for study, research and building practical mini-projects.',
      category: 'education',
      organizerId: org2._id,
      venue: 'University Hall',
      address: 'Campus Road',
      city: 'Jaffna',
      startDate: isoIn(52, 14),
      endDate: isoIn(52, 17),
      capacity: 200,
      status: 'published',
      ticketTypes: [tt('Student Entry', 0, 200)],
    },
    {
      title: 'Acoustic Evenings',
      bannerImage: photo(ids.band),
      description:
        'Sunset acoustic sets by the beach with fresh seafood, live music and cold drinks in Negombo.',
      category: 'music',
      organizerId: org1._id,
      venue: 'Beach Cafe',
      address: 'Lewis Place',
      city: 'Negombo',
      startDate: isoIn(60, 19),
      endDate: isoIn(60, 22),
      capacity: 100,
      status: 'published',
      ticketTypes: [tt('Table for Two', 2400, 30), tt('Standing', 1200, 70)],
    },
    {
      title: 'Beach Clean-up Drive',
      description:
        'Join volunteers for a morning clean-up of Unawatuna beach. Gloves, bags and snacks provided.',
      category: 'charity',
      organizerId: org2._id,
      venue: 'Unawatuna Beach',
      address: 'Beach Road',
      city: 'Galle',
      startDate: isoIn(20, 7),
      endDate: isoIn(20, 11),
      capacity: 150,
      status: 'pending',
      ticketTypes: [tt('Volunteer', 0, 150)],
    },
    {
      title: 'Jazz Under the Stars',
      bannerImage: photo(ids.jazz),
      description:
        'An outdoor jazz evening with a seven-piece band and a rooftop view of the Colombo skyline.',
      category: 'music',
      organizerId: org1._id,
      venue: 'Skyline Terrace',
      address: '9 Tower Road',
      city: 'Colombo',
      startDate: isoIn(70, 19),
      endDate: isoIn(70, 23),
      capacity: 120,
      status: 'draft',
      ticketTypes: [tt('Standard', 4500, 120)],
    },
  ]

  const createdEvents = await Event.insertMany(eventsData)
  console.log(`Created ${createdEvents.length} Events.`)

  // Create Bookings and Tickets
  const eConcert = createdEvents[0]
  const eCodeCamp = createdEvents[1]
  const eStreetFood = createdEvents[2]
  const eArt = createdEvents[4]

  const createBookingHelper = async (user, event, ttIndex, qty) => {
    const ticketType = event.ticketTypes[ttIndex]
    ticketType.sold += qty
    await event.save()

    const totalAmount = ticketType.price * qty
    const booking = await Booking.create({
      reference: generateCode('EE'),
      attendeeId: user._id,
      eventId: event._id,
      items: [
        {
          ticketTypeId: ticketType._id,
          name: ticketType.name,
          price: ticketType.price,
          quantity: qty,
        },
      ],
      totalAmount,
      currency: 'LKR',
      status: 'confirmed',
      paymentStatus: totalAmount === 0 ? 'not_required' : 'paid',
    })

    const tickets = []
    for (let i = 0; i < qty; i++) {
      tickets.push({
        bookingId: booking._id,
        attendeeId: user._id,
        eventId: event._id,
        ticketTypeId: ticketType._id,
        ticketTypeName: ticketType.name,
        code: generateCode('TKT'),
        qrToken: generateQrToken(),
        status: 'valid',
      })
    }

    const insertedTickets = await Ticket.insertMany(tickets)
    return { booking, tickets: insertedTickets }
  }

  // Sample bookings for attendee
  const b1 = await createBookingHelper(att, eConcert, 0, 2)
  const b2 = await createBookingHelper(att, eCodeCamp, 0, 1)
  const b3 = await createBookingHelper(att2, eStreetFood, 0, 3)
  const b4 = await createBookingHelper(att3, eConcert, 1, 1)
  const b5 = await createBookingHelper(att3, eArt, 0, 2)

  // Mark one ticket as checked in for demo
  const sampleTicket = b2.tickets[0]
  sampleTicket.status = 'checked_in'
  sampleTicket.checkedInAt = new Date()
  sampleTicket.checkedInBy = org2._id
  await sampleTicket.save()

  // Set favorites for attendee
  att.favorites = [eStreetFood._id.toString(), eArt._id.toString()]
  await att.save()

  // Sample Contact message
  await ContactMessage.create({
    name: 'Saman Kumara',
    email: 'saman@example.com',
    message: 'Hello! I would like to know if tickets for Neon Nights can be transferred to a friend?',
  })

  console.log('Database successfully seeded with realistic full platform data!')
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed successfully.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
