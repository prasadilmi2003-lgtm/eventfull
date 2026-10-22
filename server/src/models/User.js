
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must contain at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['attendee', 'organizer', 'admin'],
      default: 'attendee',
      required: true,
    },

    profileImage: {
      type: String,
      default: '',
    },

    accountStatus: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    favorites: {
      type: [String],
      default: [],
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash
        delete ret.resetPasswordToken
        delete ret.resetPasswordExpires
        delete ret.__v
        return ret
      },
    },
  },
)

const User = mongoose.model('User', userSchema)

export default User
