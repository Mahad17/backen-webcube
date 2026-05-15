const express = require('express');
const router = express.Router();
const { 
  createPost, getPosts, updatePost, getPostStats,
  getMyPosts, deletePost, updateStatus,
  addComment, getPostComments, getPost // Ensure getPost is imported
} = require('../controllers/postController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, getMyPosts); 
router.get('/stats', protect, authorize('admin'), getPostStats);

router.route('/:id')
  .get(getPost) 
  .put(protect, updatePost)
  .delete(protect, deletePost);

// 3. GENERAL GET ALL ROUTE (Isay niche rakhein)
router.get('/', getPosts); 

// 4. OTHER ROUTES
router.post('/', protect, authorize('admin', 'author'), createPost);
router.patch('/:id/status', protect, updateStatus);

// Comment Routes
router.get('/:id/comments', getPostComments);
router.post('/:id/comments', protect, addComment);

module.exports = router;