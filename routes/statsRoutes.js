import express from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/stats/dashboard
// @desc    Lấy dữ liệu thống kê cho trang tổng quan
router.route('/dashboard').get(protect, admin, getDashboardStats);

export default router;