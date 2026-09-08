const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary storage initialized successfully.');
} else {
  console.log('Cloudinary not configured; using local static storage fallback.');
}

const uploadToCloudinary = async (filePath, folder = 'teams-chat') => {
  if (!isCloudinaryConfigured()) {
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
};
