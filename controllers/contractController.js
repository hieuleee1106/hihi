import { Contract } from '../models/Contract.js';
import { InsuranceApplication } from '../models/InsuranceApplication.js';
import { Notification } from '../models/Notification.js';

// @desc    Tạo hợp đồng từ một hồ sơ đã duyệt (Admin)
// @route   POST /api/contracts
// @access  Private/Admin
export const createContract = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await InsuranceApplication.findById(applicationId).populate('product');

    if (!application || application.status !== 'Đã duyệt') {
      return res.status(400).json({ message: 'Hồ sơ không hợp lệ hoặc chưa được duyệt.' });
    }

    const existingContract = await Contract.findOne({ application: applicationId });
    if (existingContract) {
      return res.status(400).json({ message: 'Hợp đồng cho hồ sơ này đã tồn tại.' });
    }

    const contractNumber = `HD-${Date.now()}`;
    const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // Hợp đồng có hiệu lực 1 năm

    const contract = await Contract.create({
      user: application.applicant,
      product: application.product._id,
      application: applicationId,
      contractNumber,
      premium: application.product.price,
      endDate,
    });

    // Tạo thông báo cho người dùng
    await Notification.create({
      user: application.applicant,
      message: `Hợp đồng cho sản phẩm "${application.product.name}" đã được tạo. Vui lòng thanh toán để kích hoạt.`,
      link: '/my-contracts'
    });

    res.status(201).json({ message: 'Tạo hợp đồng thành công!', contract });
  } catch (error) {
    console.error("Lỗi tạo hợp đồng:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy danh sách hợp đồng của người dùng
// @route   GET /api/contracts/my
// @access  Private
export const getMyContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ user: req.user._id })
      .populate('product') // Lấy tất cả thông tin của sản phẩm, thay vì chỉ name và provider
      .populate('application', 'applicationData') // Lấy thêm thông tin chi tiết từ hồ sơ
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả hợp đồng (Admin)
// @route   GET /api/contracts
// @access  Private/Admin
export const getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({})
      .populate('user', 'name email')
      .populate('product') // Lấy tất cả thông tin sản phẩm để đảm bảo tính nhất quán
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật hợp đồng (Admin)
// @route   PUT /api/contracts/:id
// @access  Private/Admin
export const updateContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    }

    const { premium, status, endDate, startDate, contractNumber, user, product } = req.body;
    contract.premium = premium ?? contract.premium;
    contract.status = status ?? contract.status;
    contract.endDate = endDate ?? contract.endDate;
    contract.startDate = startDate ?? contract.startDate;
    contract.contractNumber = contractNumber ?? contract.contractNumber;
    contract.user = user ?? contract.user;
    contract.product = product ?? contract.product;
    const updatedContract = await contract.save();
    res.json(updatedContract);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Xóa hợp đồng (Admin)
// @route   DELETE /api/contracts/:id
// @access  Private/Admin
export const deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    res.json({ message: 'Xóa hợp đồng thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Gửi yêu cầu hủy hợp đồng (User)
// @route   POST /api/contracts/:id/cancel-request
// @access  Private
export const requestCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    const contract = await Contract.findOne({ _id: req.params.id, user: req.user._id });

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    }

    if (contract.status !== 'Hiệu lực') {
      return res.status(400).json({ message: 'Chỉ có thể yêu cầu hủy hợp đồng đang có hiệu lực.' });
    }

    if (contract.cancellation && contract.cancellation.isRequested && contract.cancellation.status === 'Chờ duyệt') {
      return res.status(400).json({ message: 'Bạn đã gửi yêu cầu hủy cho hợp đồng này rồi.' });
    }

    contract.cancellation = {
      isRequested: true,
      reason: reason,
      requestedAt: Date.now(),
      status: 'Chờ duyệt'
    };

    await contract.save();
    res.status(200).json({ message: 'Đã gửi yêu cầu hủy hợp đồng. Vui lòng chờ Admin xét duyệt.', contract });
  } catch (error) {
    console.error("Lỗi yêu cầu hủy:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Duyệt yêu cầu hủy hợp đồng (Admin)
// @route   PUT /api/contracts/:id/cancel-review
// @access  Private/Admin
export const reviewCancellation = async (req, res) => {
  try {
    const { decision, adminResponse } = req.body; // decision: 'approve' hoặc 'reject'
    const contract = await Contract.findById(req.params.id).populate('product');

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    }

    if (!contract.cancellation || !contract.cancellation.isRequested) {
      return res.status(400).json({ message: 'Hợp đồng này không có yêu cầu hủy nào.' });
    }

    if (decision === 'approve') {
      contract.status = 'Đã hủy';
      contract.cancellation.status = 'Đã duyệt';
      contract.cancellation.adminResponse = adminResponse || 'Yêu cầu hủy đã được chấp thuận.';
    } else if (decision === 'reject') {
      contract.cancellation.status = 'Từ chối';
      contract.cancellation.adminResponse = adminResponse || 'Yêu cầu hủy bị từ chối.';
      // Lưu ý: Không đổi contract.status, vẫn giữ là 'Hiệu lực'
    } else {
      return res.status(400).json({ message: 'Quyết định không hợp lệ (chọn approve hoặc reject).' });
    }

    await contract.save();

    // Gửi thông báo cho User
    await Notification.create({
      user: contract.user,
      message: `Yêu cầu hủy hợp đồng "${contract.product.name}" của bạn đã ${decision === 'approve' ? 'được chấp thuận' : 'bị từ chối'}.`,
      link: `/my-contracts`
    });

    res.status(200).json({ message: 'Đã xử lý yêu cầu hủy thành công.', contract });
  } catch (error) {
    console.error("Lỗi duyệt hủy:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Gửi yêu cầu bồi thường/sử dụng bảo hiểm (User)
// @route   POST /api/contracts/:id/claim
// @access  Private
export const requestClaim = async (req, res) => {
  try {
    const { reason } = req.body;
    const contract = await Contract.findOne({ _id: req.params.id, user: req.user._id });

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    }

    if (contract.status !== 'Hiệu lực') {
      return res.status(400).json({ message: 'Chỉ có thể yêu cầu bồi thường cho hợp đồng đang có hiệu lực.' });
    }

    // Xử lý file đính kèm nếu có
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => file.path);
    }

    contract.claims.push({ reason, attachments });
    await contract.save();

    res.status(200).json({ message: 'Đã gửi yêu cầu bồi thường thành công.', contract });
  } catch (error) {
    console.error("Lỗi yêu cầu bồi thường:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật trạng thái yêu cầu bồi thường (Admin)
// @route   PUT /api/contracts/:id/claims/:claimId
// @access  Private/Admin
export const updateClaimStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });

    const claim = contract.claims.id(req.params.claimId);
    if (!claim) return res.status(404).json({ message: 'Không tìm thấy yêu cầu bồi thường.' });

    claim.status = status;
    claim.adminResponse = adminResponse;
    
    await contract.save();

    // Gửi thông báo
    await Notification.create({
      user: contract.user,
      message: `Yêu cầu bồi thường của bạn (ngày ${new Date(claim.requestDate).toLocaleDateString('vi-VN')}) đã được cập nhật trạng thái: ${status}.`,
      link: `/my-contracts`
    });

    res.status(200).json({ message: 'Cập nhật yêu cầu bồi thường thành công.', contract });
  } catch (error) {
    console.error("Lỗi cập nhật bồi thường:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Xác nhận thanh toán thủ công (User)
// @route   POST /api/contracts/:id/confirm-payment
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.id, user: req.user._id }).populate('product');

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    }

    if (contract.status !== 'Chờ thanh toán') {
      return res.status(400).json({ message: 'Hợp đồng này không ở trạng thái chờ thanh toán.' });
    }

    // Cập nhật trạng thái hợp đồng
    contract.status = 'Hiệu lực';
    contract.paymentDetails = {
      method: 'Manual Confirmation',
      paidAt: new Date(),
      amount: contract.premium,
    };
    await contract.save();

    // Tạo thông báo cho người dùng
    await Notification.create({
      user: contract.user,
      message: `Thanh toán thành công cho hợp đồng "${contract.product.name}". Hợp đồng của bạn đã có hiệu lực.`,
      link: `/my-contracts`
    });

    res.status(200).json({ message: 'Thanh toán thành công!', contract });

  } catch (error) {
    console.error("Lỗi xác nhận thanh toán:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};