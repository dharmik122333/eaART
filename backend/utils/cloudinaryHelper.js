const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Uploads a local file to Cloudinary, or serves it locally if Cloudinary is not configured.
 * Automatically deletes the temp file from backend/uploads if uploaded to Cloudinary.
 * 
 * @param {string} filePath - Absolute path to local file
 * @param {string} folder - Target Cloudinary folder name (e.g. 'portfolios', 'profiles')
 * @returns {Promise<object>} { url: string, public_id: string, isCloudinary: boolean }
 */
const uploadMedia = async (filePath, folder = 'project_earth') => {
  if (!filePath) {
    return { url: null, public_id: null, isCloudinary: false };
  }

  const fileName = path.basename(filePath);

  if (isCloudinaryConfigured) {
    try {
      // Determine file type (image or video)
      const isVideo = filePath.match(/\.(mp4|mkv|webm|avi)$/i);
      const resourceType = isVideo ? 'video' : 'auto';

      console.log(`Uploading to Cloudinary [${resourceType}]: ${fileName}...`);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `project_earth/${folder}`,
        resource_type: resourceType,
      });

      // Safely delete local file since it's uploaded to Cloudinary
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete temporary local file: ${err.message}`);
      }

      return {
        url: result.secure_url,
        public_id: result.public_id,
        isCloudinary: true
      };
    } catch (error) {
      console.error(`Cloudinary upload failed: ${error.message}. Serving locally.`);
      // Fallback: keep local file and return local URL
      return {
        url: `/uploads/${fileName}`,
        public_id: null,
        isCloudinary: false
      };
    }
  } else {
    // Return the local static file path (will be hosted at http://localhost:5000/uploads/...)
    console.log(`Cloudinary not configured. Serving local upload: /uploads/${fileName}`);
    return {
      url: `/uploads/${fileName}`,
      public_id: null,
      isCloudinary: false
    };
  }
};

module.exports = {
  uploadMedia
};
