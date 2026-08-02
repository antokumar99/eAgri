const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// These were hardcoded here, including the API secret, in a file committed to a
// public repository. Cloudinary credentials allow uploading to and deleting
// from the account, so they belong in Backend/.env like every other secret.
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

const isConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  cloudinary.api
    .ping()
    .then(() => console.log('Cloudinary configuration is valid'))
    .catch((error) =>
      console.error('Cloudinary configuration error:', error.message)
    );
} else {
  console.warn(
    'Cloudinary is not configured — image uploads will fail. ' +
      'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Backend/.env'
  );
}

/** Public cloud name, used to build image URLs. */
const cloudName = CLOUDINARY_CLOUD_NAME || '';

// Upload image to Cloudinary
const uploadImage = async (imagePath) => {
  if (!isConfigured) {
    throw new Error(
      'Image upload is unavailable: Cloudinary credentials are not configured.'
    );
  }

  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'eAgri',
      quality: 'auto', // Automatically optimize the image quality
      fetch_format: 'auto', // Automatically choose the best format
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' }, // Limit maximum dimensions
        { quality: 'auto:good' } // Optimize quality
      ]
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading image:', error.message);
    throw error;
  }
};

// Delete image from Cloudinary
const deleteImage = async (public_id) => {
  if (!isConfigured) return;

  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Error deleting image:', error.message);
    throw error;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  cloudName,
  isConfigured,
};
