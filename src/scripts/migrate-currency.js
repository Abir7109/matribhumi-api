const { getEnv } = require('../config/env');
const { connectMongo } = require('../db/mongo');
const Package = require('../models/Package');

async function main() {
  const env = getEnv();
  await connectMongo(env.mongoUri);

  const from = (process.env.CURRENCY_FROM || 'SAR').trim();
  const to = (process.env.CURRENCY_TO || 'BDT').trim();

  const res = await Package.updateMany({ 'price.currency': from }, { $set: { 'price.currency': to } });

  console.log(`Currency migration complete: ${from} -> ${to}`);
  // mongoose 8 returns modifiedCount
  console.log(`Matched: ${res.matchedCount ?? res.n ?? 0}`);
  console.log(`Modified: ${res.modifiedCount ?? res.nModified ?? 0}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
