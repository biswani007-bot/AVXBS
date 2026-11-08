import mongoose from 'mongoose';

const HighlightCardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, required: true },
  category: { type: String, default: '' },
  url: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const SolutionItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Droplets' },
  url: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const UsefulLinkSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  url: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const HelplineSchema = new mongoose.Schema({
  heading: { type: String, default: 'Residential Engineering Support' },
  mainTitle: { type: String, default: 'NEED EXPERT GUIDANCE?' },
  label: { type: String, default: 'Residential Engineering Support' },
  text: {
    type: String,
    default: 'Connect with our certified water treatment specialists for personalized home water solutions, system sizing and installation guidance.',
  },
  phone: { type: String, default: '+91 1800 200 4882' },
  btnText: { type: String, default: 'Get Free Consultation →' },
  btnUrl: { type: String, default: '#water-softener-inquiry-section' },
  icon: { type: String, default: 'headset' }, // 'headset', 'phone', 'shield', 'award', 'sparkles'
  bgGradient: { type: String, default: 'navy-blue' }, // 'navy-blue', 'soft-blue', 'pure-navy'
  accentColor: { type: String, default: '#38bdf8' },
  order: { type: Number, default: 1 },
  isEnabled: { type: Boolean, default: true },
});

const CtaSchema = new mongoose.Schema({
  text: { type: String, default: 'Get Free Consultation' },
  url: { type: String, default: '#water-softener-inquiry-section' },
  isEnabled: { type: Boolean, default: true },
});

const MegaMenuConfigSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ['Residential', 'Commercial'],
      required: true,
      unique: true,
    },
    highlightsHeading: {
      type: String,
      default: '',
    },
    solutionsHeading: {
      type: String,
      default: '',
    },
    highlights: [HighlightCardSchema],
    solutions: [SolutionItemSchema],
    usefulLinks: [UsefulLinkSchema],
    helpline: {
      type: HelplineSchema,
      default: () => ({}),
    },
    cta: {
      type: CtaSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.MegaMenuConfig) {
  delete mongoose.models.MegaMenuConfig;
}

export default mongoose.models.MegaMenuConfig ||
  mongoose.model('MegaMenuConfig', MegaMenuConfigSchema);

