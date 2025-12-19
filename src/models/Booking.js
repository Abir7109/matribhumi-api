const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    phone: { type: String, required: true },
    email: { type: String },
    passportNumber: { type: String, required: true },
    passportExpiry: { type: String, required: true },
    travelers: { type: Number, required: true },
    preferredMonth: { type: String, required: true },
    notes: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    source: { type: String, enum: ['web', 'whatsapp'], default: 'web' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Booking', BookingSchema);
