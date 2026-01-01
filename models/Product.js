import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true }, // Nhà cung cấp (Bảo Việt, Prudential...)
    category: {
      type: String,
      required: true,
      enum: ['Sức khỏe', 'Nhân thọ', 'Hưu Trí', 'Giáo dục', 'Du lịch'],
    },
    price: { type: Number, required: true, default: 0 }, // Phí bảo hiểm (ví dụ: theo năm)
    description: { type: String, required: true },
    imageUrl: {
      type: String,
      default: '/images/placeholder.png',
    },
    insuredObject: { type: String, default: 'Mọi công dân Việt Nam' }, // Đối tượng bảo hiểm
    benefits: { type: String, default: '' }, // Quyền lợi, có thể nhập nhiều dòng
    annualInsurableAmount: { type: Number, default: 0 }, // Số tiền bảo hiểm
    insuranceTerm: { type: String, default: '1 năm' }, // Thời hạn bảo hiểm
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model('Product', productSchema);