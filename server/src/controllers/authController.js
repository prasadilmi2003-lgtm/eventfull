import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../models/User.js'
import { publicUser } from '../utils/presenters.js'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name cannot exceed 80 characters'),
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: passwordSchema,
  role: z.enum(['attendee', 'organizer']).optional(),
})

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const isProduction = process.env.NODE_ENV === 'production'

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const createToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  )
}

const formatZodErrors = (zodError) => {
  const errors = {}
  zodError.issues.forEach((issue) => {
    const field = issue.path[0] || 'form'
    if (!errors[field]) {
      errors[field] = issue.message
    }
  })
  return errors
}

export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodErrors(parsed.error),
      })
    }

    const { name, email, password, role = 'attendee' } = parsed.data
    const normalizedEmail = email.toLowerCase()

    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      return res.status(400).json({
        message: 'This email is already registered',
        errors: { email: 'This email is already registered' },
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      accountStatus: 'active',
      favorites: [],
    })

    const token = createToken(user)
    res.cookie('eventease_token', token, cookieOptions)

    return res.status(201).json(publicUser(user))
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'This email is already registered',
        errors: { email: 'This email is already registered' },
      })
    }
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodErrors(parsed.error),
      })
    }

    const { email, password } = parsed.data
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')

    if (!user) {
      return res.status(401).json({
        message: 'Incorrect email or password',
      })
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Incorrect email or password',
      })
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        message: 'Your account is suspended. Contact support.',
      })
    }

    const token = createToken(user)
    res.cookie('eventease_token', token, cookieOptions)

    return res.status(200).json(publicUser(user))
  } catch (error) {
    next(error)
  }
}

export const logout = (req, res) => {
  res.clearCookie('eventease_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  })

  return res.status(200).json({
    message: 'Logged out successfully.',
  })
}

export const getMe = async (req, res) => {
  return res.status(200).json(publicUser(req.user))
}

export const updateMe = async (req, res, next) => {
  try {
    const { name, profileImage } = req.body
    const errors = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
      } else {
        req.user.name = name.trim()
      }
    }

    if (profileImage !== undefined) {
      req.user.profileImage = typeof profileImage === 'string' ? profileImage.trim() : ''
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      })
    }

    await req.user.save()
    return res.status(200).json(publicUser(req.user))
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email || !email.includes('@')) {
      return res.status(200).json({
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

      user.resetPasswordToken = tokenHash
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await user.save({ validateBeforeSave: false })

      // In local dev/staging, log the link to console for testing
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
      console.log(`[EventEase Auth] Password reset requested for ${user.email}. Reset URL: ${resetUrl}`)
    }

    return res.status(200).json({
      message: 'If that email exists, a reset link has been sent.',
    })
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body

    if (!token) {
      return res.status(400).json({
        message: 'Reset token is required or invalid',
      })
    }

    const parsedPass = passwordSchema.safeParse(password)
    if (!parsedPass.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { password: parsedPass.error.issues[0]?.message || 'Invalid password' },
      })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires +passwordHash')

    if (!user) {
      return res.status(400).json({
        message: 'Password reset link is invalid or has expired.',
      })
    }

    user.passwordHash = await bcrypt.hash(password, 12)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return res.status(200).json({
      message: 'Password updated. You can log in now.',
    })
  } catch (error) {
    next(error)
  }
}
