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

router.get(
  '/admin/report',
  (req, res, next) => authRequired(req.app.get('jwtSecret'))(req, res, next),
  requireRole(['admin', 'editor', 'viewer']),
  async (req, res, next) => {
    try {
      const sinceHours = Math.min(Number(req.query.sinceHours || 168), 24 * 90);
      const bucket = String(req.query.bucket || '').toLowerCase() === 'hour' ? 'hour' : 'day';
      const limit = Math.min(Number(req.query.limit || 10), 50);

      const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

      // Summary counts
      const summaryRows = await Event.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      const summary = {
        page_view: 0,
        package_view: 0,
        booking_submit: 0,
        whatsapp_open: 0
      };

      for (const r of summaryRows) summary[r._id] = r.count;

      // Unique visitors (by hashed IP)
      const uniqueVisitors = (await Event.distinct('ipHash', { createdAt: { $gte: since }, ipHash: { $ne: null } })).length;

      // Timeseries
      const fmt = bucket === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d';
      const seriesRows = await Event.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              bucket: { $dateToString: { date: '$createdAt', format: fmt, timezone: 'UTC' } },
              type: '$type'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.bucket': 1 } }
      ]);

      const seriesMap = new Map();
      for (const r of seriesRows) {
        const key = r._id.bucket;
        const type = r._id.type;
        if (!seriesMap.has(key)) {
          seriesMap.set(key, { bucket: key, page_view: 0, package_view: 0, booking_submit: 0, whatsapp_open: 0 });
        }
        seriesMap.get(key)[type] = r.count;
      }
      const series = Array.from(seriesMap.values());

      // Top pages
      const topPages = await Event.aggregate([
        { $match: { createdAt: { $gte: since }, type: 'page_view', path: { $exists: true, $ne: '' } } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      // Top packages
      const topPackages = await Event.aggregate([
        { $match: { createdAt: { $gte: since }, type: 'package_view', packageId: { $exists: true, $ne: null } } },
        { $group: { _id: '$packageId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      res.json({
        since: since.toISOString(),
        sinceHours,
        bucket,
        summary,
        uniqueVisitors,
        series,
        topPages: topPages.map((r) => ({ path: r._id, count: r.count })),
        topPackages: topPackages.map((r) => ({ packageId: String(r._id), count: r.count }))
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
