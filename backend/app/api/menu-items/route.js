import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// Default Samsung-Style Mega Menu Configuration seeded to MongoDB
const INITIAL_MEGA_MENU_ITEMS = [
  // ================= RESIDENTIAL =================
  // Column 1: Residential Solutions
  {
    scope: 'Both',
    columnId: 'solutions',
    columnTitle: 'Residential Solutions',
    name: 'WATER SOFTENER',
    description: 'Automated ion-exchange whole-house softening systems for zero hardness.',
    productName: 'Water Softener',
    badge: 'Popular',
    sortOrder: 1,
    isPublished: true,
  },
  {
    scope: 'Both',
    columnId: 'solutions',
    columnTitle: 'Residential Solutions',
    name: 'WTP',
    description: 'Comprehensive water treatment plant solutions for domestic raw water.',
    productName: 'WTP',
    badge: 'Essential',
    sortOrder: 2,
    isPublished: true,
  },
  {
    scope: 'Residential',
    columnId: 'solutions',
    columnTitle: 'Residential Solutions',
    name: 'PLUMBING SOLUTIONS',
    description: 'Engineering grade CPVC, piping, valves, and manifold balancing.',
    productName: 'Plumbing Solutions',
    badge: '',
    sortOrder: 3,
    isPublished: true,
  },
  {
    scope: 'Residential',
    columnId: 'solutions',
    columnTitle: 'Residential Solutions',
    name: 'MODULAR KITCHEN',
    description: 'Under-sink RO, multi-stage water purifiers, and kitchen utility systems.',
    productName: 'Modular Kitchen',
    badge: 'New',
    sortOrder: 4,
    isPublished: true,
  },
  {
    scope: 'Both',
    columnId: 'solutions',
    columnTitle: 'Residential Solutions',
    name: 'SANITARY & BATHFITTINGS',
    description: 'Anti-scale bathroom fixtures, thermostatic mixers, and shower filters.',
    productName: 'Sanitary & Bathfittings',
    badge: '',
    sortOrder: 5,
    isPublished: true,
  },

  // Column 2: Featured Products (Residential)
  {
    scope: 'Residential',
    columnId: 'featured',
    columnTitle: 'Featured Products',
    name: 'Smart Automated Water Softener',
    description: 'Microprocessor demand-initiated regeneration with zero salt wastage.',
    image: '/assets/water-softener-system.jpg',
    productName: 'Water Softener',
    badge: 'Flagship',
    sortOrder: 1,
    isPublished: true,
  },
  {
    scope: 'Residential',
    columnId: 'featured',
    columnTitle: 'Featured Products',
    name: 'Compact Point-of-Entry Filter',
    description: 'Multi-layer sediment & carbon filtration for clear tap water.',
    image: '/assets/wtp-filtration-system.jpg',
    productName: 'Point-of-Entry Filter',
    badge: 'Bestseller',
    sortOrder: 2,
    isPublished: true,
  },

  // Column 3: Explore Solutions (Residential)
  {
    scope: 'Residential',
    columnId: 'explore',
    columnTitle: 'Explore Solutions',
    name: 'Water Treatment',
    description: 'Core mineralization, scale prevention, and hardness removal technology.',
    badge: '',
    sortOrder: 1,
    isPublished: true,
  },
  {
    scope: 'Residential',
    columnId: 'explore',
    columnTitle: 'Explore Solutions',
    name: 'Water Purification',
    description: 'Multi-stage RO, UV, and UF systems delivering pure drinking water.',
    badge: '',
    sortOrder: 2,
    isPublished: true,
  },
  {
    scope: 'Residential',
    columnId: 'explore',
    columnTitle: 'Explore Solutions',
    name: 'Filtration Systems',
    description: 'Heavy sediment, chlorine, turbidity, and chemical reduction units.',
    badge: '',
    sortOrder: 3,
    isPublished: true,
  },
  {
    scope: 'Residential',
    columnId: 'explore',
    columnTitle: 'Explore Solutions',
    name: 'Home Water Solutions',
    description: 'Complete end-to-end villa and apartment water wellness architecture.',
    badge: 'Recommended',
    sortOrder: 4,
    isPublished: true,
  },

  // ================= COMMERCIAL =================
  // Column 2: Featured Products (Commercial)
  {
    scope: 'Commercial',
    columnId: 'featured',
    columnTitle: 'Featured Products',
    name: 'Commercial Duplex Softening Plant',
    description: 'Twin alternating continuous softening plant for heavy uninterrupted cycles.',
    image: '/assets/commercial-plant-system.jpg',
    productName: 'Commercial Softener Plant',
    badge: 'Industrial Grade',
    sortOrder: 1,
    isPublished: true,
  },

  // Column 3: Commercial Applications
  {
    scope: 'Commercial',
    columnId: 'explore',
    columnTitle: 'Commercial Applications',
    name: 'Industrial Water Treatment',
    description: 'Boiler feed, cooling towers, process rinse, and pharmaceutical grade water.',
    badge: '',
    sortOrder: 1,
    isPublished: true,
  },
];

// Public GET for navbar mega menus
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope'); // 'Residential' | 'Commercial'
    const all = searchParams.get('all');

    const query = {};
    if (all !== 'true') {
      query.isPublished = true;
    }

    if (scope) {
      // Include items marked for this specific scope OR 'Both'
      query.scope = { $in: [scope, 'Both'] };
    }

    const items = await MenuItem.find(query).sort({ columnId: 1, sortOrder: 1, createdAt: 1 });
    return jsonResponse({ success: true, items: items || [] });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// Admin POST create menu item
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const data = await req.json();

    if (!data.name || !data.scope || !data.columnId || !data.columnTitle) {
      return errorResponse('Name, scope, columnId, and columnTitle are required', 400);
    }

    const item = await MenuItem.create(data);
    return jsonResponse({ success: true, message: 'Menu item created', item }, 201);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
