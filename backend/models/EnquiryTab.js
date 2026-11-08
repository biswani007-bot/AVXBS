import mongoose from 'mongoose';

const CategoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    iconName: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: true, timestamps: true }
);

const FormFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'tel', 'email', 'textarea', 'number', 'select'],
      default: 'text',
    },
    placeholder: {
      type: String,
      default: '',
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const EnquiryTabSchema = new mongoose.Schema(
  {
    tabName: {
      type: String,
      required: [true, 'Tab name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Residential', 'Commercial', 'Both'],
      default: 'Both',
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    items: {
      type: [CategoryItemSchema],
      default: [],
    },
    fields: {
      type: [FormFieldSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
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

export default mongoose.models.EnquiryTab || mongoose.model('EnquiryTab', EnquiryTabSchema);
