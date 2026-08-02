const mongoose = require('mongoose');
const { cloudName } = require('../utils/cloudinary');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String,
    default: ''
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for imageUrl
postSchema.virtual('imageUrl').get(function() {
  if (this.imagePublicId) {
    // Cloud name comes from config rather than being baked in, so pointing the
    // project at a different Cloudinary account does not silently keep serving
    // images from the old one.
    return `https://res.cloudinary.com/${cloudName}/image/upload/${this.imagePublicId}`;
  }
  return '';
});

// Add virtual for comments count
postSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
  count: true
});

module.exports = mongoose.model('Post', postSchema); 