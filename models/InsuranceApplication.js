import mongoose from 'mongoose';

const insuranceApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    applicationData: {
      // Lưu trữ dữ liệu form dưới dạng một object linh hoạt
      type: Map,
      of: String,
    },
    documents: [
      {
        name: String,
        url: String,
      },
    ],
    status: {
      type: String,
      enum: ['Chờ duyệt', 'Yêu cầu bổ sung', 'Đã duyệt', 'Từ chối'],
      default: 'Chờ duyệt',
    },
    isHidden: { // Thêm trường này để người dùng có thể ẩn hồ sơ
      type: Boolean,
      default: false,
    },
    adminNotes: { type: String }, // Ghi chú của admin cho hồ sơ
  },
  { timestamps: true }
);

export const InsuranceApplication = mongoose.model('InsuranceApplication', insuranceApplicationSchema);