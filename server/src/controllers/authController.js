
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../models/User.js'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number')

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: passwordSchema,
  role: z.enum(['attendee', 'organizer']).optional(),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
})

const isProduction = process.env.NODE_ENV === 'production'

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
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

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  emailVerified: user.emailVerified,
})

export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Please check your registration details.',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    const { name, email, password, role = 'attendee' } = parsed.data
    const normalizedEmail = email.toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
    })

    const token = createToken(user)

    res.cookie('eventease_token', token, cookieOptions)

    return res.status(201).json({
      message: 'Account created successfully.',
      user: publicUser(user),
    })
  } catch (error) {
    // Also handle simultaneous registration attempts for one email.
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
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
        message: 'Please enter a valid email and password.',
      })
    }

    const { email, password } = parsed.data

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+passwordHash')

    // Use the same message for an unknown email and a wrong password.
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    )

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        message: 'This account is currently unavailable.',
      })
    }

    const token = createToken(user)

    res.cookie('eventease_token', token, cookieOptions)

    return res.status(200).json({
      message: 'Logged in successfully.',
      user: publicUser(user),
    })
  } catch (error) {
    next(error)
  }
}

export const logout = (req, res) => {
  res.clearCookie('eventease_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  })

  return res.status(200).json({
    message: 'Logged out successfully.',
  })
}

export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by the authentication middleware.
    return res.status(200).json({
      user: publicUser(req.user),
    })
  } catch (error) {
    next(error)
  }
}
