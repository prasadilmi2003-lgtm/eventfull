export class AppError extends Error {
  constructor(status, message, errors = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export const errorHandler = (err, req, res, next) => {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500)
  let message = err.message || 'An unexpected error occurred.'
  let errors = err.errors || {}

  // Handle Mongoose ValidationErrors
  if (err.name === 'ValidationError' && err.errors) {
    message = 'Validation failed'
    errors = {}
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message
    })
  }

  // Handle Duplicate Key Errors (11000)
  if (err.code === 11000) {
    message = 'A record with this identifier already exists.'
    const field = Object.keys(err.keyValue || {})[0]
    if (field === 'email') {
      errors = { email: 'This email is already registered' }
      message = 'An account with this email already exists.'
    }
    return res.status(409).json({ message, errors })
  }

  if (process.env.NODE_ENV !== 'production' && status === 500) {
    console.error('Server error:', err)
  }

  return res.status(status).json({
    message,
    ...(Object.keys(errors).length ? { errors } : {}),
  })
}
