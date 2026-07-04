const cloudinary = require('cloudinary').v2;

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary media storage configured successfully.');
} else {
  console.log('Cloudinary credentials missing. Media storage will fall back to local disk uploads (/uploads/).');
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured: isConfigured
};
