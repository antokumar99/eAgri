const Post = require('../models/Post');
const { uploadImage } = require('../utils/cloudinary');
const fs = require('fs');

exports.createPost = async (req, res) => {
  try {
    console.log('Creating post with body:', req.body);
    console.log('File received:', req.file);
    console.log('User from request:', req.user);
    console.log('Headers:', req.headers);

    if (!req.user || !req.user.id) {
      console.log('No user found in request');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!req.body.text) {
      return res.status(400).json({
        success: false,
        error: 'Post text is required'
      });
    }

    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
      try {
        console.log('Uploading image to Cloudinary...');
        const uploadResult = await uploadImage(req.file.path);
        console.log('Cloudinary upload result:', uploadResult);
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image'
        });
      }
    }

    const post = new Post({
      userId: req.user.id,
      text: req.body.text,
      imageUrl,
      imagePublicId
    });

    await post.save();
    console.log('Post saved successfully:', post);

    res.status(201).json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating post: ' + error.message
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .exec();

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching posts'
    });
  }
}; 