import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ['Residential', 'Commercial', 'Both'],
      required: true,
      default: 'Residential',
    },
    columnId: {
      type: String,
      enum: ['solutions', 'featured', 'explore'],
      required: true,
      default: 'solutions',
      trim: true,
    },
    columnTitle: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    productName: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'inquiry',
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

MenuItemSchema.index({ scope: 1, columnId: 1, sortOrder: 1 });

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
