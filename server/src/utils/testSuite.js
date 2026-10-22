import 'dotenv/config'

const BASE_URL = 'http://localhost:5000/api'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✓ PASS: ${message}`)
  } else {
    failed++
    console.error(`  ✗ FAIL: ${message}`)
  }
}

async function runTests() {
  console.log('\n=============================================')
  console.log('  EventEase Backend API Automated Test Suite')
  console.log('=============================================\n')

  try {
    // 1. Health Endpoint
    console.log('[1] Testing Health Endpoint...')
    const healthRes = await fetch(`${BASE_URL}/health`)
    const healthData = await healthRes.json()
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200')
    assert(healthData.status === 'ok', 'Health status is ok')

    // 2. User Registration (Unique user)
    console.log('\n[2] Testing Registration...')
    const uniqueEmail = `test_${Date.now()}@example.com`
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Test User',
        email: uniqueEmail,
        password: 'Password123',
        role: 'attendee',
      }),
    })
    const regData = await regRes.json()
    assert(regRes.status === 201, 'Registration returns HTTP 201')
    assert(regData.email === uniqueEmail, 'Returned user email matches input')
    assert(!!regRes.headers.get('set-cookie'), 'Registration sets HTTP-only auth cookie')

    // Duplicate Registration
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Test User',
        email: uniqueEmail,
        password: 'Password123',
      }),
    })
    assert(dupRes.status === 400 || dupRes.status === 409, 'Duplicate registration is rejected (HTTP 400/409)')

    // 3. User Login
    console.log('\n[3] Testing Login & Authentication...')
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
      }),
    })
    assert(loginRes.status === 200, 'Login returns HTTP 200')
    const authCookie = loginRes.headers.get('set-cookie')?.split(';')[0]
    assert(!!authCookie, 'Login returns session cookie')

    // Invalid Login
    const badLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword999' }),
    })
    assert(badLogin.status === 401, 'Bad credentials return HTTP 401')

    // Suspended User Login
    const suspendedLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'suspended@demo.com', password: 'Demo@1234' }),
    })
    assert(suspendedLogin.status === 403, 'Suspended user login returns HTTP 403')

    // 4. Current User & Profile
    console.log('\n[4] Testing Profile Endpoints...')
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: authCookie },
    })
    const meData = await meRes.json()
    assert(meRes.status === 200, 'GET /auth/me returns HTTP 200')
    assert(meData.email === uniqueEmail, 'GET /auth/me returns current user profile')

    const updateRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ name: 'Updated Name', profileImage: 'https://example.com/avatar.jpg' }),
    })
    const updateData = await updateRes.json()
    assert(updateRes.status === 200, 'PATCH /auth/me returns HTTP 200')
    assert(updateData.name === 'Updated Name', 'Profile name updated correctly')

    // 5. Password Reset Workflow
    console.log('\n[5] Testing Forgot & Reset Password Workflow...')
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail }),
    })
    assert(forgotRes.status === 200, 'POST /auth/forgot-password returns HTTP 200')

    // 6. Public Events Discovery
    console.log('\n[6] Testing Public Events Discovery...')
    const featRes = await fetch(`${BASE_URL}/events/featured`)
    const featData = await featRes.json()
    assert(featRes.status === 200, 'GET /events/featured returns HTTP 200')
    assert(Array.isArray(featData), 'Featured events returns an array')

    const eventsRes = await fetch(`${BASE_URL}/events?limit=5&sort=date`)
    const eventsData = await eventsRes.json()
    assert(eventsRes.status === 200, 'GET /events returns HTTP 200')
    assert(Array.isArray(eventsData.data), 'Events list returns data array')
    assert(eventsData.total > 0, 'Events total count is greater than 0')

    const sampleEventId = eventsData.data[0]._id
    const singleEventRes = await fetch(`${BASE_URL}/events/${sampleEventId}`)
    const singleEvent = await singleEventRes.json()
    assert(singleEventRes.status === 200, 'GET /events/:id returns HTTP 200')
    assert(singleEvent._id === sampleEventId, 'Returned event has matching ID')
    assert(Array.isArray(singleEvent.ticketTypes), 'Event includes ticketTypes array')

    // 7. Organizer Operations
    console.log('\n[7] Testing Organizer Operations...')
    const orgLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@demo.com', password: 'Demo@1234' }),
    })
    const orgCookie = orgLogin.headers.get('set-cookie')?.split(';')[0]

    const orgDashRes = await fetch(`${BASE_URL}/organizer/dashboard`, {
      headers: { Cookie: orgCookie },
    })
    const orgDash = await orgDashRes.json()
    assert(orgDashRes.status === 200, 'GET /organizer/dashboard returns HTTP 200')
    assert(orgDash.stats.totalEvents > 0, 'Organizer dashboard contains totalEvents')

    // Create a new draft event as organizer
    const newEventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: orgCookie },
      body: JSON.stringify({
        title: 'Automation Tech Summit 2026',
        category: 'tech',
        description: 'An advanced technology conference discussing next-generation automation and AI tools.',
        venue: 'Colombo Convention Center',
        city: 'Colombo',
        startDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 16 * 86400000).toISOString(),
        capacity: 100,
        ticketTypes: [
          { name: 'Standard Pass', price: 1500, quantity: 80 },
          { name: 'VIP Pass', price: 4000, quantity: 20 },
        ],
      }),
    })
    const createdEvent = await newEventRes.json()
    assert(newEventRes.status === 201, 'POST /events creates draft event with HTTP 201')
    assert(createdEvent.status === 'draft', 'Newly created event status is draft')

    // Submit for approval (publish)
    const pubRes = await fetch(`${BASE_URL}/events/${createdEvent._id}/publish`, {
      method: 'POST',
      headers: { Cookie: orgCookie },
    })
    const pubData = await pubRes.json()
    assert(pubRes.status === 200, 'POST /events/:id/publish submits event')
    assert(pubData.status === 'pending', 'Submitted event status transitions to pending')

    // 8. Admin Moderation & Reports
    console.log('\n[8] Testing Admin Moderation & Analytics...')
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Demo@1234' }),
    })
    const adminCookie = adminLogin.headers.get('set-cookie')?.split(';')[0]

    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: adminCookie },
    })
    const adminDash = await adminDashRes.json()
    assert(adminDashRes.status === 200, 'GET /admin/dashboard returns HTTP 200')
    assert(adminDash.stats.events > 0, 'Admin stats report correct event count')

    // Admin approves the pending event
    const reviewRes = await fetch(`${BASE_URL}/admin/events/${createdEvent._id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ decision: 'approve' }),
    })
    const reviewedEvent = await reviewRes.json()
    assert(reviewRes.status === 200, 'Admin approves pending event with HTTP 200')
    assert(reviewedEvent.status === 'published', 'Approved event status is now published')

    // Admin reports
    const repRes = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { Cookie: adminCookie },
    })
    const repData = await repRes.json()
    assert(repRes.status === 200, 'GET /admin/reports returns HTTP 200')
    assert(Array.isArray(repData.byCategory), 'Reports includes byCategory analysis')
    assert(Array.isArray(repData.topEvents), 'Reports includes topEvents list')

    // 9. Booking, QR Ticket Generation & Check-In
    console.log('\n[9] Testing Booking, Tickets & Check-In Flow...')
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({
        eventId: reviewedEvent._id,
        items: [{ ticketTypeId: reviewedEvent.ticketTypes[0]._id, quantity: 1 }],
      }),
    })
    const bookData = await bookRes.json()
    assert(bookRes.status === 201, 'POST /bookings creates booking with HTTP 201')
    assert(!!bookData.reference, 'Booking generates unique reference')
    assert(bookData.tickets.length === 1, 'Booking generates 1 ticket')

    const ticket = bookData.tickets[0]
    assert(!!ticket.code && ticket.code.startsWith('TKT-'), 'Ticket has valid TKT- code')
    assert(!!ticket.qrToken && ticket.qrToken.length >= 32, 'Ticket has unguessable QR token (>=32 chars)')

    // Check-in ticket with QR code
    const checkInRes = await fetch(`${BASE_URL}/tickets/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ eventId: reviewedEvent._id, token: ticket.code }),
    })
    const checkInData = await checkInRes.json()
    assert(checkInRes.status === 200, 'Ticket check-in returns HTTP 200')
    assert(checkInData.status === 'checked_in', 'Ticket status updated to checked_in')

    // Duplicate check-in prevention
    const dupCheckIn = await fetch(`${BASE_URL}/tickets/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ eventId: reviewedEvent._id, token: ticket.code }),
    })
    assert(dupCheckIn.status === 409, 'Duplicate ticket check-in is rejected (HTTP 409)')

    // 10. Favorites & Contact
    console.log('\n[10] Testing Favorites & Contact...')
    const favToggle = await fetch(`${BASE_URL}/favorites/${reviewedEvent._id}`, {
      method: 'POST',
      headers: { Cookie: authCookie },
    })
    const favData = await favToggle.json()
    assert(favToggle.status === 200, 'POST /favorites/:id toggles favorite')
    assert(favData.favorites.includes(reviewedEvent._id), 'Event ID present in user favorites')

    const contactRes = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Inquiry Person',
        email: 'inquiry@example.com',
        message: 'This is a genuine inquiry message from the test suite.',
      }),
    })
    assert(contactRes.status === 201, 'POST /contact submits message with HTTP 201')

    // 11. Clean Up / Cancel Event
    console.log('\n[11] Testing Event Cancellation...')
    const cancelRes = await fetch(`${BASE_URL}/events/${createdEvent._id}/cancel`, {
      method: 'POST',
      headers: { Cookie: orgCookie },
    })
    const cancelData = await cancelRes.json()
    assert(cancelRes.status === 200, 'POST /events/:id/cancel cancels event with HTTP 200')
    assert(cancelData.status === 'cancelled', 'Cancelled event has status cancelled')

    console.log('\n=============================================')
    console.log(`  Test Suite Completed: ${passed} Passed, ${failed} Failed`)
    console.log('=============================================\n')

    if (failed > 0) {
      process.exit(1)
    }
  } catch (err) {
    console.error('Fatal error during test run:', err)
    process.exit(1)
  }
}

runTests()
