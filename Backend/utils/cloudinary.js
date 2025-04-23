const cloudinary = require('cloudinary').v2;

// Add error handling for configuration
try {
  cloudinary.config({
    cloud_name: 'dfm7lhrwz',
    api_key: '831551343234744',
    api_secret: '2pjCvioA-fZ7oN2B8LlIKn9BjR0',
    secure: true
  });
  
  // Test the configuration
  cloudinary.api.ping()
    .then(result => console.log('Cloudinary configuration is valid'))
    .catch(error => console.error('Cloudinary configuration error:', error));
} catch (error) {
  console.error('Error configuring Cloudinary:', error);
}

// Upload image to Cloudinary
const uploadImage = async (imagePath) => {
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
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Cloudinary
const deleteImage = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
}; 