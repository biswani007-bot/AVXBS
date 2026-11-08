import connectDB from '@/lib/db';
import MegaMenuConfig from '@/models/MegaMenuConfig';
import Product from '@/models/Product';
import HeroSlide from '@/models/HeroSlide';
import InquirySection from '@/models/InquirySection';
import SiteSetting from '@/models/SiteSetting';
import { jsonResponse, errorResponse } from '@/lib/api-utils';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return jsonResponse({
        success: true,
        query: '',
        results: [],
        total: 0
      });
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results = [];

    // 1. Search MegaMenuConfig (Highlights, Solutions, Useful Links)
    const menus = await MegaMenuConfig.find({}).lean();
    menus.forEach(menu => {
      const scope = menu.scope || 'Residential';

      // Check Solutions
      if (Array.isArray(menu.solutions)) {
        menu.solutions.forEach(sol => {
          if (sol.isActive !== false && regex.test(sol.title)) {
            results.push({
              id: `sol-${sol._id || sol.id || sol.title}`,
              title: sol.title,
              category: `${scope} Solution`,
              scope,
              description: `Precision-engineered ${sol.title.toLowerCase()} system for ${scope.toLowerCase()} infrastructures.`,
              type: 'solution',
              target: 'slider',
              solutionName: sol.title,
              badge: scope
            });
          }
        });
      }

      // Check Highlights
      if (Array.isArray(menu.highlights)) {
        menu.highlights.forEach(hl => {
          if (hl.isActive !== false) {
            const matchesTitle = regex.test(hl.title);
            const matchesSub = hl.subtitle && regex.test(hl.subtitle);
            const matchesDesc = hl.description && regex.test(hl.description);
            if (matchesTitle || matchesSub || matchesDesc) {
              results.push({
                id: `hl-${hl._id || hl.id || hl.title}`,
                title: hl.title,
                category: `${scope} Highlight`,
                scope,
                subtitle: hl.subtitle,
                description: hl.subtitle || hl.description || `Specialized ${scope.toLowerCase()} water technology system.`,
                image: hl.image,
                type: 'highlight',
                target: 'slider',
                solutionName: hl.title.replace(' Systems', '').replace(' Plants', '').trim(),
                badge: scope
              });
            }
          }
        });
      }

      // Check Useful Links
      if (Array.isArray(menu.usefulLinks)) {
        menu.usefulLinks.forEach(link => {
          if (link.isActive !== false && (regex.test(link.title) || (link.desc && regex.test(link.desc)))) {
            results.push({
              id: `link-${link._id || link.id || link.title}`,
              title: link.title,
              category: `${scope} Technical Guide`,
              scope,
              description: link.desc || 'Technical engineering guide and sizing consultation.',
              type: 'guide',
              target: 'inquiry',
              solutionName: link.title,
              badge: scope
            });
          }
        });
      }
    });

    // 2. Search Products
    const products = await Product.find({
      $or: [
        { titleWater: regex },
        { titleSoftner: regex },
        { category: regex },
        { description: regex },
        { 'features.title': regex },
        { 'features.description': regex }
      ]
    }).lean();

    products.forEach(prod => {
      const fullTitle = `${prod.titleWater || ''} ${prod.titleSoftner || ''}`.trim() || prod.category;
      results.push({
        id: `prod-${prod._id}`,
        title: fullTitle,
        category: `${prod.category || 'Water Treatment'} Product`,
        scope: prod.category || 'Residential',
        description: prod.description || `High-capacity ${prod.capacity || 'precision'} water conditioning unit.`,
        image: prod.imageUrl,
        type: 'product',
        target: 'slider',
        solutionName: fullTitle,
        badge: prod.badgeText || prod.category
      });
    });

    // 3. Search Hero Slides
    const slides = await HeroSlide.find({
      isActive: true,
      $or: [
        { title: regex },
        { subtitle: regex },
        { altText: regex }
      ]
    }).lean();

    slides.forEach(slide => {
      results.push({
        id: `slide-${slide._id}`,
        title: slide.title,
        category: 'Hero Showcase',
        scope: 'Residential',
        description: slide.altText || slide.subtitle || 'Modern water treatment innovation.',
        image: slide.mediaUrl,
        type: 'showcase',
        target: 'hero',
        solutionName: slide.title
      });
    });

    // 4. Search Static Content / Site Settings
    if (regex.test('About Us') || regex.test('Engineering') || regex.test('Quality') || regex.test('Overview')) {
      results.push({
        id: 'page-about',
        title: 'About AVXBS Engineering',
        category: 'Company Profile',
        description: 'Learn about our water technology infrastructure, quality standards, and service team.',
        type: 'page',
        target: 'about',
        url: '/about'
      });
    }

    if (regex.test('Contact') || regex.test('Helpline') || regex.test('Address') || regex.test('Support') || regex.test('Phone')) {
      results.push({
        id: 'page-contact',
        title: 'Contact Engineering Support',
        category: 'Customer Support',
        description: 'Get in touch with an AVXBS certified water engineer for site surveys and quotes.',
        type: 'page',
        target: 'contact',
        url: '/contact'
      });
    }

    // Deduplicate results by title + category
    const seen = new Set();
    const uniqueResults = results.filter(item => {
      const key = `${item.title.toLowerCase()}||${item.category.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return jsonResponse({
      success: true,
      query,
      results: uniqueResults.slice(0, 8),
      total: uniqueResults.length
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

