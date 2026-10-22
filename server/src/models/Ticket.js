import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    attendeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    ticketTypeName: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['valid', 'checked_in', 'cancelled'],
      default: 'valid',
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
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

ticketSchema.index({ attendeeId: 1 })
ticketSchema.index({ eventId: 1, status: 1 })
ticketSchema.index({ bookingId: 1 })

const Ticket = mongoose.model('Ticket', ticketSchema)

export default Ticket
