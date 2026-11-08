import mongoose from 'mongoose';

/**
 * ContactPageConfig Schema
 * Manages all content for /contact page
 */
const ContactInfoCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    subtext: { type: String, default: '' },
    icon: { type: String, default: 'MapPin' }, // 'MapPin', 'Phone', 'Mail', 'Clock'
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const ContactPageConfigSchema = new mongoose.Schema(
  {
    // A. Page Header
    header: {
      pageTitle: { type: String, default: 'Contact' },
      highlightWord: { type: String, default: 'AVXBS' },
      subtitle: {
        type: String,
        default: 'Get in touch with our water softening engineers for custom residential installations, commercial site evaluations, or prompt technical service.',
      },
      titleColor: { type: String, default: '#545454' },
      highlightColor: { type: String, default: '#545454' },
      alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
      isEnabled: { type: Boolean, default: true },
    },

    // B. Headquarters & Support Info Panel
    infoPanel: {
      sectionHeading: { type: String, default: 'Headquarters & Support' },
      description: {
        type: String,
        default: 'Our dedicated water treatment engineering team is available to assist you with system sizing, water test analysis, and installation queries.',
      },
      noticeBanner: {
        type: String,
        default: 'Note: Official contact credentials pending user confirmation. For immediate inquiries, please submit the form.',
      },
      cards: [ContactInfoCardSchema],
      backBtnText: { type: String, default: 'Return to Home Overview' },
      backBtnUrl: { type: String, default: '/' },
      isEnabled: { type: Boolean, default: true },
    },

    // C. Contact Inquiry Form Settings
    formConfig: {
      heading: { type: String, default: 'Request Engineering Consultation' },
      subtitle: {
        type: String,
        default: 'Complete the form below to connect with an AVXBS certified water engineer.',
      },
      propertyTypes: {
        type: [String],
        default: ['Residential', 'Commercial'],
      },
      nameField: {
        label: { type: String, default: 'Full Name' },
        placeholder: { type: String, default: 'Enter your full name' },
        isRequired: { type: Boolean, default: true },
      },
      mobileField: {
        label: { type: String, default: 'Mobile Number' },
        placeholder: { type: String, default: 'e.g. 9876543210' },
        isRequired: { type: Boolean, default: true },
      },
      emailField: {
        label: { type: String, default: 'Email Address' },
        placeholder: { type: String, default: 'name@example.com' },
        isRequired: { type: Boolean, default: true },
      },
      remarksField: {
        label: { type: String, default: 'Remarks / Water Problem Description' },
        placeholder: { type: String, default: 'Describe your water requirements, hardness symptoms, or site details (optional)...' },
        isRequired: { type: Boolean, default: false },
      },
      submitBtnText: { type: String, default: 'Submit Consultation Request' },
      successMessage: {
        type: String,
        default: 'Thank you! Your inquiry has been securely recorded. An AVXBS water treatment specialist will contact you shortly.',
      },
      errorMessage: {
        type: String,
        default: 'Failed to submit inquiry. Please review your details and try again.',
      },
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

if (mongoose.models.ContactPageConfig) {
  delete mongoose.models.ContactPageConfig;
}

export default mongoose.models.ContactPageConfig || mongoose.model('ContactPageConfig', ContactPageConfigSchema);

