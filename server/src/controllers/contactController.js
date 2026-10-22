import ContactMessage from '../models/ContactMessage.js'

export const submitContactMessage = async (req, res, next) => {
  try {
    const { name = '', email = '', message = '' } = req.body
    const errors = {}

    if (!name.trim()) errors.name = 'Name is required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address'
    }
    if (message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      })
    }

    await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    })

    return res.status(201).json({
      message: 'Thanks! We will get back to you soon.',
    })
  } catch (error) {
    next(error)
  }
}
