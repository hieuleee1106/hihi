import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories, // Import hàm mới
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);

// @desc    Lấy tất cả các danh mục sản phẩm duy nhất
// @route   GET /api/products/categories
// Route cụ thể này phải được đặt trước route động '/:id' để tránh 'categories' bị hiểu là một 'id'.
router.get('/categories', getProductCategories);

router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

export default router;