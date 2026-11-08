import connectDB from '@/lib/db';
import HeroSlide from '@/models/HeroSlide';
import SiteSetting from '@/models/SiteSetting';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// Default 5 AI-Generated Premium Hero Slides matching user specifications
const DEFAULT_SLIDES = [
  {
    title: 'Residential Water Purification System',
    mediaType: 'image',
    mediaUrl: '/images/hero-enhanced/hero-residential-purifier.jpg',
    posterUrl: '',
    altText: 'Premium modern home kitchen with advanced residential water purification system',
    order: 0,
    isActive: true,
  },
  {
    title: 'Industrial Water Treatment Plant',
    mediaType: 'image',
    mediaUrl: '/images/hero-enhanced/hero-industrial-treatment.jpg',
    posterUrl: '',
    altText: 'Large-scale industrial water purification plant with stainless steel filtration vessels',
    order: 1,
    isActive: true,
  },
  {
    title: 'Smart Automated Water Softener',
    mediaType: 'image',
    mediaUrl: '/images/hero-enhanced/hero-smart-water-softener.jpg',
    posterUrl: '',
    altText: 'Modern automated water softening system with electronic digital display controls',
    order: 2,
    isActive: true,
  },
  {
    title: 'Pure Drinking Water Purity Flow',
    mediaType: 'image',
    mediaUrl: '/images/hero-enhanced/hero-pure-drinking-water.jpg',
    posterUrl: '',
    altText: 'Crystal clean drinking water flowing smoothly from modern chrome faucet into a glass',
    order: 3,
    isActive: true,
  },
  {
    title: 'Commercial Reverse Osmosis (RO) Plant',
    mediaType: 'image',
    mediaUrl: '/images/hero-enhanced/hero-commercial-ro-plant.jpg',
    posterUrl: '',
    altText: 'Advanced commercial reverse osmosis membrane filtration equipment in industrial utility facility',
    order: 4,
    isActive: true,
  },
];

const DEFAULT_BANNER_CONFIG = {
  autoplay: true,
  slideDuration: 3000,
  transitionDuration: 450,
  transitionEffect: 'fade', // 'fade' | 'slide'
  showNavigationArrows: true,
  showIndicators: true,
};

// GET: Retrieve hero banner slides and settings
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    const filter = all ? {} : { isActive: true };
    let slides = await HeroSlide.find(filter).sort({ order: 1, createdAt: -1 });

    // Ensure slides reference enhanced hero images in hero-enhanced directory
    if (slides && slides.length > 0) {
      for (const slide of slides) {
        let changed = false;
        if (slide.mediaUrl === '/assets/hero-water-tap-glass.jpg') {
          slide.mediaUrl = '/images/hero-enhanced/hero-water-tap-glass.jpg';
          changed = true;
        }
        if (slide.posterUrl === '/assets/hero-water-tap-glass.jpg') {
          slide.posterUrl = '/images/hero-enhanced/hero-water-tap-glass.jpg';
          changed = true;
        }
        if (changed) {
          await HeroSlide.findByIdAndUpdate(slide._id, {
            mediaUrl: slide.mediaUrl,
            posterUrl: slide.posterUrl,
          });
        }
      }
    }

    // Retrieve hero banner settings from SiteSetting
    let bannerSettings = null;
    try {
      const savedConfig = await SiteSetting.findOne({ key: 'hero_banner_settings' });
      if (savedConfig && savedConfig.value) {
        bannerSettings = savedConfig.value;
      }
    } catch (e) {}

    return jsonResponse({
      success: true,
      slides: slides || [],
      settings: bannerSettings,
    });
  } catch (error) {
    return jsonResponse({
      success: true,
      slides: DEFAULT_SLIDES,
      settings: DEFAULT_BANNER_CONFIG,
      fallback: true,
      error: error.message,
    });
  }
}

// POST: Add new hero slide (Admin only)
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const body = await req.json();

    if (!body.mediaUrl) {
      return errorResponse('mediaUrl is required', 400);
    }

    // If order is not provided, place at end
    let order = body.order;
    if (typeof order !== 'number') {
      const highest = await HeroSlide.findOne().sort({ order: -1 });
      order = highest ? (highest.order || 0) + 1 : 0;
    }

    const slide = await HeroSlide.create({
      title: body.title || 'Hero Banner Slide',
      mediaType: body.mediaType === 'video' ? 'video' : 'image',
      mediaUrl: body.mediaUrl,
      posterUrl: body.posterUrl || '',
      altText: body.altText || '',
      order,
      isActive: body.isActive !== undefined ? body.isActive : true,
      overlayText: body.overlayText || '',
    });

    return jsonResponse({
      success: true,
      message: 'Slide created successfully',
      slide,
    }, 201);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// PUT: Bulk reorder or update settings (Admin only)
export async function PUT(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const body = await req.json();

    // 1. Reordering slides
    if (Array.isArray(body.reorder)) {
      const updatePromises = body.reorder.map((item, index) =>
        HeroSlide.findByIdAndUpdate(item.id, { order: index }, { new: true })
      );
      await Promise.all(updatePromises);
    }

    // 2. Updating banner settings
    if (body.settings) {
      await SiteSetting.findOneAndUpdate(
        { key: 'hero_banner_settings' },
        {
          key: 'hero_banner_settings',
          value: body.settings,
          description: 'Hero banner autoplay, duration, transition and UI settings',
          group: 'hero',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return jsonResponse({
      success: true,
      message: 'Banner configuration updated successfully',
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

