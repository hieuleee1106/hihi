import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification, // Import hàm xóa mới
} from '../controllers/notificationController.js';

const router = express.Router();

router.route('/').get(protect, getMyNotifications);
router.route('/mark-all-read').put(protect, markAllAsRead);
router.route('/:id/read').put(protect, markAsRead);
router.route('/:id').delete(protect, deleteNotification); // Thêm route cho hành động DELETE

export default router;