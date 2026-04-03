const mongoose = require('mongoose');

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
    return `https://res.cloudinary.com/dfm7lhrwz/image/upload/${this.imagePublicId}`;
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