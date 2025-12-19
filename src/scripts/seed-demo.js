const { getEnv } = require('../config/env');
const { connectMongo } = require('../db/mongo');
const Package = require('../models/Package');

async function main() {
  const env = getEnv();
  await connectMongo(env.mongoUri);

  const docs = [
    {
      title: 'Hajj Economy 1447H',
      type: 'hajj',
      status: 'published',
      price: { currency: 'BDT', amount: 4200 },
      durationDays: 10,
      seatsAvailable: 12,
      badges: ['Group'],
      inclusions: ['Flight', 'Hotel 3★', 'Transport', 'Group Guidance', 'Ziyarat (selected)'],
      exclusions: ['Personal expenses'],
      itinerary: [
        { day: 1, title: 'Arrival', desc: 'Arrival and transfer to hotel.' },
        { day: 2, title: 'Orientation', desc: 'Group briefing and document verification.' }
      ],
      gallery: [],
      thumbnail: ''
    },
    {
      title: 'Hajj Standard 1447H',
      type: 'hajj',
      status: 'published',
      price: { currency: 'BDT', amount: 5200 },
      durationDays: 12,
      seatsAvailable: 40,
      badges: ['Family', 'Most popular'],
      inclusions: ['Flight', 'Hotel 4★', 'Transport', 'Guidance', '24/7 Support'],
      exclusions: ['Personal expenses', 'Visa fees (if applicable)'],
      itinerary: [
        { day: 1, title: 'Arrival', desc: 'Landing in Jeddah, transfer to Makkah.' },
        { day: 3, title: 'Ziyarat', desc: 'Ziyarat locations (as applicable).' }
      ],
      gallery: [],
      thumbnail: ''
    },
    {
      title: 'Umrah Premium (Ramadan)',
      type: 'umrah',
      status: 'published',
      price: { currency: 'BDT', amount: 6900 },
      durationDays: 8,
      seatsAvailable: 6,
      badges: ['Limited seats'],
      inclusions: ['Flight', 'Hotel 5★', 'VIP Transport', 'Scholar-led Guidance', 'Priority Support'],
      exclusions: ['Personal expenses'],
      itinerary: [
        { day: 1, title: 'Arrival', desc: 'Arrival and hotel check-in.' },
        { day: 2, title: 'Umrah', desc: 'Guided Umrah performance.' }
      ],
      gallery: [],
      thumbnail: ''
    }
  ];

  const inserted = [];

  for (const d of docs) {
    const existing = await Package.findOne({ title: d.title }).lean();
    if (existing) {
      inserted.push({ title: d.title, id: String(existing._id), status: 'exists' });
      continue;
    }
    const created = await Package.create(d);
    inserted.push({ title: d.title, id: String(created._id), status: 'created' });
  }

  console.log('Demo packages:');
  for (const x of inserted) {
    console.log(`- ${x.status}: ${x.title} (${x.id})`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
