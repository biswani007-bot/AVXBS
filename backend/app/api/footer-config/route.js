import connectDB from '@/lib/db';
import FooterConfig from '@/models/FooterConfig';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// Standard Default Footer Configuration Inspired by Samsung Multi-Column Structure
const DEFAULT_FOOTER_CONFIG = {
  companyInfo: {
    tagline: 'Engineering Pure Water for Homes & Enterprises',
    description:
      'AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.',
    headquarters: '[Official Company Address - To Be Provided]',
    helpline: '[Toll-Free / Support Phone - To Be Provided]',
    email: '[Official Support Email - To Be Provided]',
    badgeText: 'Engineering Pure Water for Homes & Enterprises',
    regionText: 'India | English',
    copyrightText: '© 2026 AVXBS Solutions. All Rights Reserved.',
  },
  columns: [
    {
      title: 'Residential',
      sectionKey: 'residential',
      order: 1,
      isActive: true,
      links: [
        { label: 'Water Softener', url: '#water-softener-inquiry-section', isExternal: false, order: 1, isActive: true },
        { label: 'WTP Filtration', url: '#water-softener-inquiry-section', isExternal: false, order: 2, isActive: true },
        { label: 'Plumbing Solutions', url: '#water-softener-inquiry-section', isExternal: false, order: 3, isActive: true },
        { label: 'Modular Kitchen Purifiers', url: '#water-softener-inquiry-section', isExternal: false, order: 4, isActive: true },
        { label: 'Sanitary & Bath Fittings', url: '#water-softener-inquiry-section', isExternal: false, order: 5, isActive: true },
      ],
    },
    {
      title: 'Commercial',
      sectionKey: 'commercial',
      order: 2,
      isActive: true,
      links: [
        { label: 'Commercial Softener Plants', url: '#water-softener-inquiry-section', isExternal: false, order: 1, isActive: true },
        { label: 'Industrial WTP', url: '#water-softener-inquiry-section', isExternal: false, order: 2, isActive: true },
        { label: 'Sanitary & Commercial Bath', url: '#water-softener-inquiry-section', isExternal: false, order: 3, isActive: true },
      ],
    },
    {
      title: 'Support',
      sectionKey: 'support',
      order: 3,
      isActive: true,
      links: [
        { label: 'Contact Us', url: '/contact', isExternal: false, order: 1, isActive: true },
        { label: 'Customer Support', url: '#support', isExternal: false, order: 2, isActive: true },
        { label: 'FAQs', url: '#faqs', isExternal: false, order: 3, isActive: true },
        { label: 'Warranty & Service Policy', url: '#warranty', isExternal: false, order: 4, isActive: true },
        { label: 'Privacy Policy', url: '#privacy', isExternal: false, order: 5, isActive: true },
        { label: 'Terms of Service', url: '#terms', isExternal: false, order: 6, isActive: true },
      ],
    },
    {
      title: 'Company',
      sectionKey: 'company',
      order: 4,
      isActive: true,
      links: [
        { label: 'About AVXBS', url: '/about', isExternal: false, order: 1, isActive: true },
        { label: 'Our Services', url: '#services', isExternal: false, order: 2, isActive: true },
        { label: 'Company Information', url: '#company-info', isExternal: false, order: 3, isActive: true },
        { label: 'Careers', url: '#careers', isExternal: false, order: 4, isActive: true },
      ],
    },
  ],
  socialLinks: [
    { platform: 'LinkedIn', url: '#social-linkedin-placeholder', label: 'LinkedIn', order: 1, isActive: true },
    { platform: 'Instagram', url: '#social-instagram-placeholder', label: 'Instagram', order: 2, isActive: true },
    { platform: 'YouTube', url: '#social-youtube-placeholder', label: 'YouTube', order: 3, isActive: true },
    { platform: 'X (Twitter)', url: '#social-twitter-placeholder', label: 'X (Twitter)', order: 4, isActive: true },
  ],
  legalLinks: [
    { label: 'Privacy Policy', url: '#privacy', order: 1, isActive: true },
    { label: 'Terms of Service', url: '#terms', order: 2, isActive: true },
    { label: 'Warranty & Service Policy', url: '#warranty', order: 3, isActive: true },
  ],
  isActive: true,
};

// GET: Retrieve public or admin footer config
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode'); // 'admin' or undefined (public)

    let config = await FooterConfig.findOne({ isActive: true }).lean();

    if (!config) {
      return jsonResponse({
        success: true,
        config: null,
      });
    }

    // If public request and published snapshot exists, serve published snapshot
    if (mode !== 'admin' && config.publishedConfig) {
      return jsonResponse({
        success: true,
        config: {
          ...config.publishedConfig,
          _id: config._id,
          isPublished: config.isPublished,
          updatedAt: config.updatedAt,
        },
      });
    }

    return jsonResponse({
      success: true,
      config,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// POST / PUT: Update or publish footer configuration
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const body = await req.json();
    const { action, section, data } = body;

    let config = await FooterConfig.findOne();
    if (!config) {
      config = await FooterConfig.create(DEFAULT_FOOTER_CONFIG);
    }

    // 1. Action: Publish Changes
    if (action === 'publish') {
      const liveSnapshot = {
        companyInfo: config.companyInfo ? JSON.parse(JSON.stringify(config.companyInfo)) : DEFAULT_FOOTER_CONFIG.companyInfo,
        columns: config.columns ? JSON.parse(JSON.stringify(config.columns)) : DEFAULT_FOOTER_CONFIG.columns,
        socialLinks: config.socialLinks ? JSON.parse(JSON.stringify(config.socialLinks)) : DEFAULT_FOOTER_CONFIG.socialLinks,
        legalLinks: config.legalLinks ? JSON.parse(JSON.stringify(config.legalLinks)) : DEFAULT_FOOTER_CONFIG.legalLinks,
        isActive: true,
      };

      config.publishedConfig = liveSnapshot;
      config.isPublished = true;
      await config.save();

      return jsonResponse({
        success: true,
        message: 'Footer configuration published successfully to live website!',
        config,
      });
    }

    // 2. Action: Reset Changes (Restore from last published configuration)
    if (action === 'reset') {
      if (config.publishedConfig) {
        config.companyInfo = config.publishedConfig.companyInfo || config.companyInfo;
        config.columns = config.publishedConfig.columns || config.columns;
        config.socialLinks = config.publishedConfig.socialLinks || config.socialLinks;
        config.legalLinks = config.publishedConfig.legalLinks || config.legalLinks;
        await config.save();

        return jsonResponse({
          success: true,
          message: 'Footer configuration restored from last published version.',
          config,
        });
      } else {
        // Reset to default
        Object.assign(config, DEFAULT_FOOTER_CONFIG);
        await config.save();

        return jsonResponse({
          success: true,
          message: 'Footer configuration restored to system default settings.',
          config,
        });
      }
    }

    // 3. Action: Save Section (companyInfo, columns, socialLinks, or legalLinks)
    if (action === 'save_section' && section) {
      if (section === 'companyInfo') {
        config.companyInfo = { ...config.companyInfo?.toObject?.() || config.companyInfo, ...data };
      } else if (section === 'columns') {
        config.columns = data;
      } else if (section === 'socialLinks') {
        config.socialLinks = data;
      } else if (section === 'legalLinks') {
        config.legalLinks = data;
      } else {
        return errorResponse(`Invalid section name: ${section}`, 400);
      }

      // Auto-publish live snapshot so changes immediately reflect on the public website
      config.publishedConfig = {
        companyInfo: config.companyInfo ? JSON.parse(JSON.stringify(config.companyInfo)) : DEFAULT_FOOTER_CONFIG.companyInfo,
        columns: config.columns ? JSON.parse(JSON.stringify(config.columns)) : DEFAULT_FOOTER_CONFIG.columns,
        socialLinks: config.socialLinks ? JSON.parse(JSON.stringify(config.socialLinks)) : DEFAULT_FOOTER_CONFIG.socialLinks,
        legalLinks: config.legalLinks ? JSON.parse(JSON.stringify(config.legalLinks)) : DEFAULT_FOOTER_CONFIG.legalLinks,
        isActive: config.isActive !== false,
      };
      config.isPublished = true;

      await config.save();

      return jsonResponse({
        success: true,
        message: `Section "${section}" saved and updated live successfully!`,
        config,
      });
    }

    // 4. Default / Action: Save All Changes
    if (body.companyInfo !== undefined) config.companyInfo = body.companyInfo;
    if (body.columns !== undefined) config.columns = body.columns;
    if (body.socialLinks !== undefined) config.socialLinks = body.socialLinks;
    if (body.legalLinks !== undefined) config.legalLinks = body.legalLinks;
    if (body.isActive !== undefined) config.isActive = body.isActive;

    // Auto-publish live snapshot so changes immediately reflect on the public website
    config.publishedConfig = {
      companyInfo: config.companyInfo ? JSON.parse(JSON.stringify(config.companyInfo)) : DEFAULT_FOOTER_CONFIG.companyInfo,
      columns: config.columns ? JSON.parse(JSON.stringify(config.columns)) : DEFAULT_FOOTER_CONFIG.columns,
      socialLinks: config.socialLinks ? JSON.parse(JSON.stringify(config.socialLinks)) : DEFAULT_FOOTER_CONFIG.socialLinks,
      legalLinks: config.legalLinks ? JSON.parse(JSON.stringify(config.legalLinks)) : DEFAULT_FOOTER_CONFIG.legalLinks,
      isActive: config.isActive !== false,
    };
    config.isPublished = true;

    await config.save();

    return jsonResponse({
      success: true,
      message: 'All footer configurations saved and updated live successfully!',
      config,
    });
  } catch (error) {
    console.error('[POST /api/footer-config] Error:', error);
    return errorResponse(error.message, 500);
  }
}

export const PUT = POST;

