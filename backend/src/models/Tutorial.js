import mongoose from 'mongoose';

const tutorialStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Step title is required'],
    trim: true,
    maxlength: [200, 'Step title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Step description cannot exceed 1000 characters'],
  },
  content: {
    type: String,
    required: [true, 'Step content is required'],
    trim: true,
  },
  order: {
    type: Number,
    required: [true, 'Step order is required'],
    min: [0, 'Step order must be at least 0'],
  },
  type: {
    type: String,
    required: [true, 'Step type is required'],
    enum: ['text', 'video', 'interactive', 'quiz'],
    default: 'text',
  },
  mediaUrl: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number,
    min: [0, 'Duration must be at least 0 seconds'],
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  metadata: {
    fileSize: Number,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number,
    },
    encoding: String,
  },
  quizData: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String,
    }],
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
  },
  interactiveData: {
    type: {
      type: String,
      enum: ['click', 'drag', 'type', 'select'],
    },
    instructions: String,
    targetElements: [String],
    validationRules: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

const tutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tutorial title is required'],
    trim: true,
    maxlength: [200, 'Tutorial title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Tutorial description is required'],
    trim: true,
    maxlength: [2000, 'Tutorial description cannot exceed 2000 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Tutorial category is required'],
    enum: [
      'business',
      'technology',
      'marketing',
      'sales',
      'development',
      'design',
      'finance',
      'healthcare',
      'education',
      'other'
    ],
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  difficulty: {
    type: String,
    required: [true, 'Tutorial difficulty is required'],
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [1, 'Estimated duration must be at least 1 minute'],
    max: [1440, 'Estimated duration cannot exceed 24 hours'],
  },
  thumbnailUrl: {
    type: String,
    trim: true,
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  steps: [tutorialStepSchema],
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative'],
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5'],
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Rating total cannot be negative'],
    },
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    review: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  completionStats: {
    totalAttempts: {
      type: Number,
      default: 0,
    },
    successfulCompletions: {
      type: Number,
      default: 0,
    },
    averageCompletionTime: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: [0, 'Completion rate cannot be negative'],
      max: [100, 'Completion rate cannot exceed 100'],
    },
  },
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    keywords: [String],
    canonicalUrl: String,
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true,
    },
    requireLogin: {
      type: Boolean,
      default: false,
    },
    allowSharing: {
      type: Boolean,
      default: true,
    },
    autoAdvance: {
      type: Boolean,
      default: true,
    },
    showProgress: {
      type: Boolean,
      default: true,
    },
  },
  analytics: {
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: [0, 'Bounce rate cannot be negative'],
      max: [100, 'Bounce rate cannot exceed 100'],
    },
    averageSessionDuration: {
      type: Number,
      default: 0,
    },
    popularSteps: [{
      stepId: mongoose.Schema.Types.ObjectId,
      viewCount: Number,
    }],
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1'],
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for completion percentage
tutorialSchema.virtual('completionPercentage').get(function() {
  if (this.steps.length === 0) return 0;
  const completedSteps = this.steps.filter(step => step.isCompleted).length;
  return Math.round((completedSteps / this.steps.length) * 100);
});

// Virtual for total duration
tutorialSchema.virtual('totalDuration').get(function() {
  return this.steps.reduce((total, step) => total + (step.duration || 0), 0);
});

// Virtual for formatted duration
tutorialSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.estimatedDuration);
  const seconds = Math.round((this.estimatedDuration - minutes) * 60);
  
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
});

// Indexes for performance
tutorialSchema.index({ title: 'text', description: 'text', tags: 'text' });
tutorialSchema.index({ authorId: 1 });
tutorialSchema.index({ category: 1 });
tutorialSchema.index({ difficulty: 1 });
tutorialSchema.index({ isPublished: 1 });
tutorialSchema.index({ isPublic: 1 });
tutorialSchema.index({ 'rating.average': -1 });
tutorialSchema.index({ viewCount: -1 });
tutorialSchema.index({ createdAt: -1 });
tutorialSchema.index({ slug: 1 });

// Pre-save middleware to generate slug
tutorialSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.generateSlug();
  }
  next();
});

// Pre-save middleware to update completion stats
tutorialSchema.pre('save', function(next) {
  if (this.steps && this.steps.length > 0) {
    const totalSteps = this.steps.length;
    const completedSteps = this.steps.filter(step => step.isCompleted).length;
    this.completionStats.completionRate = Math.round((completedSteps / totalSteps) * 100);
  }
  next();
});

// Instance method to generate slug
tutorialSchema.methods.generateSlug = function() {
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  return `${baseSlug}-${Date.now().toString(36)}`;
};

// Instance method to add step
tutorialSchema.methods.addStep = function(stepData) {
  const newStep = {
    ...stepData,
    order: this.steps.length,
  };
  
  this.steps.push(newStep);
  return this.save();
};

// Instance method to reorder steps
tutorialSchema.methods.reorderSteps = function(stepIds) {
  const stepMap = new Map();
  this.steps.forEach(step => {
    stepMap.set(step._id.toString(), step);
  });
  
  const reorderedSteps = stepIds.map((stepId, index) => {
    const step = stepMap.get(stepId);
    if (step) {
      step.order = index;
      return step;
    }
    return null;
  }).filter(Boolean);
  
  this.steps = reorderedSteps;
  return this.save();
};

// Instance method to increment view count
tutorialSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to add rating
tutorialSchema.methods.addRating = function(userId, rating, review = '') {
  // Remove existing rating from this user
  this.reviews = this.reviews.filter(review => review.userId.toString() !== userId.toString());
  
  // Add new rating
  this.reviews.push({ userId, rating, review });
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  this.rating.total = totalRating;
  
  return this.save();
};

// Instance method to get step by ID
tutorialSchema.methods.getStepById = function(stepId) {
  return this.steps.id(stepId);
};

// Instance method to update step
tutorialSchema.methods.updateStep = function(stepId, updates) {
  const step = this.steps.id(stepId);
  if (step) {
    Object.assign(step, updates);
    return this.save();
  }
  throw new Error('Step not found');
};

// Instance method to delete step
tutorialSchema.methods.deleteStep = function(stepId) {
  this.steps = this.steps.filter(step => step._id.toString() !== stepId.toString());
  return this.save();
};

// Static method to find published tutorials
tutorialSchema.statics.findPublished = function() {
  return this.find({ isPublished: true, isPublic: true, isArchived: false });
};

// Static method to find tutorials by category
tutorialSchema.statics.findByCategory = function(category) {
  return this.find({ category, isPublished: true, isArchived: false });
};

// Static method to find tutorials by difficulty
tutorialSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, isPublished: true, isArchived: false });
};

// Static method to find tutorials by author
tutorialSchema.statics.findByAuthor = function(authorId) {
  return this.find({ authorId, isArchived: false });
};

// Static method to find popular tutorials
tutorialSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isPublished: true, isArchived: false })
    .sort({ viewCount: -1, 'rating.average': -1 })
    .limit(limit);
};

// Static method to search tutorials
tutorialSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    isPublished: true,
    isArchived: false,
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.difficulty) {
    searchQuery.difficulty = filters.difficulty;
  }
  
  if (filters.authorId) {
    searchQuery.authorId = filters.authorId;
  }
  
  if (filters.minRating) {
    searchQuery['rating.average'] = { $gte: filters.minRating };
  }
  
  if (filters.maxDuration) {
    searchQuery.estimatedDuration = { $lte: filters.maxDuration };
  }
  
  return this.find(searchQuery);
};

export default mongoose.model('Tutorial', tutorialSchema);