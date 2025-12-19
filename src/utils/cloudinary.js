const { v2: cloudinary } = require('cloudinary');

function configureCloudinary({ cloudName, apiKey, apiSecret }) {
  if (!cloudName || !apiKey || !apiSecret) return false;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return true;
}

function createSignedUpload({ folder }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder: folder || undefined
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret);

  return {
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
    timestamp,
    folder: folder || undefined,
    signature
  };
}

module.exports = { configureCloudinary, createSignedUpload };
