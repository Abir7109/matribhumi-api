const express = require('express');
const { z } = require('zod');

const Settings = require('../models/Settings');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

async function getSingleton() {
  const existing = await Settings.findOne({ singletonKey: 'default' }).lean();
  if (existing) return existing;
  const created = await Settings.create({ singletonKey: 'default' });
  return created.toObject();
}

router.get('/public', async (req, res, next) => {
  try {
    const s = await getSingleton();
    res.json({
      whatsappNumber: s.whatsappNumber,
      contact: s.contact,
      bn: s.bn,
      en: s.en
    });
  } catch (e) {
    next(e);
  }
});

const SettingsPatchSchema = z.object({
  whatsappNumber: z.string().optional(),
  contact: z
    .object({
      whatsapp: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional()
    })
    .optional(),
  bn: z
    .object({
      heroHeadline: z.string().optional(),
      heroSubtext: z.string().optional(),
      faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional()
    })
    .optional(),
  en: z
    .object({
      heroHeadline: z.string().optional(),
      heroSubtext: z.string().optional(),
      faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional()
    })
    .optional()
});

router.patch(
  '/',
  (req, res, next) => authRequired(req.app.get('jwtSecret'))(req, res, next),
  requireRole(['admin', 'editor']),
  async (req, res, next) => {
    try {
      const parsed = SettingsPatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

      await Settings.updateOne({ singletonKey: 'default' }, { $set: parsed.data }, { upsert: true });
      const s = await getSingleton();
      res.json({ settings: s });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
