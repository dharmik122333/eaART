const Post = require('../models/Post');
const Like = require('../models/Like');
const Follower = require('../models/Follower');
const Bookmark = require('../models/Bookmark');
const Notification = require('../models/Notification');
const { uploadMedia } = require('../utils/cloudinaryHelper');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// Helper to notify
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

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { title, caption, category, tags, location, visibility, communityId, pollQuestion, pollOptions } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Please provide a title' });
    }

    let mediaUrls = [];
    let mediaType = 'text';

    if (req.files && req.files.length > 0) {
      // Support multiple files upload
      for (const file of req.files) {
        const uploadResult = await uploadMedia(file.path, 'posts');
        mediaUrls.push(uploadResult.url);
      }
      
      const ext = req.files[0].originalname.split('.').pop().toLowerCase();
      const videoExtensions = ['mp4', 'mkv', 'webm', 'avi'];
      const audioExtensions = ['mp3', 'wav', 'ogg', 'aac'];
      
      if (videoExtensions.includes(ext)) {
        mediaType = 'video';
      } else if (audioExtensions.includes(ext)) {
        mediaType = 'audio';
      } else {
        mediaType = mediaUrls.length > 1 ? 'multiple_images' : 'image';
      }
    }

    // Configure poll object
    let pollObj = null;
    if (pollQuestion && pollOptions) {
      const parsedOptions = Array.isArray(pollOptions) 
        ? pollOptions 
        : pollOptions.split(',').map(o => o.trim()).filter(Boolean);
      
      pollObj = {
        question: pollQuestion,
        options: parsedOptions.map(option => ({ text: option, votes: [] }))
      };
    }

    const tagsArray = Array.isArray(tags) 
      ? tags 
      : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

    const postData = {
      title,
      caption: caption || '',
      media: mediaUrls,
      mediaType,
      category: category || 'General',
      tags: tagsArray,
      location: location || '',
      visibility: visibility || 'public',
      communityId: communityId || null,
      poll: pollObj,
      authorId: req.user.id
    };

    let post;
    if (isMongoConnected()) {
      post = await Post.create(postData);
      post = await Post.findById(post._id).populate('authorId', 'name profileImage headline');
    } else {
      post = fallbackDb.createPost(postData);
    }

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get posts feed (paginated with filters for tabs: For You, Following, Trending, Hiring, Collaboration, Latest)
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const { tab, offset = 0, limit = 10, communityId } = req.query;
    const skip = Number(offset);
    const maxItems = Number(limit);
    const currentUserId = req.user.id;

    if (isMongoConnected()) {
      let query = { visibility: 'public' };
      let sort = { createdAt: -1 };

      if (communityId) {
        query.communityId = communityId;
      }

      // Handle specific tabs
      if (tab === 'following') {
        const following = await Follower.find({ followerId: currentUserId });
        const followingIds = following.map(f => f.followingId);
        // Include self posts in following feed
        followingIds.push(currentUserId);
        query.authorId = { $in: followingIds };
      } else if (tab === 'trending') {
        // Sort by likesCount desc
        sort = { likesCount: -1, createdAt: -1 };
      } else if (tab === 'hiring') {
        query.category = 'Hiring';
      } else if (tab === 'collaboration') {
        query.category = 'Collaboration';
      } else if (tab === 'forYou') {
        // Smart recommendation: Prioritize user interests/category
        if (req.user.category) {
          query.category = req.user.category;
        }
      }

      const posts = await Post.find(query)
        .populate('authorId', 'name profileImage headline industry')
        .populate('communityId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(maxItems);

      return res.status(200).json({ success: true, count: posts.length, posts });
    } else {
      // --- Fallback Mode ---
      let query = { visibility: 'public' };
      if (communityId) query.communityId = communityId;
      
      let posts = fallbackDb.findPosts(query);

      if (tab === 'following') {
        const following = fallbackDb.findFollowers({ followerId: currentUserId });
        const followingIds = following.map(f => f.followingId);
        followingIds.push(currentUserId);
        posts = posts.filter(p => p.authorId && followingIds.includes(p.authorId._id || p.authorId));
      } else if (tab === 'trending') {
        posts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
      } else if (tab === 'hiring') {
        posts = posts.filter(p => p.category === 'Hiring');
      } else if (tab === 'collaboration') {
        posts = posts.filter(p => p.category === 'Collaboration');
      } else if (tab === 'forYou') {
        if (req.user.category) {
          posts = posts.filter(p => p.category === req.user.category);
        }
      } else {
        // Latest (default)
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      // Paginate offline list
      const paginatedPosts = posts.slice(skip, skip + maxItems);
      return res.status(200).json({ success: true, count: paginatedPosts.length, posts: paginatedPosts });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single post details
// @route   GET /api/posts/:id
// @access  Public
exports.getPostById = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const post = await Post.findById(req.params.id)
        .populate('authorId', 'name profileImage headline')
        .populate('communityId', 'name');
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      return res.status(200).json({ success: true, post });
    } else {
      const post = fallbackDb.findPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      return res.status(200).json({ success: true, post });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      const alreadyLiked = await Like.findOne({ postId, userId });
      if (alreadyLiked) {
        // Unlike post
        await Like.deleteOne({ _id: alreadyLiked._id });
        post.likesCount = Math.max(0, post.likesCount - 1);
        await post.save();
        return res.status(200).json({ success: true, liked: false, likesCount: post.likesCount });
      } else {
        // Like post
        await Like.create({ postId, userId });
        post.likesCount += 1;
        await post.save();

        // Trigger Notification alert
        await createAlert(post.authorId, userId, 'like', `${req.user.name} liked your post.`, postId);
        return res.status(200).json({ success: true, liked: true, likesCount: post.likesCount });
      }
    } else {
      // --- Fallback Mode ---
      const post = fallbackDb.findPostById(postId);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      const likes = fallbackDb.findLikes({ postId, userId });
      if (likes.length > 0) {
        fallbackDb.deleteLike(postId, userId);
        const updated = fallbackDb.findPostById(postId);
        return res.status(200).json({ success: true, liked: false, likesCount: updated.likesCount });
      } else {
        fallbackDb.createLike({ postId, userId });
        const updated = fallbackDb.findPostById(postId);
        const authorId = post.authorId?._id || post.authorId;
        await createAlert(authorId, userId, 'like', `${req.user.name} liked your post.`, postId);
        return res.status(200).json({ success: true, liked: true, likesCount: updated.likesCount });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bookmark a post
// @route   POST /api/posts/:id/bookmark
// @access  Private
exports.bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    if (isMongoConnected()) {
      const alreadyBookmarked = await Bookmark.findOne({ userId, postId });
      if (alreadyBookmarked) {
        await Bookmark.deleteOne({ _id: alreadyBookmarked._id });
        return res.status(200).json({ success: true, bookmarked: false });
      } else {
        await Bookmark.create({ userId, postId });
        return res.status(200).json({ success: true, bookmarked: true });
      }
    } else {
      const bookmarks = fallbackDb.findBookmarks(userId);
      const exists = bookmarks.some(b => b.postId && (b.postId._id === postId || b.postId === postId));
      
      if (exists) {
        fallbackDb.deleteBookmark(userId, postId);
        return res.status(200).json({ success: true, bookmarked: false });
      } else {
        fallbackDb.createBookmark({ userId, postId });
        return res.status(200).json({ success: true, bookmarked: true });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Vote in a poll option
// @route   POST /api/posts/:id/poll/vote
// @access  Private
exports.votePoll = async (req, res) => {
  try {
    const postId = req.params.id;
    const { optionId } = req.body;
    const userId = req.user.id;

    if (!optionId) {
      return res.status(400).json({ success: false, error: 'Please specify an option ID' });
    }

    if (isMongoConnected()) {
      const post = await Post.findById(postId);
      if (!post || !post.poll) return res.status(404).json({ success: false, error: 'Poll not found' });

      // Check if user already voted in this poll
      const hasVoted = post.poll.options.some(opt => opt.votes.includes(userId));
      if (hasVoted) {
        return res.status(400).json({ success: false, error: 'You have already voted in this poll' });
      }

      const option = post.poll.options.id(optionId);
      if (!option) return res.status(404).json({ success: false, error: 'Option not found' });

      option.votes.push(userId);
      await post.save();

      return res.status(200).json({ success: true, post });
    } else {
      const post = fallbackDb.findPostById(postId);
      if (!post || !post.poll) return res.status(404).json({ success: false, error: 'Poll not found' });

      // Check vote
      const hasVoted = post.poll.options.some(opt => opt.votes.includes(userId));
      if (hasVoted) {
        return res.status(400).json({ success: false, error: 'You have already voted in this poll' });
      }

      const option = post.poll.options.find(opt => opt._id === optionId || opt.id === optionId);
      if (!option) return res.status(404).json({ success: false, error: 'Option not found' });

      option.votes.push(userId);
      fallbackDb.updatePost(postId, { poll: post.poll });
      
      const updated = fallbackDb.findPostById(postId);
      return res.status(200).json({ success: true, post: updated });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      if (post.authorId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
      }

      await post.deleteOne();
      return res.status(200).json({ success: true, data: {} });
    } else {
      const post = fallbackDb.findPostById(req.params.id);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

      const authId = post.authorId?._id || post.authorId;
      if (authId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
      }

      fallbackDb.deletePost(req.params.id);
      return res.status(200).json({ success: true, data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
