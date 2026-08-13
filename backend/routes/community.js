// PoleSafe Community Routes
// Safety Board, Blog, Feature Voting, User Reputation

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');
// optionalAuth: attach user if token present, don't reject if missing
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'polesafe-dev-secret-change-in-production');
    req.user = decoded;
  } catch (e) { /* token invalid, continue without user */ }
  next();
};
const { CommunityPost, Comment, BlogPost, FeatureSuggestion, UserReputation } = require('../models/Community');
const aiService = require('../services/aiService');

// ============================================================
// Middleware — Check user is not muted/banned
// ============================================================
async function checkReputation(req, res, next) {
  try {
    const rep = await UserReputation.findOne({ userId: req.user.id });
    if (rep) {
      if (rep.banned) {
        return res.status(403).json({ error: 'Your account has been suspended from community features.' });
      }
      if (rep.quietUntil && rep.quietUntil > new Date()) {
        return res.status(429).json({ 
          error: 'You are in a quiet period until ' + rep.quietUntil.toISOString() + '. You can read but not post.'
        });
      }
    }
    next();
  } catch (e) {
    next(e);
  }
}

// ============================================================
// Helper — Get display name for a user
// ============================================================
function getDisplayName(user) {
  const roleLabels = {
    parent: 'Parent',
    driver: 'Driver', 
    school: 'School Staff',
    rider: 'Community Rider'
  };
  const role = roleLabels[user.role] || 'User';
  const location = user.location || (user.schoolName ? user.schoolName : 'Uganda');
  return `${role} · ${location}`;
}

// ============================================================
// Helper — Hamna moderation for community posts
// ============================================================
async function moderateContent(content, type = 'post') {
  try {
    const result = await aiService.moderateCommunityContent(content, type);
    return result;
  } catch (e) {
    console.error('⚠️ Hamna moderation failed, defaulting to approved:', e.message);
    return { status: 'approved', reason: '', category: 'general' };
  }
}

// ============================================================
// GET /api/community/posts — List Safety Board posts
// ============================================================
router.get('/posts', optionalAuth, async (req, res, next) => {
  try {
    const { category, sort = 'latest', page = 1, limit = 20 } = req.query;
    const query = { moderationStatus: 'approved' };
    
    if (category && category !== 'all') query.category = category;
    
    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { upvoteCount: -1, createdAt: -1 };
    if (sort === 'trending') sortOption = { commentCount: -1, createdAt: -1 };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await CommunityPost.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await CommunityPost.countDocuments(query);
    
    // If user is logged in, include their vote status
    const userId = req.user?.id;
    const enriched = posts.map(p => ({
      ...p,
      userVoted: userId ? (p.upvotes || []).some(id => id.toString() === userId) : false,
      userDownvoted: userId ? (p.downvotes || []).some(id => id.toString() === userId) : false,
      upvoteCount: (p.upvotes || []).length,
      downvoteCount: (p.downvotes || []).length,
    }));
    
    res.json({ posts: enriched, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// POST /api/community/posts — Create a Safety Board post
// ============================================================
router.post('/posts', authMiddleware, checkReputation, async (req, res, next) => {
  try {
    const { title, body, type = 'safety_concern' } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    // Hamna moderates the content
    const modResult = await moderateContent({ title, body, role: req.user.role });
    
    const post = await CommunityPost.create({
      userId: req.user.id,
      userRole: req.user.role,
      displayName: getDisplayName(req.user),
      location: req.user.location || 'Uganda',
      type,
      title,
      body,
      category: modResult.category || 'general',
      moderationStatus: modResult.status,
      moderationReason: modResult.reason || '',
    });
    
    // Update user reputation
    await UserReputation.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { helpfulPosts: 1 }, $setOnInsert: { userId: req.user.id } },
      { upsert: true }
    );
    
    res.status(201).json({ 
      post, 
      moderationNote: modResult.status === 'pending' ? 'Your post is being reviewed by Hamna.' : undefined
    });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// POST /api/community/posts/:id/upvote — Vote on a post
// ============================================================
router.post('/posts/:id/vote', authMiddleware, async (req, res, next) => {
  try {
    const { vote = 'up' } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;
    
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const alreadyUpvoted = post.upvotes.some(id => id.toString() === userId);
    const alreadyDownvoted = post.downvotes.some(id => id.toString() === userId);
    
    if (vote === 'up') {
      if (alreadyUpvoted) {
        // Remove vote (toggle)
        post.upvotes.pull(userId);
      } else {
        post.upvotes.push(userId);
        if (alreadyDownvoted) post.downvotes.pull(userId);
      }
    } else {
      if (alreadyDownvoted) {
        post.downvotes.pull(userId);
      } else {
        post.downvotes.push(userId);
        if (alreadyUpvoted) post.upvotes.pull(userId);
      }
    }
    
    await post.save();
    res.json({ 
      upvoteCount: post.upvotes.length, 
      downvoteCount: post.downvotes.length,
      userVoted: vote === 'up' ? !alreadyUpvoted : false,
      userDownvoted: vote === 'down' ? !alreadyDownvoted : false
    });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// GET /api/community/posts/:id/comments — Get comments
// ============================================================
router.get('/posts/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    const comments = await Comment.find({ 
      postId: req.params.id, 
      moderationStatus: 'approved' 
    }).sort({ createdAt: 1 }).lean();
    
    const userId = req.user?.id;
    const enriched = comments.map(c => ({
      ...c,
      upvoteCount: (c.upvotes || []).length,
      userVoted: userId ? (c.upvotes || []).some(id => id.toString() === userId) : false,
    }));
    
    res.json({ comments: enriched });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// POST /api/community/posts/:id/comments — Add comment
// ============================================================
router.post('/posts/:id/comments', authMiddleware, checkReputation, async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Comment body is required' });
    
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.locked) return res.status(403).json({ error: 'This discussion has been locked.' });
    
    // Moderate comment
    const modResult = await moderateContent(body, 'comment');
    
    const comment = await Comment.create({
      postId: post._id,
      userId: req.user.id,
      userRole: req.user.role,
      displayName: getDisplayName(req.user),
      location: req.user.location || 'Uganda',
      body,
      moderationStatus: modResult.status,
      moderationReason: modResult.reason || '',
    });
    
    post.commentCount += 1;
    await post.save();
    
    await UserReputation.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { helpfulComments: 1 }, $setOnInsert: { userId: req.user.id } },
      { upsert: true }
    );
    
    res.status(201).json({ comment });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// GET /api/community/blog — List blog posts
// ============================================================
router.get('/blog', optionalAuth, async (req, res, next) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = { published: true, moderationStatus: 'approved' };
    
    if (category && category !== 'all') query.category = category;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await BlogPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-body') // Don't send full body in list
      .lean();
    
    const total = await BlogPost.countDocuments(query);
    
    res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// GET /api/community/blog/:id — Get single blog post
// ============================================================
router.get('/blog/:id', optionalAuth, async (req, res, next) => {
  try {
    const postScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user?.id || 'community', ['community:blog']);
    const post = await BlogPost.findById(postScope.tenantScopedQuery.id);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    
    post.viewCount += 1;
    await post.save();
    
    res.json({ post });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// POST /api/community/blog — Create a blog post
// ============================================================
router.post('/blog', authMiddleware, checkReputation, async (req, res, next) => {
  try {
    const { title, body, excerpt, category = 'community_voices', tags = [] } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    // Moderate blog content
    const modResult = await moderateContent({ title, body }, 'blog');
    
    // Detect language
    const languageResult = await aiService.detectLanguage(body).catch(() => ({ language: 'en' }));
    
    const post = await BlogPost.create({
      userId: req.user.id,
      userRole: req.user.role,
      authorName: req.body.authorName || getDisplayName(req.user),
      authorBio: req.body.authorBio || '',
      title,
      body,
      excerpt: excerpt || body.substring(0, 250),
      category,
      tags,
      moderationStatus: modResult.status,
      moderationReason: modResult.reason || '',
      originalLanguage: languageResult.language || 'en',
      published: modResult.status === 'approved',
    });
    
    await UserReputation.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { blogPostsPublished: 1 }, $setOnInsert: { userId: req.user.id } },
      { upsert: true }
    );
    
    res.status(201).json({ 
      post, 
      note: modResult.status === 'pending' ? 'Your post is being reviewed and will be published once approved.' : undefined
    });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// GET /api/community/features — List feature suggestions
// ============================================================
router.get('/features', optionalAuth, async (req, res, next) => {
  try {
    const { category, status = 'suggested', page = 1, limit = 20 } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (status !== 'all') query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const features = await FeatureSuggestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await FeatureSuggestion.countDocuments(query);
    
    const userId = req.user?.id;
    const enriched = features.map(f => ({
      ...f,
      userVoted: userId ? (f.upvotes || []).some(id => id.toString() === userId) : false,
      upvoteCount: (f.upvotes || []).length,
      downvoteCount: (f.downvotes || []).length,
    }));
    
    res.json({ features: enriched, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// POST /api/community/features — Suggest a feature
// ============================================================
router.post('/features', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, category = 'other' } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Get user's vote weight from reputation
    const rep = await UserReputation.findOne({ userId: req.user.id });
    const voteWeight = rep?.voteWeight || 1;
    
    // Hamna analyzes the feature
    const analysis = await aiService.analyzeFeatureSuggestion({ title, description }).catch(() => '');
    
    const feature = await FeatureSuggestion.create({
      userId: req.user.id,
      userRole: req.user.role,
      title,
      description,
      category,
      voteWeight,
      hamnaAnalysis: analysis,
      // Creator automatically upvotes
      upvotes: [req.user.id],
    });
    
    res.status(201).json({ feature, hamnaAnalysis: analysis || undefined });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// POST /api/community/features/:id/vote — Vote on a feature
// ============================================================
router.post('/features/:id/vote', authMiddleware, async (req, res, next) => {
  try {
    const { vote = 'up' } = req.body;
    const featureScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user.id, ['community:feature']);
    const feature = await FeatureSuggestion.findById(featureScope.tenantScopedQuery.id);
    if (!feature) return res.status(404).json({ error: 'Feature not found' });
    
    const userId = req.user.id;
    const alreadyUpvoted = feature.upvotes.some(id => id.toString() === userId);
    
    if (vote === 'up') {
      if (alreadyUpvoted) {
        feature.upvotes.pull(userId);
      } else {
        feature.upvotes.push(userId);
        if (feature.downvotes.some(id => id.toString() === userId)) {
          feature.downvotes.pull(userId);
        }
      }
    }
    
    await feature.save();
    res.json({ upvoteCount: feature.upvotes.length });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// GET /api/community/reputation — Get user's reputation
// ============================================================
router.get('/reputation', authMiddleware, async (req, res, next) => {
  try {
    let rep = await UserReputation.findOne({ userId: req.user.id });
    if (!rep) {
      rep = await UserReputation.create({ userId: req.user.id });
    }
    res.json({ reputation: rep });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// GET /api/community/categories — List available categories
// ============================================================
router.get('/categories', (req, res) => {
  res.json({
    safetyCategories: [
      { id: 'route_safety', label: '🚸 Route Safety', icon: '🚸' },
      { id: 'driver_behavior', label: '🚗 Driver Behavior', icon: '🚗' },
      { id: 'school_policy', label: '🏫 School Policy', icon: '🏫' },
      { id: 'pickup_delay', label: '⏰ Pickup Delays', icon: '⏰' },
      { id: 'general', label: '💬 General Discussion', icon: '💬' },
      { id: 'other', label: '📌 Other', icon: '📌' },
    ],
    blogCategories: [
      { id: 'parenting', label: '👨‍👩‍👧 Parenting Tips', icon: '👨‍👩‍👧' },
      { id: 'safety_tips', label: '🛡️ Safety Tips', icon: '🛡️' },
      { id: 'teaching', label: '📚 Teaching', icon: '📚' },
      { id: 'polesafe_updates', label: '📢 PoleSafe Updates', icon: '📢' },
      { id: 'community_voices', label: '🗣️ Community Voices', icon: '🗣️' },
      { id: 'other', label: '📌 Other', icon: '📌' },
    ],
    featureCategories: [
      { id: 'safety', label: '🛡️ Safety', icon: '🛡️' },
      { id: 'tracking', label: '📍 Tracking', icon: '📍' },
      { id: 'payments', label: '💰 Payments', icon: '💰' },
      { id: 'communication', label: '📞 Communication', icon: '📞' },
      { id: 'rides', label: '🚗 Ride Services', icon: '🚗' },
      { id: 'other', label: '📌 Other', icon: '📌' },
    ],
  });
});

// ============================================================
// Admin — Get flagged content for review
// ============================================================
router.get('/admin/flagged', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'school') {
      return res.status(403).json({ error: 'Only administrators can review flagged content' });
    }
    
    const flaggedPosts = await CommunityPost.find({ 
      moderationStatus: { $in: ['pending', 'flagged'] } 
    }).sort({ createdAt: 1 }).limit(20).lean();
    
    const flaggedComments = await Comment.find({ 
      moderationStatus: { $in: ['pending', 'flagged'] } 
    }).sort({ createdAt: 1 }).limit(20).lean();
    
    const flaggedBlogs = await BlogPost.find({ 
      moderationStatus: { $in: ['pending', 'flagged'] } 
    }).sort({ createdAt: 1 }).limit(20).lean();
    
    res.json({ flaggedPosts, flaggedComments, flaggedBlogs });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// Admin — Approve/reject flagged content
// ============================================================
router.patch('/admin/moderate/:type/:id', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'school') {
      return res.status(403).json({ error: 'Only administrators can moderate' });
    }
    
    const { type, id } = req.params;
    const { action, reason } = req.body;
    
    let Model;
    if (type === 'post') Model = CommunityPost;
    else if (type === 'comment') Model = Comment;
    else if (type === 'blog') Model = BlogPost;
    else return res.status(400).json({ error: 'Invalid content type' });
    
    const update = { moderationStatus: action === 'approve' ? 'approved' : 'rejected' };
    if (reason) update.moderationReason = reason;
    if (action === 'approve' && type === 'blog') update.published = true;
    
    const doc = await Model.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Content not found' });
    
    // If rejected, update user's strikes
    if (action === 'reject') {
      await UserReputation.findOneAndUpdate(
        { userId: doc.userId },
        { 
          $push: { strikes: { reason: reason || 'Content rejected by admin', action: 'warning' } },
          $inc: { trustLevel: -5 }
        }
      );
    }
    
    res.json({ success: true, doc });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
