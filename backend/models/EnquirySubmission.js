import mongoose from 'mongoose';

const EnquirySubmissionSchema = new mongoose.Schema(
  {
    tabId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnquiryTab',
      required: false,
    },
    tabName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Residential', 'Commercial', 'Both'],
      default: 'Residential',
      required: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'],
      default: 'New',
    },
    notes: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

EnquirySubmissionSchema.index({ createdAt: -1 });
EnquirySubmissionSchema.index({ category: 1 });
EnquirySubmissionSchema.index({ status: 1 });
EnquirySubmissionSchema.index({ tabName: 1 });

export default mongoose.models.EnquirySubmission || mongoose.model('EnquirySubmission', EnquirySubmissionSchema);

