import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js'; // Import middleware upload
import {
  createContract,
  getMyContracts,
  getContracts,
  updateContract,
  deleteContract,
  requestCancellation,
  reviewCancellation,
  requestClaim,
  updateClaimStatus,
  confirmPayment,
} from '../controllers/contractController.js';

const router = express.Router();

router.route('/')
  .post(protect, admin, createContract)
  .get(protect, admin, getContracts); // Thêm route GET cho admin

router.route('/my').get(protect, getMyContracts);
router.route('/:id/confirm-payment').post(protect, confirmPayment); // Route cho user xác nhận thanh toán

// Routes cho chức năng hủy hợp đồng
router.route('/:id/cancel-request').post(protect, requestCancellation); // User gửi yêu cầu
router.route('/:id/cancel-review').put(protect, admin, reviewCancellation); // Admin duyệt

// Routes cho chức năng bồi thường (Claims)
router.route('/:id/claim').post(protect, upload.array('images'), requestClaim); // Thêm middleware upload
router.route('/:id/claims/:claimId').put(protect, admin, updateClaimStatus);

router.route('/:id')
  .put(protect, admin, updateContract) // Thêm route PUT cho admin sửa
  .delete(protect, admin, deleteContract); // Thêm route DELETE cho admin xóa

export default router;