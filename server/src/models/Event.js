import mongoose from 'mongoose'

const ticketTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ticket type name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    salesStart: {
      type: Date,
      default: null,
    },
    salesEnd: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.remaining = Math.max((ret.quantity || 0) - (ret.sold || 0), 0)
        return ret
      },
    },
  },
)

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['music', 'tech', 'food', 'sports', 'arts', 'business', 'education', 'charity'],
    },
    bannerImage: {
      type: String,
      default: '',
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'Sri Lanka',
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected', 'cancelled'],
      default: 'draft',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketTypes: [ticketTypeSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v
        return ret
      },
    },
  },
)

eventSchema.index({ status: 1, endDate: 1, category: 1, city: 1 })
eventSchema.index({ organizerId: 1, status: 1 })
eventSchema.index({ title: 'text', description: 'text', venue: 'text', city: 'text' })

const Event = mongoose.model('Event', eventSchema)

export default Event
