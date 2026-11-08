import mongoose from 'mongoose';

/**
 * FooterLink Sub-schema
 */
const FooterLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

/**
 * FooterColumn Sub-schema
 */
const FooterColumnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sectionKey: {
      type: String, // 'solutions', 'products', 'support', 'company', etc.
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    links: [FooterLinkSchema],
  },
  { _id: true }
);

/**
 * FooterConfig Schema
 * Manages full multi-column Samsung-style directory footer dynamically
 */
const FooterConfigSchema = new mongoose.Schema(
  {
    companyInfo: {
      tagline: {
        type: String,
        default: 'Engineering Pure Water for Homes & Enterprises',
      },
      description: {
        type: String,
        default: 'AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.',
      },
      headquarters: {
        type: String,
        default: '[Official Company Address - To Be Provided]',
      },
      helpline: {
        type: String,
        default: '[Toll-Free / Support Phone - To Be Provided]',
      },
      email: {
        type: String,
        default: '[Official Support Email - To Be Provided]',
      },
      badgeText: {
        type: String,
        default: 'Engineering Pure Water for Homes & Enterprises',
      },
      regionText: {
        type: String,
        default: 'India | English',
      },
      copyrightText: {
        type: String,
        default: '© 2026 AVXBS Solutions. All Rights Reserved.',
      },
    },
    columns: [FooterColumnSchema],
    socialLinks: [
      {
        platform: { type: String, required: true }, // 'LinkedIn', 'Instagram', 'YouTube', 'X (Twitter)'
        url: { type: String, default: '#' },
        label: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    legalLinks: [
      {
        label: { type: String, required: true },
        url: { type: String, default: '#' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishedConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.FooterConfig) {
  delete mongoose.models.FooterConfig;
}

export default mongoose.models.FooterConfig || mongoose.model('FooterConfig', FooterConfigSchema);

