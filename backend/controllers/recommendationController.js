const Post = require('../models/Post');
const Follower = require('../models/Follower');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Get smart "For You" personalized recommendations
// @route   GET /api/recommendations/posts
// @access  Private
exports.getRecommendedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const userCategory = req.user.category || '';
    const userSkills = req.user.skills || [];

    let followedUserIds = [];
    let allPosts = [];

    // 1. Fetch user's following list to prioritize their posts
    if (isMongoConnected()) {
      const follows = await Follower.find({ followerId: userId });
      followedUserIds = follows.map(f => f.followingId.toString());

      // Fetch recent public posts
      allPosts = await Post.find({ visibility: 'public' })
        .populate('authorId', 'name profileImage headline skills category')
        .populate('communityId', 'name')
        .sort({ createdAt: -1 })
        .limit(100); // look at recent 100 posts
    } else {
      const follows = fallbackDb.findFollowers({ followerId: userId });
      followedUserIds = follows.map(f => f.followingId.toString());

      allPosts = fallbackDb.findPosts({ visibility: 'public' });
      allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      allPosts = allPosts.slice(0, 100);
    }

    // 2. Score posts dynamically
    const scoredPosts = allPosts.map(post => {
      let score = 0;
      const author = post.authorId;

      if (!author) return { post, score: -99 };

      const authorIdStr = (author._id || author).toString();

      // Principle A: Is author followed by this user?
      if (followedUserIds.includes(authorIdStr)) {
        score += 15; // High priority for followed creators
      }

      // Principle B: Category match
      if (userCategory && post.category && post.category.toLowerCase() === userCategory.toLowerCase()) {
        score += 10;
      }
      if (userCategory && author.category && author.category.toLowerCase() === userCategory.toLowerCase()) {
        score += 5;
      }

      // Principle C: Skills tag intersections
      if (userSkills.length > 0 && post.tags && post.tags.length > 0) {
        const matchingTags = post.tags.filter(tag => 
          userSkills.some(skill => skill.toLowerCase() === tag.toLowerCase())
        );
        score += matchingTags.length * 4; // Add 4 points per matching tag/skill
      }

      // Principle D: Overall popularity
      const likes = post.likesCount || 0;
      const comments = post.commentsCount || 0;
      score += (likes * 0.5) + (comments * 1.5);

      // Principle E: Recency decay (give a slight boost to brand new posts)
      const postAgeMs = Date.now() - new Date(post.createdAt).getTime();
      const postAgeHours = postAgeMs / (1000 * 60 * 60);
      if (postAgeHours < 24) {
        score += 5; // Fresh content boost
      }

      return { post, score };
    });

    // 3. Sort by score descending and return
    scoredPosts.sort((a, b) => b.score - a.score);
    const finalPosts = scoredPosts
      .filter(item => item.score > -99)
      .map(item => item.post);

    res.status(200).json({
      success: true,
      count: finalPosts.length,
      posts: finalPosts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
