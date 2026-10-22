import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import authRoutes from './routes/authRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import organizerRoutes from './routes/organizerRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import ticketRoutes from './routes/ticketRoutes.js'
import favoriteRoutes from './routes/favoriteRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// Security headers with relaxed cross-origin resource policy for local development
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

// Allow requests from the frontend
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Vite proxy)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, true) // permissive for local development
    },
    credentials: true,
  }),
)

// Parse incoming JSON and cookies
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(cookieParser())

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'EventEase API is running',
    timestamp: new Date().toISOString(),
  })
})

// Core API routes
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/organizer', organizerRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/notifications', notificationRoutes)

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` })
})

// Centralized error handler
app.use(errorHandler)

export default app
