const Post = require('../models/Post');
const { uploadImage, deleteImage } = require('../utils/cloudinary');
const fs = require('fs');
const Comment = require('../models/Comment');

exports.createPost = async (req, res) => {
  try {

    if (!req.user || !req.user.id) {
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
        const uploadResult = await uploadImage(req.file.path);
        
        imagePublicId = uploadResult.public_id;

        // Delete the temporary file after successful upload
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Error deleting temporary file:', err);
          } else {
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

    const post = new Post(postData);
    await post.save();
    
    // Explicitly call toJSON to include virtual fields
    const savedPost = post.toJSON();

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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    // The feed used to hide anything older than 30 days, so a quiet community
    // looked empty. Show everything, newest first, and paginate instead.
    const [posts, total] = await Promise.all([
      Post.find()
        .populate('userId', 'name email photo')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Post.countDocuments()
    ]);

    // One aggregate beats one countDocuments per post.
    const counts = await Comment.aggregate([
      { $match: { postId: { $in: posts.map(p => p._id) } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);
    const countByPost = new Map(counts.map(c => [String(c._id), c.count]));

    // isLiked was never sent, so the client had no way to know which posts the
    // viewer had already liked and every heart reset to empty on refresh.
    const viewerId = req.user?.id;

    const data = posts.map(post => {
      const postObj = post.toJSON();
      return {
        ...postObj,
        likesCount: post.likes.length,
        commentsCount: countByPost.get(String(post._id)) || 0,
        isLiked: viewerId
          ? post.likes.some(id => id.toString() === viewerId)
          : false
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total
      }
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
    const alreadyLiked = post.likes.some(id => id.toString() === userId);

    // $addToSet / $pull rather than read-modify-write: double-tapping the heart
    // used to be able to record the same user twice and inflate the count.
    const updated = await Post.findByIdAndUpdate(
      postId,
      alreadyLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        likes: updated.likes.length,
        likesCount: updated.likes.length,
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
      .populate('userId', 'name email photo')
      .exec();

    const counts = await Comment.aggregate([
      { $match: { postId: { $in: posts.map(p => p._id) } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);
    const countByPost = new Map(counts.map(c => [String(c._id), c.count]));

    const viewerId = req.user?.id;

    const postsWithUrls = posts.map(post => {
      const postObj = post.toJSON();
      return {
        ...postObj,
        likesCount: post.likes.length,
        commentsCount: countByPost.get(String(post._id)) || 0,
        isLiked: viewerId
          ? post.likes.some(id => id.toString() === viewerId)
          : false
      };
    });

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

    // Comments used to survive their post and accumulate as orphans.
    await Comment.deleteMany({ postId: req.params.postId });
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

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('userId', 'name email')
      .populate('parentId')
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching comments'
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Comment cannot be empty'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Comment cannot exceed 1000 characters'
      });
    }

    // Without this a comment could be attached to a deleted (or made-up) post
    // and would then be invisible to everyone.
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Replies are one level deep: replying to a reply attaches to its parent.
    let parentId = req.body.parentId || null;
    if (parentId) {
      const parent = await Comment.findById(parentId);
      if (!parent || parent.postId.toString() !== req.params.postId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot reply to that comment'
        });
      }
      parentId = parent.parentId || parent._id;
    }

    const comment = new Comment({
      postId: req.params.postId,
      userId: req.user.id,
      text,
      parentId
    });

    await comment.save();
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email')
      .populate('parentId');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding comment'
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Get the post to check if the user is the post owner
    const post = await Post.findById(comment.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Associated post not found'
      });
    }

    // Allow deletion if user is either the comment owner or the post owner
    const isCommentOwner = comment.userId.toString() === req.user.id;
    const isPostOwner = post.userId.toString() === req.user.id;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentId: comment._id });
    
    // Delete the comment itself
    await Comment.findByIdAndDelete(comment._id);

    // Update the comments count for the post
    const commentsCount = await Comment.countDocuments({ postId: comment.postId });
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      commentsCount
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting comment'
    });
  }
}; 