const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['page_view', 'package_view', 'booking_submit', 'whatsapp_open'],
      required: true
    },
    path: { type: String },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    userAgent: { type: String },
    ipHash: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

EventSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Event', EventSchema);
