import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  getMe,
  updateUserDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  deleteUser, // Import hàm xóa người dùng
} from "../controllers/authController.js";

// Cấu hình Multer để lưu file tải lên
const uploadDir = 'uploads/';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Tự động tạo thư mục 'uploads' nếu nó không tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất để tránh trùng lặp
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// --- IMPORTANT ---
// Bạn cần thêm dòng sau vào file server chính (ví dụ: server.js, app.js)
// để có thể truy cập được ảnh đã tải lên từ trình duyệt:
// app.use('/uploads', express.static('uploads'));
const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản
 */
router.post("/register", registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập & trả về token
 */
router.post("/login", loginUser);

/**
 * @route   POST /api/auth/google
 * @desc    Xác thực người dùng bằng Google & trả về token
 */
router.post("/google", loginWithGoogle);

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin người dùng hiện tại (đã đăng nhập)
 * @access  Private
 */
router.get("/me", protect, getMe);

/**
 * @route   PUT /api/auth/me
 * @desc    Cập nhật thông tin người dùng (tên, email)
 * @access  Private
 */
router.put("/me", protect, upload.single("avatarFile"), updateUserDetails);

/**
 * @route   PUT /api/auth/password
 * @desc    Cập nhật mật khẩu người dùng
 * @access  Private
 */
router.put("/password", protect, updatePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Xử lý yêu cầu quên mật khẩu
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Đặt lại mật khẩu mới
 */
router.put("/reset-password/:token", resetPassword);

// --- ROUTE DÀNH CHO ADMIN ---
/**
 * @route   GET /api/auth/users
 * @desc    Lấy tất cả người dùng (chỉ admin)
 * @access  Private/Admin
 */
router.get("/users", protect, admin, getAllUsers);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Xóa người dùng (chỉ admin)
 * @access  Private/Admin
 */
router.delete("/users/:id", protect, admin, deleteUser);

export default router;
