const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');

const Event = require('../models/Event');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function hashIp(ip) {
  if (!ip) return undefined;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

const CreateEventSchema = z.object({
  type: z.enum(['page_view', 'package_view', 'booking_submit', 'whatsapp_open']),
  path: z.string().optional(),
  packageId: z.string().optional(),
  bookingId: z.string().optional()
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress;

    await Event.create({
      ...parsed.data,
      userAgent: String(req.headers['user-agent'] || ''),
      ipHash: hashIp(ip),
      createdAt: new Date()
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get(
  '/admin/summary',
  (req, res, next) => authRequired(req.app.get('jwtSecret'))(req, res, next),
  requireRole(['admin', 'editor', 'viewer']),
  async (req, res, next) => {
    try {
      const sinceHours = Math.min(Number(req.query.sinceHours || 168), 24 * 90);
      const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

      const rows = await Event.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      const summary = {
        page_view: 0,
        package_view: 0,
        booking_submit: 0,
        whatsapp_open: 0
      };

      for (const r of rows) summary[r._id] = r.count;

      res.json({ since: since.toISOString(), summary });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
