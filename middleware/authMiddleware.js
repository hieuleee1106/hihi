// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * @desc Middleware bảo vệ route, yêu cầu xác thực bằng token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    try {
      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy user từ DB và loại bỏ password
      req.user = await User.findById(decoded.user.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Người dùng không tồn tại" });
      }

      next(); // Token hợp lệ → chuyển sang middleware tiếp theo
    } catch (error) {
      // Xử lý riêng token hết hạn
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token đã hết hạn, vui lòng đăng nhập lại" });
      }
      // Chỉ log các lỗi khác
      console.error("Lỗi xác thực token:", error);
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  } else {
    return res.status(401).json({ message: "Không có token" });
  }
};

/**
 * @desc Middleware kiểm tra quyền admin
 * @note Phải dùng SAU middleware protect
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Không có quyền truy cập. Yêu cầu quyền quản trị viên." });
  }
};
