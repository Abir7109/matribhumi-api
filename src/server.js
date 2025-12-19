const { getEnv } = require('./config/env');
const { connectMongo } = require('./db/mongo');
const { createApp } = require('./app');

async function main() {
  const env = getEnv();

  await connectMongo(env.mongoUri);

  const app = createApp({
    corsOrigins: env.corsOrigins,
    whatsappNumber: env.whatsappNumber,
    jwtSecret: env.jwtSecret,
    cloudinary: env.cloudinary
  });

  app.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
