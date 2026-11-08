import mongoose from 'mongoose';

const InquirySectionSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: true,
    },
    // Left Image Settings
    imageUrl: {
      type: String,
      default: '/images/hero-enhanced/pure-faucet-glass.jpg',
    },
    imageAlt: {
      type: String,
      default: 'Premium modern water purification faucet pouring crystal-clear drinking water into a transparent glass goblet',
    },
    imagePosition: {
      type: String,
      enum: ['left', 'right'],
      default: 'left',
    },
    imageFit: {
      type: String,
      enum: ['cover', 'contain'],
      default: 'contain',
    },
    imageMaxHeight: {
      type: Number,
      default: 480,
    },

    // Heading Line 1: "Now Just"
    line1Text1: { type: String, default: 'Now' },
    line1Color1: { type: String, default: '#171B2D' }, // Deep Navy/Black
    line1Text2: { type: String, default: 'Just' },
    line1Color2: { type: String, default: 'gradient' }, // AVXBS Logo Gradient

    // Heading Line 2: "Put Your Inquiry"
    line2Text1: { type: String, default: 'Put Your' },
    line2Color1: { type: String, default: '#171B2D' }, // Deep Navy/Black
    line2Text2: { type: String, default: 'Inquiry' },
    line2Color2: { type: String, default: 'gradient' }, // AVXBS Logo Gradient

    // Heading Line 3: "And Get the Solution."
    line3Text1: { type: String, default: 'And Get the' },
    line3Color1: { type: String, default: '#171B2D' }, // Deep Navy/Black
    line3Text2: { type: String, default: 'Solution.' },
    line3Color2: { type: String, default: 'gradient' }, // AVXBS Logo Gradient

    // Heading Line 4: "At Door step"
    line4Text1: { type: String, default: 'At' },
    line4Color1: { type: String, default: '#171B2D' }, // Deep Navy/Black
    line4Text2: { type: String, default: 'Door step' },
    line4Color2: { type: String, default: '#087CC1' }, // Corporate Blue Accent

    // Supporting Description
    description: {
      type: String,
      default:
        'Engineered whole-house and commercial water purification, softening, and filtration solutions installed directly at your doorstep.',
    },
    showDescription: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.InquirySection) {
  delete mongoose.models.InquirySection;
}

export default mongoose.models.InquirySection ||
  mongoose.model('InquirySection', InquirySectionSchema);

