import mongoose from 'mongoose';

const TestimonialSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    designation: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['Residential', 'Commercial'],
      default: 'Residential',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      default: 5,
    },
    feedback: {
      type: String,
      required: [true, 'Customer feedback is required'],
      trim: true,
    },
    avatarColor: {
      type: String,
      default: '', // Optional custom background gradient/hex for initials avatar
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
      trim: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: false, // Default new customer submissions to false
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'pending',
    },
    isSample: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

TestimonialSchema.index({ showOnHomepage: 1, isActive: 1, displayOrder: 1, createdAt: -1 });
TestimonialSchema.index({ isActive: 1 });

if (mongoose.models.Testimonial) {
  delete mongoose.models.Testimonial;
}

export default mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
