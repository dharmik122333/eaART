const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

const createAlert = async (recipientId, senderId, type, message, referenceId) => {
  try {
    if (recipientId.toString() === senderId.toString()) return;
    if (isMongoConnected()) {
      await Notification.create({ recipientId, senderId, type, message, referenceId });
    } else {
      fallbackDb.createNotification({ recipientId, senderId, type, message, referenceId });
    }
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

// @desc    Add comment to post
// @route   POST /api/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const userId = req.user.id;

    if (!postId || !content) {
      return res.status(400).json({ success: false, error: 'Please provide post ID and content' });
    }

    if (isMongoConnected()) {
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      let comment = await Comment.create({ postId, content, authorId: userId });
      
      // Update comment count on post
      post.commentsCount += 1;
      await post.save();

      comment = await Comment.findById(comment._id).populate('authorId', 'name profileImage');

      // Trigger notification
      await createAlert(post.authorId, userId, 'comment', `${req.user.name} commented on your post: "${content.substring(0, 20)}..."`, postId);

      return res.status(201).json({ success: true, comment });
    } else {
      const post = fallbackDb.findPostById(postId);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      let comment = fallbackDb.createComment({ postId, content, authorId: userId });
      comment = {
        ...comment,
        authorId: { _id: req.user.id, name: req.user.name, profileImage: req.user.profileImage }
      };

      const authorId = post.authorId?._id || post.authorId;
      await createAlert(authorId, userId, 'comment', `${req.user.name} commented on your post.`, postId);

      return res.status(201).json({ success: true, comment });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get comments of a post
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    if (isMongoConnected()) {
      const comments = await Comment.find({ postId })
        .populate('authorId', 'name profileImage')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, count: comments.length, comments });
    } else {
      const comments = fallbackDb.findCommentsByPost(postId);
      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: comments.length, comments });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reply to a comment
// @route   POST /api/comments/:id/reply
// @access  Private
exports.addReply = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Reply content is required' });
    }

    const replyData = {
      authorId: userId,
      name: req.user.name,
      profileImage: req.user.profileImage,
      content,
      createdAt: new Date()
    };

    if (isMongoConnected()) {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });

      comment.replies.push(replyData);
      await comment.save();

      // Notify comment author
      await createAlert(comment.authorId, userId, 'comment', `${req.user.name} replied to your comment.`, comment.postId);

      return res.status(200).json({ success: true, comment });
    } else {
      const comment = fallbackDb.findCommentById(commentId);
      if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });

      comment.replies.push(replyData);
      fallbackDb.updateComment(commentId, { replies: comment.replies });

      const authorId = comment.authorId?._id || comment.authorId;
      await createAlert(authorId, userId, 'comment', `${req.user.name} replied to your comment.`, comment.postId);

      return res.status(200).json({ success: true, comment });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Like a comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    if (isMongoConnected()) {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
      const alreadyLiked = comment.likes.includes(userId);
      if (alreadyLiked) {
        comment.likes = comment.likes.filter(id => id.toString() !== userId);
      } else {
        comment.likes.push(userId);
      }
      await comment.save();
      return res.status(200).json({ success: true, likes: comment.likes });
    } else {
      const comment = fallbackDb.findCommentById(commentId);
      if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
      if (!comment.likes) comment.likes = [];
      const alreadyLiked = comment.likes.includes(userId);
      if (alreadyLiked) {
        comment.likes = comment.likes.filter(id => id !== userId);
      } else {
        comment.likes.push(userId);
      }
      fallbackDb.updateComment(commentId, { likes: comment.likes });
      return res.status(200).json({ success: true, likes: comment.likes });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    if (isMongoConnected()) {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
      if (comment.authorId.toString() !== userId && !req.user.isAdmin) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
      }
      const post = await Post.findById(comment.postId);
      if (post) {
        post.commentsCount = Math.max(0, post.commentsCount - 1);
        await post.save();
      }
      await comment.deleteOne();
      return res.status(200).json({ success: true, data: {} });
    } else {
      const comment = fallbackDb.findCommentById(commentId);
      if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
      const authId = comment.authorId?._id || comment.authorId;
      if (authId !== userId && !req.user.isAdmin) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
      }
      const post = fallbackDb.findPostById(comment.postId);
      if (post) {
        fallbackDb.updatePost(comment.postId, { commentsCount: Math.max(0, (post.commentsCount || 0) - 1) });
      }
      
      const dbPath = require('path').join(__dirname, '../data/db.json');
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      data.comments = data.comments.filter(c => c._id !== commentId);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

      return res.status(200).json({ success: true, data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
