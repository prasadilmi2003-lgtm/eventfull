// Sets the administrator login from ADMIN_EMAIL / ADMIN_PASSWORD in server/.env.
// Updates the existing admin account (no data is deleted) or creates one if none exists.
// Run with: npm run set-admin
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/User.js'

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || ''

if (!email || password.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in server/.env first.')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventease')
try {
  const passwordHash = await bcrypt.hash(password, 12)
  const admin = await User.findOne({ role: 'admin' }).select('+passwordHash')
  if (admin) {
    admin.email = email
    admin.passwordHash = passwordHash
    admin.accountStatus = 'active'
    await admin.save()
    console.log(`Admin account updated: ${email}`)
  } else {
    await User.create({ name: 'Platform Admin', email, passwordHash, role: 'admin', accountStatus: 'active', emailVerified: true })
    console.log(`Admin account created: ${email}`)
  }
} finally {
  await mongoose.disconnect()
}
