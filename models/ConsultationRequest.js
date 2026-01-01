import mongoose from 'mongoose';

const consultationRequestSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    note: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['Mới', 'Đã liên hệ', 'Hoàn thành'],
      default: 'Mới',
    },
  },
  {
    timestamps: true,
  }
);

export const ConsultationRequest = mongoose.model(
  'ConsultationRequest',
  consultationRequestSchema
);