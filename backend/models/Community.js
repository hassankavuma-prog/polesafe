// PoleSafe Community Model
// Safety Board posts, blog entries, feature voting

const mongoose = require('mongoose');

// ============================================================
// Community Post Schema — Safety Board Discussions
// ============================================================
const communityPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['parent', 'driver', 'school', 'rider'], required: true },
  displayName: { type: String, default: '' }, // Masked name shown publicly
  location: { type: String, default: '' }, // e.g. "Kampala", "St Mary's School"
  
  type: { type: String, enum: ['safety_concern', 'general_discussion', 'announcement'], default: 'safety_concern' },
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 10000 },
  
  // Auto-categorization by Hamna
  category: { type: String, enum: ['route_safety', 'driver_behavior', 'school_policy', 'pickup_delay', 'general', 'other'], default: 'general' },
  
  // Hamna moderation
  moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'flagged'], default: 'pending' },
  moderationReason: { type: String, default: '' },
  
  // Engagement
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 },
  
  // If locked by Hamna due to toxicity
  locked: { type: Boolean, default: false },
  lockedReason: { type: String, default: '' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

communityPostSchema.index({ category: 1, moderationStatus: 1, createdAt: -1 });
communityPostSchema.index({ userId: 1 });
communityPostSchema.index({ type: 1, createdAt: -1 });

// ============================================================
// Comment Schema — Replies to Community Posts
// ============================================================
const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['parent', 'driver', 'school', 'rider'], required: true },
  displayName: { type: String, default: '' },
  location: { type: String, default: '' },
  
  body: { type: String, required: true, maxlength: 2000 },
  
  moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'flagged'], default: 'pending' },
  moderationReason: { type: String, default: '' },
  
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  createdAt: { type: Date, default: Date.now },
});

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ userId: 1 });

// ============================================================
// Blog Post Schema
// ============================================================
const blogPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['parent', 'driver', 'school', 'rider'], required: true },
  authorName: { type: String, required: true }, // Chosen display name (can be real or pseudonym)
  authorBio: { type: String, default: '', maxlength: 500 },
  
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 50000 },
  excerpt: { type: String, default: '', maxlength: 300 },
  
  // Blog categories
  category: { type: String, enum: ['parenting', 'safety_tips', 'teaching', 'polesafe_updates', 'community_voices', 'other'], default: 'community_voices' },
  
  tags: [{ type: String }],
  
  // Hamna moderation
  moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'flagged'], default: 'pending' },
  moderationReason: { type: String, default: '' },
  
  // Stats
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  
  // Auto-translated flag (Hamna translated to English for moderation)
  originalLanguage: { type: String, default: 'en' },
  translatedForModeration: { type: Boolean, default: false },
  
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

blogPostSchema.index({ category: 1, published: 1, createdAt: -1 });
blogPostSchema.index({ userId: 1 });
blogPostSchema.index({ tags: 1 });

// ============================================================
// Feature Suggestion Schema — Democratic Feature Voting
// ============================================================
const featureSuggestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['parent', 'driver', 'school', 'rider'], required: true },
  
  title: { type: String, required: true, maxlength: 150 },
  description: { type: String, required: true, maxlength: 5000 },
  category: { type: String, enum: ['safety', 'tracking', 'payments', 'communication', 'rides', 'other'], default: 'other' },
  
  // Voting
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Weighted voting (frequent riders get more weight)
  voteWeight: { type: Number, default: 1 },
  
  // Status
  status: { type: String, enum: ['suggested', 'under_review', 'planned', 'in_development', 'launched', 'declined'], default: 'suggested' },
  
  // Hamna analysis
  hamnaAnalysis: { type: String, default: '' }, // Hamna's summary of feature value
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

featureSuggestionSchema.index({ status: 1, createdAt: -1 });
featureSuggestionSchema.index({ category: 1, status: 1 });

// ============================================================
// User Reputation Schema — Trust levels for moderation bypass
// ============================================================
const userReputationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  trustLevel: { type: Number, default: 0, min: 0, max: 100 }, // 0=new, 100=fully trusted
  
  // Moderation strikes
  strikes: [{
    reason: { type: String },
    date: { type: Date, default: Date.now },
    action: { type: String, enum: ['warning', 'quiet_period', 'ban'] },
    expiresAt: { type: Date },
  }],
  
  // Active restrictions
  quietUntil: { type: Date, default: null },
  banned: { type: Boolean, default: false },
  
  // Community contributions
  helpfulPosts: { type: Number, default: 0 },
  helpfulComments: { type: Number, default: 0 },
  blogPostsPublished: { type: Number, default: 0 },
  
  // Frequent rider perks
  totalRides: { type: Number, default: 0 },
  voteWeight: { type: Number, default: 1 }, // Increases with rides
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userReputationSchema.index({ trustLevel: -1 });

module.exports = {
  CommunityPost: mongoose.model('CommunityPost', communityPostSchema),
  Comment: mongoose.model('Comment', commentSchema),
  BlogPost: mongoose.model('BlogPost', blogPostSchema),
  FeatureSuggestion: mongoose.model('FeatureSuggestion', featureSuggestionSchema),
  UserReputation: mongoose.model('UserReputation', userReputationSchema),
};
