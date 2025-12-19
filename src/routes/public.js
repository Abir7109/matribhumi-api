const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const Package = require('../models/Package');
const Booking = require('../models/Booking');
const { buildBookingMessage, buildWhatsappLink } = require('../utils/whatsapp');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

router.get('/packages', async (req, res, next) => {
  try {
    const type = req.query.type;
    const query = { status: 'published' };
    if (type === 'hajj' || type === 'umrah') query.type = type;

    const packages = await Package.find(query).sort({ updatedAt: -1 }).lean();
    res.json({ packages });
  } catch (e) {
    next(e);
  }
});

router.get('/packages/:id', async (req, res, next) => {
  try {
    const pkg = await Package.findOne({ _id: req.params.id, status: 'published' }).lean();
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ package: pkg });
  } catch (e) {
    next(e);
  }
});

const bookingsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const BookingCreateSchema = z.object({
  packageId: z.string().min(1),
  name: z.string().min(2),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  passportNumber: z.string().min(3),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travelers: z.number().int().min(1).max(50),
  preferredMonth: z.string().regex(/^\d{4}-\d{2}$/),
  notes: z.string().max(500).optional().or(z.literal(''))
});

router.post('/bookings', bookingsLimiter, async (req, res, next) => {
  try {
    const parsed = BookingCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten()
      });
    }

    const data = parsed.data;
    const pkg = await Package.findById(data.packageId).lean();
    if (!pkg || pkg.status !== 'published') {
      return res.status(400).json({ error: 'Invalid packageId' });
    }

    const booking = await Booking.create({
      packageId: data.packageId,
      name: data.name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      email: data.email || undefined,
      passportNumber: data.passportNumber,
      passportExpiry: data.passportExpiry,
      travelers: data.travelers,
      preferredMonth: data.preferredMonth,
      notes: data.notes || undefined,
      status: 'pending',
      source: 'web'
    });

    const agencyName = 'Matribhumi Hajj Kafela';
    const message = buildBookingMessage({
      agencyName,
      name: booking.name,
      age: booking.age,
      gender: booking.gender,
      phone: booking.phone,
      email: booking.email,
      passportNumber: booking.passportNumber,
      passportExpiry: booking.passportExpiry,
      packageTitle: pkg.title,
      travelers: booking.travelers,
      preferredMonth: booking.preferredMonth,
      notes: booking.notes
    });

    const whatsappNumber = req.app.get('whatsappNumber');
    const url = buildWhatsappLink({ number: whatsappNumber, message });

    res.status(201).json({
      bookingId: String(booking._id),
      whatsapp: {
        number: whatsappNumber,
        url,
        message
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get('/whatsapp-link', async (req, res, next) => {
  try {
    const bookingId = String(req.query.bookingId || '');
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const pkg = await Package.findById(booking.packageId).lean();

    const agencyName = 'Matribhumi Hajj Kafela';
    const message = buildBookingMessage({
      agencyName,
      name: booking.name,
      age: booking.age,
      gender: booking.gender,
      phone: booking.phone,
      email: booking.email,
      passportNumber: booking.passportNumber,
      passportExpiry: booking.passportExpiry,
      packageTitle: pkg?.title || 'Selected Package',
      travelers: booking.travelers,
      preferredMonth: booking.preferredMonth,
      notes: booking.notes
    });

    const whatsappNumber = req.app.get('whatsappNumber');
    const url = buildWhatsappLink({ number: whatsappNumber, message });

    res.json({ number: whatsappNumber, url, message });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
