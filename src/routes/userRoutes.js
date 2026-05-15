// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, deleteUser } = require('../controllers/AuthController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers); 
router.patch('/:id/role', updateUserRole); 
router.delete('/:id', deleteUser);

module.exports = router;