
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import authRoutes from './routes/authRoutes.js'

const app = express()

// Security headers
app.use(helmet())

// Allow requests from the frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)

// Parse incoming JSON
app.use(express.json({ limit: '1mb' }))

// Parse cookies
app.use(cookieParser())

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'EventEase API is running',
  })
})

// Authentication routes
app.use('/api/auth', authRoutes)

export default app
