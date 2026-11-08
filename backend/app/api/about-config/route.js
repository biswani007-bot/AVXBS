import connectDB from '@/lib/db';
import AboutPageConfig from '@/models/AboutPageConfig';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

const DEFAULT_ABOUT_CONFIG = {
  header: {
    pageTitle: 'About',
    highlightWord: 'AVXBS',
    subtitle: 'Delivering advanced unique solutions for residential and commercial infrastructures.',
    titleColor: '#545454',
    highlightColor: '#545454',
    alignment: 'center',
    isEnabled: true,
  },
  intro: {
    sectionHeading: 'Company Introduction & Overview',
    leadParagraph: 'AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.',
    additionalParagraphs: [
      'Water hardness causes persistent scale deposition, plumbing deterioration, reduced thermal efficiency in water heaters, and premature appliance failure. At AVXBS, we merge precision chemical engineering with intelligent automated flow sensing to eliminate calcium and magnesium hardness at the point of entry.',
      'From luxury residences and high-rise apartments to industrial boiler feeds and commercial hospitality complexes, our engineered solutions protect equipment, elevate water quality, and optimize resource efficiency.',
    ],
    image: '/images/about/about-water-treatment.jpg',
    imageAlt: 'AVXBS Advanced Industrial Water Treatment & Purification Engineering Facility',
    imagePosition: 'right',
    metrics: [
      { value: '99.8%', label: 'Scale Reduction', order: 1, isActive: true },
      { value: '50%', label: 'Lower Salt Consumption', order: 2, isActive: true },
      { value: '100%', label: 'Food-Grade Resins', order: 3, isActive: true },
    ],
    isEnabled: true,
  },
  missionVision: {
    sectionHeading: 'Our Core Purpose',
    cards: [
      {
        type: 'mission',
        title: 'Our Mission',
        description: 'To engineer pure, scale-free water for homes and enterprises, protecting plumbing infrastructure and optimizing energy efficiency through intelligent, eco-conscious water treatment technology.',
        icon: 'Workflow',
        order: 1,
        isActive: true,
      },
      {
        type: 'vision',
        title: 'Our Vision',
        description: 'To become the industry benchmark in next-generation water softening and purification solutions, integrating smart automated controls, high-capacity ion exchange, and zero-compromise environmental stewardship.',
        icon: 'TrendingUp',
        order: 2,
        isActive: true,
      },
    ],
    isEnabled: true,
  },
  solutions: {
    sectionHeading: 'Water Treatment Solutions',
    sectionSubheading: 'Comprehensive water engineering platforms built for residential luxury and commercial performance.',
    cards: [
      {
        title: 'Whole-House Water Softeners',
        description: 'High-efficiency automated softening systems engineered to eliminate hard calcium and magnesium minerals, preventing limescale accumulation, extending appliance longevity, and providing silky soft water.',
        icon: 'Droplets',
        image: '',
        order: 1,
        isActive: true,
      },
      {
        title: 'Commercial Softening Plants',
        description: 'Heavy-duty duplex and triplex ion-exchange softening plants engineered for hotels, hospitals, manufacturing facilities, and HVAC boiler feed requiring continuous non-stop softened output.',
        icon: 'Layers',
        image: '',
        order: 2,
        isActive: true,
      },
      {
        title: 'Iron & Turbidity Removal',
        description: 'Advanced catalytic and multi-media filtration columns that extract dissolved iron, rust stains, suspended solids, and particulate matter from borewell and groundwater sources.',
        icon: 'ShieldCheck',
        image: '',
        order: 3,
        isActive: true,
      },
      {
        title: 'Reverse Osmosis & UV Disinfection',
        description: 'High-recovery semi-permeable membrane filtration paired with germicidal ultraviolet sterilization to neutralize microbiological contaminants and deliver purified drinking standards.',
        icon: 'Award',
        image: '',
        order: 4,
        isActive: true,
      },
    ],
    isEnabled: true,
  },
  bottomCta: {
    heading: 'Ready to protect your water infrastructure?',
    description: 'Speak directly with an AVXBS water treatment specialist to assess your water hardness and specify the optimal system.',
    primaryBtnText: 'Contact Engineering',
    primaryBtnUrl: '/contact',
    secondaryBtnText: 'Return to Home',
    secondaryBtnUrl: '/',
    backgroundColor: '#0d1527',
    textColor: '#f8fafc',
    isEnabled: true,
  },
  isPublished: true,
};

// GET: Retrieve About Us content directly from database
export async function GET(req) {
  try {
    await connectDB();

    let config = await AboutPageConfig.findOne().lean();

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
    console.error('[GET /api/about-config] Error:', error);
    return errorResponse(error.message, 500);
  }
}

// POST: Save About Us content directly to database (Admin only)
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const body = await req.json();
    const { action, section, data } = body;

    let config = await AboutPageConfig.findOne();
    if (!config) {
      config = await AboutPageConfig.create(DEFAULT_ABOUT_CONFIG);
    }

    // Save Individual Section if specified
    if (action === 'save_section' && section) {
      if (['header', 'intro', 'missionVision', 'solutions', 'bottomCta'].includes(section)) {
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
    if (body.intro !== undefined) config.intro = body.intro;
    if (body.missionVision !== undefined) config.missionVision = body.missionVision;
    if (body.solutions !== undefined) config.solutions = body.solutions;
    if (body.bottomCta !== undefined) config.bottomCta = body.bottomCta;
    config.isPublished = true;

    await config.save();

    return jsonResponse({
      success: true,
      message: 'About Us page content saved successfully to database!',
      config,
    });
  } catch (error) {
    console.error('[POST /api/about-config] Error:', error);
    return errorResponse(error.message, 500);
  }
}

export const PUT = POST;

