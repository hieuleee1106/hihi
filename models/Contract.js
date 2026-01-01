import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'InsuranceApplication',
    unique: true, // Mỗi hồ sơ chỉ có một hợp đồng
  },
  contractNumber: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  premium: { // Phí bảo hiểm
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Chờ thanh toán', 'Hiệu lực', 'Hết hạn', 'Thanh toán thất bại', 'Đã hủy'],
    default: 'Chờ thanh toán',
  },
  paymentDetails: {
    type: Object, // Lưu trữ thông tin chi tiết từ VNPay
    default: {},
  },
  // Thông tin yêu cầu hủy hợp đồng
  cancellation: {
    isRequested: { type: Boolean, default: false },
    reason: { type: String },
    requestedAt: { type: Date },
    status: {
      type: String,
      enum: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'],
      default: 'Chờ duyệt'
    },
    adminResponse: { type: String } // Lý do từ chối hoặc ghi chú của admin
  },
  // Thông tin yêu cầu bồi thường / sử dụng bảo hiểm
  claims: [{
    requestDate: { type: Date, default: Date.now },
    reason: { type: String, required: true },
    amount: { type: Number }, // Số tiền ước tính
    attachments: [{ type: String }], // Danh sách đường dẫn ảnh/tài liệu minh chứng
    status: {
      type: String,
      enum: ['Chờ xử lý', 'Đã duyệt', 'Từ chối'],
      default: 'Chờ xử lý'
    },
    adminResponse: { type: String }
  }]
}, {
  timestamps: true,
});

export const Contract = mongoose.model('Contract', contractSchema);