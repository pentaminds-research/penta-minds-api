const cloudinary = require('cloudinary').v2;

const assertCloudinaryEnv = () => {
  const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing Cloudinary environment variables: ${missing.join(', ')}`);
  }
};

assertCloudinaryEnv();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

module.exports = {
  cloudinary,
  assertCloudinaryEnv
};
