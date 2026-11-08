import connectDB from '@/lib/db';
import ContactPageConfig from '@/models/ContactPageConfig';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

const DEFAULT_CONTACT_CONFIG = {
  header: {
    pageTitle: 'Contact',
    highlightWord: 'AVXBS',
    subtitle: 'Get in touch with our water softening engineers for custom residential installations, commercial site evaluations, or prompt technical service.',
    titleColor: '#545454',
    highlightColor: '#545454',
    alignment: 'center',
    isEnabled: true,
  },
  infoPanel: {
    sectionHeading: 'Headquarters & Support',
    description: 'Our dedicated water treatment engineering team is available to assist you with system sizing, water test analysis, and installation queries.',
    noticeBanner: 'Note: Official contact credentials pending user confirmation. For immediate inquiries, please submit the form.',
    cards: [
      {
        title: 'Corporate Headquarters',
        content: '[Official Company Address - To Be Provided]',
        subtext: 'Regional dispatch & central engineering facility',
        icon: 'MapPin',
        order: 1,
        isActive: true,
      },
      {
        title: 'Helpline & Direct Line',
        content: '[Toll-Free / Support Phone - To Be Provided]',
        subtext: 'Toll-free customer support & technical inquiries',
        icon: 'Phone',
        order: 2,
        isActive: true,
      },
      {
        title: 'Electronic Mail',
        content: '[Official Support Email - To Be Provided]',
        subtext: 'Direct response within 24 business hours',
        icon: 'Mail',
        order: 3,
        isActive: true,
      },
      {
        title: 'Operating Hours',
        content: 'Monday – Saturday: 9:00 AM – 6:00 PM IST',
        subtext: 'Sunday: Closed for routine maintenance',
        icon: 'Clock',
        order: 4,
        isActive: true,
      },
    ],
    backBtnText: 'Return to Home Overview',
    backBtnUrl: '/',
    isEnabled: true,
  },
  formConfig: {
    heading: 'Request Engineering Consultation',
    subtitle: 'Complete the form below to connect with an AVXBS certified water engineer.',
    propertyTypes: ['Residential', 'Commercial'],
    nameField: {
      label: 'Full Name',
      placeholder: 'Enter your full name',
      isRequired: true,
    },
    mobileField: {
      label: 'Mobile Number',
      placeholder: 'e.g. 9876543210',
      isRequired: true,
    },
    emailField: {
      label: 'Email Address',
      placeholder: 'name@example.com',
      isRequired: true,
    },
    remarksField: {
      label: 'Remarks / Water Problem Description',
      placeholder: 'Describe your water requirements, hardness symptoms, or site details (optional)...',
      isRequired: false,
    },
    submitBtnText: 'Submit Consultation Request',
    successMessage: 'Thank you! Your inquiry has been securely recorded. An AVXBS water treatment specialist will contact you shortly.',
    errorMessage: 'Failed to submit inquiry. Please review your details and try again.',
    isEnabled: true,
  },
  isPublished: true,
};

// GET: Retrieve Contact Us content directly from database
export async function GET(req) {
  try {
    await connectDB();

    let config = await ContactPageConfig.findOne().lean();

    if (!config) {
      return jsonResponse({
        success: true,
        config: null,
      });
    }

    return jsonResponse({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[GET /api/contact-config] Error:', error);
    return errorResponse(error.message, 500);
  }
}

// POST: Save Contact Us content directly to database (Admin only)
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const body = await req.json();
    const { action, section, data } = body;

    let config = await ContactPageConfig.findOne();
    if (!config) {
      config = await ContactPageConfig.create(DEFAULT_CONTACT_CONFIG);
    }

    // Save Individual Section if specified
    if (action === 'save_section' && section) {
      if (['header', 'infoPanel', 'formConfig'].includes(section)) {
        config[section] = data;
        config.isPublished = true;
        await config.save();
        return jsonResponse({
          success: true,
          message: `Section "${section}" saved successfully to database!`,
          config,
        });
      }
      return errorResponse(`Invalid section name: ${section}`, 400);
    }

    // Default: Save All Changes directly to the database
    if (body.header !== undefined) config.header = body.header;
    if (body.infoPanel !== undefined) config.infoPanel = body.infoPanel;
    if (body.formConfig !== undefined) config.formConfig = body.formConfig;
    config.isPublished = true;

    await config.save();

    return jsonResponse({
      success: true,
      message: 'Contact Us page content saved successfully to database!',
      config,
    });
  } catch (error) {
    console.error('[POST /api/contact-config] Error:', error);
    return errorResponse(error.message, 500);
  }
}

export const PUT = POST;

