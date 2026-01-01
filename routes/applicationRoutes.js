import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getApplications,
  updateApplicationStatus,
  createApplication,
  getApplicationById,
  getMyApplications,
  hideApplication,
  deleteApplicationByAdmin,
} from '../controllers/applicationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Cấu hình Multer để lưu tài liệu
const docUploadDir = 'uploads/documents/';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(docUploadDir)) {
      fs.mkdirSync(docUploadDir, { recursive: true });
    }
    cb(null, docUploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `doc-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

router.route('/').get(protect, admin, getApplications).post(protect, upload.array('documents', 5), createApplication);
router.route('/my').get(protect, getMyApplications);
router.route('/:id/hide').put(protect, hideApplication); // Route để ẩn hồ sơ
router.route('/:id')
  .get(protect, admin, getApplicationById)
  .put(protect, admin, updateApplicationStatus)
  .delete(protect, admin, deleteApplicationByAdmin); // Admin xóa vĩnh viễn

export default router;