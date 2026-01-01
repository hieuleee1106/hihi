import { ConsultationRequest } from '../models/ConsultationRequest.js';

// @desc    Tạo yêu cầu tư vấn mới
// @route   POST /api/consultations
// @access  Public
export const createConsultation = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, product, note } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: 'Vui lòng nhập Họ tên và Số điện thoại.' });
    }

    const newRequest = await ConsultationRequest.create({
      customerName, customerPhone, customerEmail, product, note
    });

    res.status(201).json({ message: 'Yêu cầu của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.' });
  } catch (error) {
    console.error('Lỗi tạo yêu cầu tư vấn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Xóa yêu cầu tư vấn (Admin)
// @route   DELETE /api/consultations/:id
// @access  Private/Admin
export const deleteConsultation = async (req, res) => {
  try {
    const request = await ConsultationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn.' });
    }

    await request.deleteOne();
    res.status(200).json({ message: 'Đã xóa yêu cầu tư vấn.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả yêu cầu tư vấn (cho Admin)
// @route   GET /api/consultations
// @access  Private/Admin
export const getConsultations = async (req, res) => {
  try {
    // Sắp xếp để yêu cầu mới nhất lên đầu và lấy thông tin sản phẩm
    const requests = await ConsultationRequest.find({})
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật trạng thái yêu cầu (cho Admin)
// @route   PUT /api/consultations/:id
// @access  Private/Admin
export const updateConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ConsultationRequest.findById(req.params.id);

    if (request) {
      request.status = status;
      const updatedRequest = await request.save();
      res.json(updatedRequest);
    } else {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};