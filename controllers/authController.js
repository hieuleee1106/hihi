import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

/**
 * @desc    Đăng ký tài khoản
 * @route   POST /api/auth/register
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
    });

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @desc    Đăng nhập & trả về token
 * @route   POST /api/auth/login
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        // Tối ưu: Trả về cả token và thông tin người dùng
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
          }
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};




/**
 * @desc    Xác thực người dùng bằng Google & trả về token
 * @route   POST /api/auth/google
 */
export const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Không nhận được thông tin xác thực từ Google." });
    }

    const decodedGoogleToken = jwt.decode(credential);
    const { email, name, picture } = decodedGoogleToken;

    let user = await User.findOne({ email }).select('+password');

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        avatar: picture,
      });
    }

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        // Tối ưu: Trả về cả token và thông tin người dùng
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
          }
        });
      }
    );
  } catch (error) {
    console.error("Lỗi xác thực Google:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @desc    Lấy thông tin người dùng hiện tại (đã đăng nhập)
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  // Tối ưu: Trả về một đối tượng user nhất quán, đầy đủ thông tin
  // thay vì chỉ trả về req.user mặc định từ middleware.
  // Đảm bảo cấu trúc trả về đồng nhất với login (dạng lồng nhau)
  // để client xử lý dữ liệu một cách nhất quán.
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      avatar: req.user.avatar,
    }
  });
};

/**
 * @desc    Cập nhật thông tin người dùng (tên, email)
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateUserDetails = async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email này đã được sử dụng." });
      }
      user.email = email;
    }

    user.name = name;
    user.phone = phone;

    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      user.avatar = `${req.protocol}://${req.get("host")}/${filePath}`;
    } else {
      user.avatar = avatar || user.avatar;
    }

    const updatedUser = await user.save();
    // Đảm bảo cấu trúc trả về đồng nhất với login (dạng lồng nhau).
    res.status(200).json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật người dùng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @route   PUT /api/auth/password
 * @desc    Cập nhật mật khẩu người dùng
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Cập nhật mật khẩu thành công." });
  } catch (error) {
    console.error("Lỗi cập nhật mật khẩu:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Xử lý yêu cầu quên mật khẩu
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: "Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi." });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Hết hạn sau 10 phút

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const message = `
      <h1>Yêu cầu đặt lại mật khẩu</h1>
      <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại HieuShop.</p>
      <p>Vui lòng nhấn vào liên kết bên dưới để đặt lại mật khẩu:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Liên kết này sẽ hết hạn sau 10 phút.</p>
      <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'HieuShop - Yêu cầu đặt lại mật khẩu',
      html: message,
    });

    res.status(200).json({ 
      message: "Yêu cầu đặt lại mật khẩu đã được xử lý. Vui lòng kiểm tra email của bạn."
    });
  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Đặt lại mật khẩu mới
 */
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Đặt lại mật khẩu thành công." });
  } catch (error) {
    console.error("Lỗi reset mật khẩu:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @desc    Lấy tất cả người dùng (Admin)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * @desc    Xóa người dùng (Admin)
 * @route   DELETE /api/auth/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Thêm một lớp bảo vệ để không cho phép xóa tài khoản admin khác
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Không thể xóa tài khoản quản trị viên.' });
    }

    await user.deleteOne();
    res.status(200).json({ message: "Người dùng đã được xóa thành công." });
  } catch (error) {
    console.error("Lỗi xóa người dùng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};