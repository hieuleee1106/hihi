import express from 'express';
import {
  createConsultation,
  getConsultations,
  updateConsultationStatus,
  deleteConsultation,
} from '../controllers/consultationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint công khai để khách hàng gửi yêu cầu
router.route('/').post(createConsultation).get(protect, admin, getConsultations);
router.route('/:id')
  .put(protect, admin, updateConsultationStatus)
  .delete(protect, admin, deleteConsultation);

export default router;