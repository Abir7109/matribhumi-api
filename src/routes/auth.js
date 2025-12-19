const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const AdminUser = require('../models/AdminUser');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const { email, password } = parsed.data;
    const user = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLoginAt = new Date();
    await user.save();

    const jwtSecret = req.app.get('jwtSecret');
    const token = jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        role: user.role,
        name: user.name
      },
      jwtSecret,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
