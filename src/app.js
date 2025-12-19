const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const eventsRoutes = require('./routes/events');
const { configureCloudinary } = require('./utils/cloudinary');
const { notFound, errorHandler } = require('./middleware/error');

function createApp({ corsOrigins, whatsappNumber, jwtSecret, cloudinary }) {
  const app = express();

  app.set('whatsappNumber', whatsappNumber);
  app.set('jwtSecret', jwtSecret);

  const cloudinaryEnabled = configureCloudinary({
    cloudName: cloudinary?.cloudName,
    apiKey: cloudinary?.apiKey,
    apiSecret: cloudinary?.apiSecret
  });
  app.set('cloudinaryEnabled', cloudinaryEnabled);
  app.set('cloudinaryFolder', cloudinary?.folder || 'matribhumi');

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        // allow non-browser clients (no origin) + allow-listed origins
        if (!origin) return cb(null, true);
        if (!corsOrigins || corsOrigins.length === 0) return cb(null, false);
        return cb(null, corsOrigins.includes(origin));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(morgan('tiny'));

  app.use('/', publicRoutes);
  app.use('/auth', authRoutes);
  app.use('/admin', adminRoutes);
  app.use('/settings', settingsRoutes);
  app.use('/events', eventsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
