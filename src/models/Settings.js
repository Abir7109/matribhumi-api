const mongoose = require('mongoose');

const FaqSchema = new mongoose.Schema(
  {
    q: { type: String, required: true },
    a: { type: String, required: true }
  },
  { _id: false }
);

const LocaleContentSchema = new mongoose.Schema(
  {
    heroHeadline: { type: String, default: '' },
    heroSubtext: { type: String, default: '' },
    faqs: { type: [FaqSchema], default: [] }
  },
  { _id: false }
);

const ContactSchema = new mongoose.Schema(
  {
    whatsapp: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, unique: true, default: 'default' },
    whatsappNumber: { type: String, default: '' },
    contact: { type: ContactSchema, default: () => ({}) },
    bn: { type: LocaleContentSchema, default: () => ({}) },
    en: { type: LocaleContentSchema, default: () => ({}) }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
