import mongoose from 'mongoose';

const HeroSlideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    posterUrl: {
      type: String,
      default: '',
      trim: true,
    },
    altText: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    overlayText: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.HeroSlide || mongoose.model('HeroSlide', HeroSlideSchema);

