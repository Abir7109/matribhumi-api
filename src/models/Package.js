const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema(
  {
    currency: { type: String, required: true, default: 'BDT' },
    amount: { type: Number, required: true }
  },
  { _id: false }
);

const ItineraryItemSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true }
  },
  { _id: false }
);

const PackageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['hajj', 'umrah'], required: true },
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'draft' },
    price: { type: PriceSchema, required: true },
    durationDays: { type: Number, required: true },
    seatsAvailable: { type: Number, required: true, default: 0 },
    badges: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    itinerary: { type: [ItineraryItemSchema], default: [] },
    gallery: { type: [String], default: [] },
    thumbnail: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', PackageSchema);
