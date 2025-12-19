const { getEnv } = require('../config/env');
const { connectMongo } = require('../db/mongo');
const Package = require('../models/Package');

async function main() {
  const env = getEnv();
  await connectMongo(env.mongoUri);

  const doc = await Package.create({
    title: 'Hajj Standard 1447H',
    type: 'hajj',
    status: 'published',
    price: { currency: 'BDT', amount: 5200 },
    durationDays: 12,
    seatsAvailable: 40,
    badges: ['Group', 'Family'],
    inclusions: ['Flight', 'Hotel 4★', 'Transport', 'Guidance'],
    exclusions: ['Personal expenses', 'Visa fees (if applicable)'],
    itinerary: [{ day: 1, title: 'Arrival', desc: 'Landing in Jeddah, transfer to Makkah.' }],
    gallery: [],
    thumbnail: ''
  });

  console.log('Seeded package id:', String(doc._id));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
