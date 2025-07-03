const Post = require('../models/Post');
const { uploadImage, deleteImage } = require('../utils/cloudinary');
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

    let imagePublicId = '';

    if (req.file) {
      try {
        console.log('Uploading image to Cloudinary...');
        const uploadResult = await uploadImage(req.file.path);
        console.log('Full Cloudinary upload result:', uploadResult);
        
        imagePublicId = uploadResult.public_id;
        console.log('Image Public ID:', imagePublicId);

        // Delete the temporary file after successful upload
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Error deleting temporary file:', err);
          } else {
            console.log('Temporary file deleted successfully');
          }
        });
      } catch (uploadError) {
        // Delete the temporary file if upload fails
        fs.unlink(req.file.path, () => {});
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image'
        });
      }
    }

    const postData = {
      userId: req.user.id,
      text: req.body.text,
      imagePublicId
    };

    console.log('Creating post with data:', postData);

    const post = new Post(postData);
    await post.save();
    
    // Explicitly call toJSON to include virtual fields
    const savedPost = post.toJSON();
    console.log('Post saved successfully:', savedPost);

    res.status(201).json({
      success: true,
      data: savedPost
    });

  } catch (error) {
    // Clean up temporary file if any error occurs
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Error in createPost:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating post: ' + error.message
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    // Get posts from last 10 days only
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const posts = await Post.find({
      createdAt: { $gte: tenDaysAgo }
    })
      .populate('userId', 'name email')
      .sort({ 
        likes: -1,  // Sort by number of likes first
        createdAt: -1 // Then by date
      })
      .exec();

      
    // Get older posts
    // const olderPosts = await Post.find({
    //     createdAt: { $lt: sevenDaysAgo }
    //   })
    //     .populate('userId', 'name email')
    //     .sort({ createdAt: -1 })
    //     .exec();
    // const allPosts = [...posts, ...olderPosts];
    //   const postsWithUrls = allPosts.map(post => post.toJSON());


    const postsWithUrls = posts.map(post => post.toJSON());

    //console.log('Retrieved posts from last 10 days:', posts.length);  // show the number of posts

    res.status(200).json({
      success: true,
      data: postsWithUrls
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching posts'
    });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if user has already liked the post
    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      // Unlike the post
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      data: {
        likes: post.likes.length,
        isLiked: !alreadyLiked
      }
    });
  } catch (error) {
    console.error('Error in likePost:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating like'
    });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .exec();

    const postsWithUrls = posts.map(post => post.toJSON());

    res.status(200).json({
      success: true,
      data: postsWithUrls
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user posts'
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }

    // Handle image update
    let imagePublicId = post.imagePublicId;

    if (req.file) {
      // Delete old image if exists
      if (post.imagePublicId) {
        try {
          await deleteImage(post.imagePublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      // Upload new image
      const uploadResult = await uploadImage(req.file.path);
      imagePublicId = uploadResult.public_id;

      // Delete temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    } else if (req.body.originalImageId === '') {
      // If originalImageId is empty string, user wants to remove image
      if (post.imagePublicId) {
        try {
          await deleteImage(post.imagePublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      imagePublicId = '';
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { 
        text: req.body.text,
        imagePublicId
      },
      { new: true }
    ).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating post'
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // Delete image from Cloudinary if exists
    if (post.imagePublicId) {
      try {
        await deleteImage(post.imagePublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting post'
    });
  }
}; 