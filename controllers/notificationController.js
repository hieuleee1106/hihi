import { Notification } from '../models/Notification.js';

// @desc    Lấy tất cả thông báo của người dùng
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Đánh dấu một thông báo là đã đọc
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    notification.isRead = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Đánh dấu tất cả thông báo là đã đọc
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'Tất cả thông báo đã được đánh dấu là đã đọc.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Xóa một thông báo
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    await notification.deleteOne();
    res.status(200).json({ message: 'Xóa thông báo thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};