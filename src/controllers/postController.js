const Post = require('../models/Post');
const ErrorHandler = require('../utils/ErrorHandler');
const sanitize = require('mongo-sanitize');
const Comment = require('../models/comments');

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private (Admin/Author)
 */
exports.createPost = async (req, res, next) => {
  try {
    // Author field ko automatically logged-in user ki ID se set karna
    req.body.author = req.user.id; 

    const post = await Post.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */

exports.getPost = async (req, res) => {
    // find() hamesha array deta hai, findById hamesha object deta hai
    const post = await Post.findById(req.params.id).populate('author', 'name');

    if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({
        success: true,
        data: post // <--- Ab ye single object jayega
    });
};

/**
 * @desc    Get all published posts with Search & Pagination
 * @route   GET /api/posts
 * @access  Public
 */
exports.getPosts = async (req, res, next) => {
  try {
    // 1. NoSQL Injection Prevention
    const queryCopy = sanitize({ ...req.query });

    // 2. Base Query
    let query = { status: 'published' };

    // 3. Search Logic (Title aur Tags)
    if (queryCopy.search) {
      query.$or = [
        { title: { $regex: queryCopy.search, $options: 'i' } },
        { tags: { $in: [new RegExp(queryCopy.search, 'i')] } }
      ];
    }

    // 🔥 4. Date Search Logic (Created At)
    // Expecting date in format: YYYY-MM-DD
    if (queryCopy.date) {
      const start = new Date(queryCopy.date);
      start.setHours(0, 0, 0, 0); // Din ka start

      const end = new Date(queryCopy.date);
      end.setHours(23, 59, 59, 999); // Din ka end

      query.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // 5. Pagination Logic
    const page = parseInt(queryCopy.page, 10) || 1;
    const limit = parseInt(queryCopy.limit, 10) || 5;
    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate('author', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNext: page < Math.ceil(totalPosts / limit)
      },
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Post (Only Owner or Admin)
 * @route   PUT /api/posts/:id
 */
exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) return next(new ErrorHandler('Post not found', 404));

    // Check if user is owner or admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorHandler('Not authorized to update this post', 403));
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, message: 'Post updated', data: post });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Aggregation for Post Statistics
 * @route   GET /api/stats/posts
 */
exports.getPostStats = async (req, res, next) => {
  try {
    const stats = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          publishedPosts: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
          draftPosts: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } }
        }
      },
      { $project: { _id: 0 } }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { totalPosts: 0, publishedPosts: 0, draftPosts: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in author's posts (Draft + Published)
// @route   GET /api/posts/my
exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user.id });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorHandler('Post not found', 404));

    // Check ownership
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorHandler('Not authorized', 403));
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post status (Publish/Unpublish)
// @route   PATCH /api/posts/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published'].includes(status)) {
      return next(new ErrorHandler('Invalid status', 400));
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    req.body.post = req.params.id;
    req.body.author = req.user.id;

    const comment = await Comment.create(req.body);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

exports.getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id }).populate('author', 'name');
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};