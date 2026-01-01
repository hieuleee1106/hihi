import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Contract } from '../models/Contract.js';
import { InsuranceApplication } from '../models/InsuranceApplication.js';

// @desc    Lấy dữ liệu thống kê cho trang tổng quan
// @route   GET /api/stats/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalApplications = await InsuranceApplication.countDocuments({});
    
    // Tính tổng doanh thu từ các hợp đồng đã có hiệu lực
    const revenueResult = await Contract.aggregate([
      { $match: { status: 'Hiệu lực' } },
      { $group: { _id: null, totalRevenue: { $sum: '$premium' } } }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const stats = {
      totalUsers,
      totalProducts,
      totalApplications,
      totalRevenue,
    };

    res.json(stats);

  } catch (error) {
    console.error("Lỗi lấy dữ liệu thống kê:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};