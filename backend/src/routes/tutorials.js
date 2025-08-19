import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Tutorial from '../models/Tutorial.js';
import User from '../models/User.js';
import { authenticateToken, requirePermission, requireOwnership } from '../middleware/auth.js';
import { asyncHandler, ApiError, validationErrorHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import storageService from '../services/storage.js';

const router = express.Router();

// Validation rules
const createTutorialValidation = [
  body('title')
    .isString()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .isString()
    .withMessage('Description is required')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['business', 'technology', 'marketing', 'sales', 'development', 'design', 'finance', 'healthcare', 'education', 'other'])
    .withMessage('Invalid category'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('estimatedDuration')
    .isFloat({ min: 1, max: 1440 })
    .withMessage('Estimated duration must be between 1 and 1440 minutes'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

const updateTutorialValidation = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['business', 'technology', 'marketing', 'sales', 'development', 'design', 'finance', 'healthcare', 'education', 'other'])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('estimatedDuration')
    .optional()
    .isFloat({ min: 1, max: 1440 })
    .withMessage('Estimated duration must be between 1 and 1440 minutes'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

const createStepValidation = [
  body('title')
    .isString()
    .withMessage('Step title is required')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Step title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Step description cannot exceed 1000 characters'),
  body('content')
    .isString()
    .withMessage('Step content is required')
    .trim(),
  body('type')
    .isIn(['text', 'video', 'interactive', 'quiz'])
    .withMessage('Invalid step type'),
  body('order')
    .isInt({ min: 0 })
    .withMessage('Step order must be a non-negative integer'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
];

const searchValidation = [
  query('query')
    .optional()
    .isString()
    .trim(),
  query('category')
    .optional()
    .isIn(['business', 'technology', 'marketing', 'sales', 'development', 'design', 'finance', 'healthcare', 'education', 'other']),
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']),
  query('tags')
    .optional()
    .isString(),
  query('authorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),
  query('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('minRating must be between 0 and 5'),
  query('maxDuration')
    .optional()
    .isFloat({ min: 1, max: 1440 })
    .withMessage('maxDuration must be between 1 and 1440 minutes'),
  query('sortBy')
    .optional()
    .isIn(['title', 'createdAt', 'updatedAt', 'rating', 'viewCount'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// @route   POST /api/v1/tutorials
// @desc    Create a new tutorial
// @access  Private
router.post('/',
  authenticateToken,
  requirePermission('write:tutorials'),
  createTutorialValidation,
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const {
      title,
      description,
      category,
      tags = [],
      difficulty,
      estimatedDuration,
      isPublic = true,
      thumbnailUrl,
      videoUrl,
      steps = [],
    } = req.body;

    // Create tutorial
    const tutorial = new Tutorial({
      title,
      description,
      category,
      tags,
      difficulty,
      estimatedDuration,
      isPublic,
      thumbnailUrl,
      videoUrl,
      steps,
      authorId: req.user._id,
    });

    await tutorial.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'usage.tutorialsCreated': 1 },
    });

    logger.info('Tutorial created successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
    });

    res.status(201).json({
      success: true,
      message: 'Tutorial created successfully',
      data: tutorial,
    });
  })
);

// @route   GET /api/v1/tutorials
// @desc    Get all tutorials with search and pagination
// @access  Public
router.get('/',
  searchValidation,
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const {
      query: searchQuery,
      category,
      difficulty,
      tags,
      authorId,
      isPublished,
      minRating,
      maxDuration,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    // Build search query
    const searchFilters = {};
    
    if (searchQuery) {
      searchFilters.$text = { $search: searchQuery };
    }
    
    if (category) searchFilters.category = category;
    if (difficulty) searchFilters.difficulty = difficulty;
    if (authorId) searchFilters.authorId = authorId;
    
    if (isPublished !== undefined) {
      searchFilters.isPublished = isPublished === 'true';
    }
    
    if (minRating) searchFilters['rating.average'] = { $gte: parseFloat(minRating) };
    if (maxDuration) searchFilters.estimatedDuration = { $lte: parseFloat(maxDuration) };
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      searchFilters.tags = { $in: tagArray };
    }

    // Add default filters for public access
    if (!req.user || req.user.role === 'user') {
      searchFilters.isPublished = true;
      searchFilters.isPublic = true;
      searchFilters.isArchived = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute search
    const [tutorials, total] = await Promise.all([
      Tutorial.find(searchFilters)
        .populate('authorId', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Tutorial.countDocuments(searchFilters),
    ]);

    // Get available filters for UI
    const availableFilters = await Tutorial.aggregate([
      { $match: { isPublished: true, isArchived: false } },
      {
        $group: {
          _id: null,
          categories: { $addToSet: '$category' },
          difficulties: { $addToSet: '$difficulty' },
          tags: { $addToSet: '$tags' },
        },
      },
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info('Tutorials searched successfully', {
      userId: req.user?._id,
      query: searchQuery,
      filters: searchFilters,
      results: tutorials.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        tutorials,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
        filters: {
          applied: {
            query: searchQuery,
            category,
            difficulty,
            tags,
            authorId,
            isPublished,
            minRating,
            maxDuration,
            sortBy,
            sortOrder,
          },
          available: availableFilters[0] || {
            categories: [],
            difficulties: [],
            tags: [],
          },
        },
      },
      message: 'Tutorials retrieved successfully',
    });
  })
);

// @route   GET /api/v1/tutorials/:id
// @desc    Get tutorial by ID
// @access  Public (if published) / Private (if owned)
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id)
      .populate('authorId', 'firstName lastName email profile')
      .populate('reviews.userId', 'firstName lastName email profile');

    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Check access permissions
    if (!tutorial.isPublished || tutorial.isArchived) {
      if (!req.user || (req.user._id.toString() !== tutorial.authorId._id.toString() && req.user.role !== 'admin')) {
        throw new ApiError(403, 'Access denied');
      }
    }

    // Increment view count for published tutorials
    if (tutorial.isPublished && (!req.user || req.user._id.toString() !== tutorial.authorId._id.toString())) {
      await tutorial.incrementViewCount();
    }

    logger.info('Tutorial retrieved successfully', {
      userId: req.user?._id,
      tutorialId: tutorial._id,
      title: tutorial.title,
    });

    res.json({
      success: true,
      data: tutorial,
      message: 'Tutorial retrieved successfully',
    });
  })
);

// @route   PUT /api/v1/tutorials/:id
// @desc    Update tutorial
// @access  Private (owner or admin)
router.put('/:id',
  authenticateToken,
  requireOwnership(Tutorial),
  updateTutorialValidation,
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.authorId;
    delete updates.viewCount;
    delete updates.rating;
    delete updates.reviews;
    delete updates.completionStats;
    delete updates.analytics;
    delete updates.version;

    const tutorial = await Tutorial.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('authorId', 'firstName lastName email');

    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    logger.info('Tutorial updated successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
    });

    res.json({
      success: true,
      data: tutorial,
      message: 'Tutorial updated successfully',
    });
  })
);

// @route   DELETE /api/v1/tutorials/:id
// @desc    Delete tutorial
// @access  Private (owner or admin)
router.delete('/:id',
  authenticateToken,
  requireOwnership(Tutorial),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Archive instead of delete for data preservation
    tutorial.isArchived = true;
    tutorial.archivedAt = new Date();
    tutorial.archivedBy = req.user._id;
    await tutorial.save();

    logger.info('Tutorial archived successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
    });

    res.json({
      success: true,
      message: 'Tutorial archived successfully',
    });
  })
);

// @route   POST /api/v1/tutorials/:id/publish
// @desc    Publish tutorial
// @access  Private (owner or admin)
router.post('/:id/publish',
  authenticateToken,
  requireOwnership(Tutorial),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Check if tutorial has steps
    if (!tutorial.steps || tutorial.steps.length === 0) {
      throw new ApiError(400, 'Cannot publish tutorial without steps');
    }

    tutorial.isPublished = true;
    await tutorial.save();

    logger.info('Tutorial published successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
    });

    res.json({
      success: true,
      message: 'Tutorial published successfully',
      data: tutorial,
    });
  })
);

// @route   POST /api/v1/tutorials/:id/unpublish
// @desc    Unpublish tutorial
// @access  Private (owner or admin)
router.post('/:id/unpublish',
  authenticateToken,
  requireOwnership(Tutorial),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tutorial = await Tutorial.findByIdAndUpdate(
      id,
      { isPublished: false },
      { new: true }
    );

    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    logger.info('Tutorial unpublished successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
    });

    res.json({
      success: true,
      message: 'Tutorial unpublished successfully',
      data: tutorial,
    });
  })
);

// @route   POST /api/v1/tutorials/:id/rating
// @desc    Add rating to tutorial
// @access  Private
router.post('/:id/rating',
  authenticateToken,
  requirePermission('read:tutorials'),
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('review')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Review cannot exceed 2000 characters'),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id } = req.params;
    const { rating, review = '' } = req.body;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Check if tutorial is published
    if (!tutorial.isPublished) {
      throw new ApiError(400, 'Cannot rate unpublished tutorial');
    }

    // Add rating
    await tutorial.addRating(req.user._id, rating, review);

    logger.info('Tutorial rated successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
      rating,
    });

    res.json({
      success: true,
      message: 'Rating added successfully',
      data: {
        rating: tutorial.rating,
        userRating: { rating, review },
      },
    });
  })
);

// @route   POST /api/v1/tutorials/:id/view
// @desc    Increment tutorial view count
// @access  Public
router.post('/:id/view',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Check if tutorial is published
    if (!tutorial.isPublished) {
      throw new ApiError(400, 'Cannot view unpublished tutorial');
    }

    // Increment view count
    await tutorial.incrementViewCount();

    res.json({
      success: true,
      message: 'View count incremented',
    });
  })
);

// @route   GET /api/v1/tutorials/:id/progress
// @desc    Get tutorial progress for user
// @access  Private
router.get('/:id/progress',
  authenticateToken,
  requirePermission('read:tutorials'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Calculate progress
    const totalSteps = tutorial.steps.length;
    const completedSteps = tutorial.steps.filter(step => step.isCompleted).length;
    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Calculate estimated time remaining
    const totalDuration = tutorial.steps.reduce((total, step) => total + (step.duration || 0), 0);
    const completedDuration = tutorial.steps
      .filter(step => step.isCompleted)
      .reduce((total, step) => total + (step.duration || 0), 0);
    const remainingDuration = totalDuration - completedDuration;

    res.json({
      success: true,
      data: {
        tutorialId: tutorial._id,
        title: tutorial.title,
        completedSteps,
        totalSteps,
        percentage,
        estimatedTimeRemaining: Math.max(0, remainingDuration),
        steps: tutorial.steps.map(step => ({
          id: step._id,
          title: step.title,
          order: step.order,
          isCompleted: step.isCompleted,
          duration: step.duration || 0,
        })),
      },
      message: 'Tutorial progress retrieved successfully',
    });
  })
);

// @route   GET /api/v1/tutorials/popular
// @desc    Get popular tutorials
// @access  Public
router.get('/popular',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { limit = 10 } = req.query;

    const tutorials = await Tutorial.findPopular(parseInt(limit))
      .populate('authorId', 'firstName lastName email')
      .lean();

    res.json({
      success: true,
      data: tutorials,
      message: 'Popular tutorials retrieved successfully',
    });
  })
);

// @route   GET /api/v1/tutorials/recommended
// @desc    Get recommended tutorials for user
// @access  Private
router.get('/recommended',
  authenticateToken,
  requirePermission('read:tutorials'),
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { limit = 10 } = req.query;

    // Simple recommendation based on user preferences and history
    // In production, this would use ML algorithms
    const tutorials = await Tutorial.find({
      isPublished: true,
      isArchived: false,
      category: { $in: ['business', 'technology'] }, // Default recommendations
      authorId: { $ne: req.user._id }, // Don't recommend own tutorials
    })
      .sort({ 'rating.average': -1, viewCount: -1 })
      .limit(parseInt(limit))
      .populate('authorId', 'firstName lastName email')
      .lean();

    res.json({
      success: true,
      data: tutorials,
      message: 'Recommended tutorials retrieved successfully',
    });
  })
);

// @route   POST /api/v1/tutorials/:id/steps
// @desc    Add step to tutorial
// @access  Private (owner or admin)
router.post('/:id/steps',
  authenticateToken,
  requireOwnership(Tutorial),
  createStepValidation,
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id } = req.params;
    const stepData = req.body;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Add step
    await tutorial.addStep(stepData);

    logger.info('Step added to tutorial successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
      stepTitle: stepData.title,
    });

    res.status(201).json({
      success: true,
      data: tutorial,
      message: 'Step added successfully',
    });
  })
);

// @route   PUT /api/v1/tutorials/:id/steps/:stepId
// @desc    Update tutorial step
// @access  Private (owner or admin)
router.put('/:id/steps/:stepId',
  authenticateToken,
  requireOwnership(Tutorial),
  createStepValidation,
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id, stepId } = req.params;
    const updates = req.body;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Update step
    await tutorial.updateStep(stepId, updates);

    logger.info('Step updated successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
      stepId,
    });

    res.json({
      success: true,
      data: tutorial,
      message: 'Step updated successfully',
    });
  })
);

// @route   DELETE /api/v1/tutorials/:id/steps/:stepId
// @desc    Delete tutorial step
// @access  Private (owner or admin)
router.delete('/:id/steps/:stepId',
  authenticateToken,
  requireOwnership(Tutorial),
  asyncHandler(async (req, res) => {
    const { id, stepId } = req.params;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Delete step
    await tutorial.deleteStep(stepId);

    logger.info('Step deleted successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
      stepId,
    });

    res.json({
      success: true,
      data: tutorial,
      message: 'Step deleted successfully',
    });
  })
);

// @route   POST /api/v1/tutorials/:id/steps/reorder
// @desc    Reorder tutorial steps
// @access  Private (owner or admin)
router.post('/:id/steps/reorder',
  authenticateToken,
  requireOwnership(Tutorial),
  [
    body('stepIds')
      .isArray({ min: 1 })
      .withMessage('Step IDs array is required'),
    body('stepIds.*')
      .isMongoId()
      .withMessage('Invalid step ID'),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id } = req.params;
    const { stepIds } = req.body;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Validate that all step IDs belong to this tutorial
    const tutorialStepIds = tutorial.steps.map(step => step._id.toString());
    const isValid = stepIds.every(stepId => tutorialStepIds.includes(stepId));
    
    if (!isValid) {
      throw new ApiError(400, 'Invalid step IDs provided');
    }

    // Reorder steps
    await tutorial.reorderSteps(stepIds);

    logger.info('Steps reordered successfully', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
      stepIds,
    });

    res.json({
      success: true,
      data: tutorial,
      message: 'Steps reordered successfully',
    });
  })
);

// @route   PATCH /api/v1/tutorials/:id/steps/:stepId/complete
// @desc    Mark step as complete/incomplete
// @access  Private
router.patch('/:id/steps/:stepId/complete',
  authenticateToken,
  requirePermission('read:tutorials'),
  [
    body('isCompleted')
      .isBoolean()
      .withMessage('isCompleted must be a boolean'),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { id, stepId } = req.params;
    const { isCompleted } = req.body;

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial not found');
    }

    // Check if tutorial is published
    if (!tutorial.isPublished) {
      throw new ApiError(400, 'Cannot update step completion for unpublished tutorial');
    }

    // Update step completion
    await tutorial.updateStep(stepId, { isCompleted });

    logger.info('Step completion updated', {
      userId: req.user._id,
      email: req.user.email,
      tutorialId: tutorial._id,
      title: tutorial.title,
      stepId,
      isCompleted,
    });

    res.json({
      success: true,
      data: tutorial,
      message: `Step marked as ${isCompleted ? 'complete' : 'incomplete'}`,
    });
  })
);

export default router;