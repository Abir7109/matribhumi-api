const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function getEnv() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 8080),
    mongoUri: requireEnv('MONGO_URI'),
    corsOrigins: (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    // store as digits only; we normalize again before generating the wa.me link
    whatsappNumber: requireEnv('WHATSAPP_NUMBER').trim(),

    jwtSecret: requireEnv('JWT_SECRET').trim(),

    cloudinary: {
      cloudName: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
      apiKey: (process.env.CLOUDINARY_API_KEY || '').trim(),
      apiSecret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
      folder: (process.env.CLOUDINARY_FOLDER || '').trim() || 'matribhumi'
    }
  };
}

module.exports = { getEnv };
