const express = require('express');
const { z } = require('zod');

const argon2 = require('argon2');
const Package = require('../models/Package');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const AdminUser = require('../models/AdminUser');
const { authRequired, requireRole } = require('../middleware/auth');
const { createSignedUpload } = require('../utils/cloudinary');

const router = express.Router();

// attach auth for all admin routes
router.use((req, res, next) => authRequired(req.app.get('jwtSecret'))(req, res, next));

router.get('/me', async (req, res) => {
  res.json({ user: req.user });
});

// Users (admin-only)
router.get('/users', requireRole(['admin']), async (req, res, next) => {
  try {
    const users = await AdminUser.find({}).sort({ createdAt: -1 }).select({ passwordHash: 0 }).lean();
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

const CreateAdminUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
  password: z.string().min(8)
});

router.post('/users', requireRole(['admin']), async (req, res, next) => {
  try {
    const parsed = CreateAdminUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });

    const { name, email, role, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await AdminUser.findOne({ email: normalizedEmail }).lean();
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const created = await AdminUser.create({ name, email: normalizedEmail, role, passwordHash });

    res.status(201).json({
      user: {
        _id: String(created._id),
        name: created.name,
        email: created.email,
        role: created.role,
        createdAt: created.createdAt
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get('/packages', requireRole(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const status = req.query.status;
    const q = {};
    if (status && ['published', 'draft', 'archived'].includes(String(status))) q.status = String(status);

    const packages = await Package.find(q).sort({ updatedAt: -1 }).lean();
    res.json({ packages });
  } catch (e) {
    next(e);
  }
});

const PackageUpsertSchema = z.object({
  title: z.string().min(2),
  type: z.enum(['hajj', 'umrah']),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  price: z.object({ currency: z.string().min(2), amount: z.number().min(0) }),
  durationDays: z.number().int().min(1).max(60),
  seatsAvailable: z.number().int().min(0).max(10000),
  badges: z.array(z.string()).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  itinerary: z.array(z.object({ day: z.number().int().min(1), title: z.string(), desc: z.string() })).optional(),
  gallery: z.array(z.string()).optional(),
  thumbnail: z.string().optional()
});

router.post('/packages', requireRole(['admin', 'editor']), async (req, res, next) => {
  try {
    const parsed = PackageUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });

    const created = await Package.create({
      ...parsed.data,
      status: parsed.data.status || 'draft'
    });

    res.status(201).json({ package: created });
  } catch (e) {
    next(e);
  }
});

router.patch('/packages/:id', requireRole(['admin', 'editor']), async (req, res, next) => {
  try {
    const parsed = PackageUpsertSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });

    const updated = await Package.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Package not found' });

    res.json({ package: updated });
  } catch (e) {
    next(e);
  }
});

router.delete('/packages/:id', requireRole(['admin', 'editor']), async (req, res, next) => {
  try {
    const updated = await Package.findByIdAndUpdate(req.params.id, { $set: { status: 'archived' } }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Package not found' });
    res.json({ package: updated });
  } catch (e) {
    next(e);
  }
});

router.get('/bookings', requireRole(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const status = req.query.status;
    const q = {};
    if (status && ['pending', 'confirmed', 'cancelled'].includes(String(status))) q.status = String(status);

    const bookings = await Booking.find(q).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ bookings });
  } catch (e) {
    next(e);
  }
});

router.patch('/bookings/:id', requireRole(['admin', 'editor']), async (req, res, next) => {
  try {
    const schema = z.object({ status: z.enum(['pending', 'confirmed', 'cancelled']).optional(), notes: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const updated = await Booking.findByIdAndUpdate(req.params.id, { $set: parsed.data }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Booking not found' });

    res.json({ booking: updated });
  } catch (e) {
    next(e);
  }
});

router.get('/settings', requireRole(['admin', 'editor', 'viewer']), async (req, res, next) => {
  try {
    const s = await Settings.findOne({ singletonKey: 'default' }).lean();
    res.json({ settings: s || null });
  } catch (e) {
    next(e);
  }
});

router.get('/media/cloudinary-signature', requireRole(['admin', 'editor']), async (req, res, next) => {
  try {
    const enabled = req.app.get('cloudinaryEnabled');
    if (!enabled) return res.status(400).json({ error: 'Cloudinary is not configured' });

    const folder = req.app.get('cloudinaryFolder');
    const sig = createSignedUpload({ folder });
    res.json(sig);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
