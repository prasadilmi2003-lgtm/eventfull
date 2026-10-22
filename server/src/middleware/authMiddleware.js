
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.eventease_token

    if (!token) {
      return res.status(401).json({
        message: 'Please log in to continue.',
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.sub)

    if (!user || user.accountStatus !== 'active') {
      return res.status(401).json({
        message: 'Your session is invalid or expired.',
      })
    }

    // Always load the current role from the database.
    req.user = user

    next()
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        message: 'Your session is invalid or expired.',
      })
    }

    next(error)
  }
}

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Please log in to continue.',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.',
      })
    }

    next()
  }
}
