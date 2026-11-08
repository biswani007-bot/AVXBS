import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Residential', 'Commercial'],
      default: 'Residential',
    },
    titleWater: {
      type: String,
      default: 'WATER ',
    },
    titleSoftner: {
      type: String,
      default: 'SOFTNER',
    },
    description: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      default: '',
    },
    cardLabel: {
      type: String,
      default: 'CURRENT USER ACCESS',
      trim: true,
    },
    sequenceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    actionLink: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    showInSlider: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ category: 1, sortOrder: 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);

