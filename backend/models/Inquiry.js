import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Residential', 'Commercial'],
      required: [true, 'Property type is required'],
      default: 'Residential',
    },
    product: {
      type: String,
      default: 'Water Softener',
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    waterIssue: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Solved', 'Not Solved', 'Contacted', 'Resolved', 'Closed'],
      default: 'New',
    },
    source: {
      type: String,
      default: 'Drawer',
    },
  },
  {
    timestamps: true,
  }
);

InquirySchema.index({ email: 1 });
InquirySchema.index({ mobile: 1 });
InquirySchema.index({ createdAt: -1 });

if (mongoose.models.Inquiry) {
  delete mongoose.models.Inquiry;
}

export default mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);

