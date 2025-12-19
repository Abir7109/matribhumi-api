const argon2 = require('argon2');

const { getEnv } = require('../config/env');
const { connectMongo } = require('../db/mongo');
const AdminUser = require('../models/AdminUser');

async function main() {
  const env = getEnv();
  await connectMongo(env.mongoUri);

  const name = process.env.ADMIN_NAME || 'Admin';
  const email = String(process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await AdminUser.create({ name, email, role: 'admin', passwordHash });

  console.log('Seeded admin:', email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
