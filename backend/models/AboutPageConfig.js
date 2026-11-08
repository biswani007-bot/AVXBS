import mongoose from 'mongoose';

/**
 * AboutPageConfig Schema
 * Manages all content for /about page
 */
const HighlightMetricSchema = new mongoose.Schema(
  {
    value: { type: String, default: '99.8%' },
    label: { type: String, default: 'Scale Reduction' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const MissionVisionCardSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['mission', 'vision', 'custom'], default: 'mission' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Workflow' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const SolutionFeatureCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Droplets' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const AboutPageConfigSchema = new mongoose.Schema(
  {
    // A. Page Header
    header: {
      pageTitle: { type: String, default: 'About' },
      highlightWord: { type: String, default: 'AVXBS' },
      subtitle: {
        type: String,
        default: 'Delivering advanced unique solutions for residential and commercial infrastructures.',
      },
      titleColor: { type: String, default: '#545454' },
      highlightColor: { type: String, default: '#545454' },
      alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
      isEnabled: { type: Boolean, default: true },
    },

    // B. Company Introduction & Overview
    intro: {
      sectionHeading: { type: String, default: 'Company Introduction & Overview' },
      leadParagraph: {
        type: String,
        default: 'AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.',
      },
      additionalParagraphs: {
        type: [String],
        default: [
          'Water hardness causes persistent scale deposition, plumbing deterioration, reduced thermal efficiency in water heaters, and premature appliance failure. At AVXBS, we merge precision chemical engineering with intelligent automated flow sensing to eliminate calcium and magnesium hardness at the point of entry.',
          'From luxury residences and high-rise apartments to industrial boiler feeds and commercial hospitality complexes, our engineered solutions protect equipment, elevate water quality, and optimize resource efficiency.',
        ],
      },
      image: { type: String, default: '/images/about/about-water-treatment.jpg' },
      imageAlt: {
        type: String,
        default: 'AVXBS Advanced Industrial Water Treatment & Purification Engineering Facility',
      },
      imagePosition: { type: String, enum: ['right', 'left'], default: 'right' },
      metrics: [HighlightMetricSchema],
      isEnabled: { type: Boolean, default: true },
    },

    // C. Mission & Vision
    missionVision: {
      sectionHeading: { type: String, default: 'Our Core Purpose' },
      cards: [MissionVisionCardSchema],
      isEnabled: { type: Boolean, default: true },
    },

    // D. Water Treatment Solutions
    solutions: {
      sectionHeading: { type: String, default: 'Water Treatment Solutions' },
      sectionSubheading: {
        type: String,
        default: 'Comprehensive water engineering platforms built for residential luxury and commercial performance.',
      },
      cards: [SolutionFeatureCardSchema],
      isEnabled: { type: Boolean, default: true },
    },

    // E. Bottom CTA Section
    bottomCta: {
      heading: { type: String, default: 'Ready to protect your water infrastructure?' },
      description: {
        type: String,
        default: 'Speak directly with an AVXBS water treatment specialist to assess your water hardness and specify the optimal system.',
      },
      primaryBtnText: { type: String, default: 'Contact Engineering' },
      primaryBtnUrl: { type: String, default: '/contact' },
      secondaryBtnText: { type: String, default: 'Return to Home' },
      secondaryBtnUrl: { type: String, default: '/' },
      backgroundColor: { type: String, default: '#0d1527' },
      textColor: { type: String, default: '#f8fafc' },
      isEnabled: { type: Boolean, default: true },
    },

    // Publication state
    isPublished: { type: Boolean, default: true },
    publishedConfig: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.AboutPageConfig) {
  delete mongoose.models.AboutPageConfig;
}

export default mongoose.models.AboutPageConfig || mongoose.model('AboutPageConfig', AboutPageConfigSchema);

