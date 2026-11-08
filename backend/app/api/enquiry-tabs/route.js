import connectDB from '@/lib/db';
import EnquiryTab from '@/models/EnquiryTab';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

const INITIAL_DEFAULT_TABS = [
  {
    tabName: 'WATER SOFTENER',
    category: 'Both',
    description: 'High-performance automated ion-exchange whole-house and commercial water softening systems.',
    isActive: true,
    displayOrder: 1,
    items: [
      {
        name: 'Automated Whole-House Softener',
        description: 'Microprocessor demand-initiated regeneration, 99.8% scale elimination with food-grade uniform bead cation resin.',
        badge: 'Best Seller',
        iconName: 'Droplets',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Compact Integrated Cabinet Softener',
        description: 'Space-efficient sleek all-in-one brine tank and resin vessel designed for luxury modern apartments.',
        badge: 'Modern Design',
        iconName: 'ShieldCheck',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Point-of-Entry Bathroom Hard Water Softener',
        description: 'Targeted scale prevention safeguarding geysers, thermostatic mixers, premium showers, and CP fixtures.',
        badge: 'Fixture Care',
        iconName: 'Sparkles',
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'High-Capacity Duplex Continuous Softening Plant',
        description: 'Twin alternating vessels engineered for 24/7 continuous uninterrupted zero-hardness soft water delivery.',
        badge: 'Heavy Duty',
        iconName: 'Layers',
        isActive: true,
        displayOrder: 4,
      },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true, displayOrder: 1 },
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true, displayOrder: 2 },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false, displayOrder: 3 },
      { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your water softening requirements...', isRequired: false, displayOrder: 4 },
    ],
  },
  {
    tabName: 'WTP',
    category: 'Both',
    description: 'Turnkey Water Treatment Plants, multi-stage media filtration, and industrial reverse osmosis systems.',
    isActive: true,
    displayOrder: 2,
    items: [
      {
        name: 'Central Multi-Grade Water Treatment Plant',
        description: 'Comprehensive municipal & borewell water clarification, multi-grade sand filtration, and turbidity stripping.',
        badge: 'Commercial & Res',
        iconName: 'Layers',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Commercial High-Recovery RO Plant',
        description: 'Industrial semi-permeable membrane purification delivering low-energy, maximum pure water yield.',
        badge: 'High Recovery',
        iconName: 'ShieldCheck',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Catalytic Iron & Manganese Removal System',
        description: 'Advanced oxidizing media column engineered for severe borewell groundwater rust and yellow stain removal.',
        badge: 'Deep Filtration',
        iconName: 'Droplets',
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'Activated Carbon Odor & Organic Absorber',
        description: 'High iodine value coconut shell carbon media extracting chlorine, VOCs, unpleasant tastes, and pungent odor.',
        badge: 'Purity Care',
        iconName: 'Sparkles',
        isActive: true,
        displayOrder: 4,
      },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true, displayOrder: 1 },
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true, displayOrder: 2 },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false, displayOrder: 3 },
      { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your water treatment plant requirements...', isRequired: false, displayOrder: 4 },
    ],
  },
  {
    tabName: 'PLUMBING SOLUTIONS',
    category: 'Residential',
    description: 'Engineered residential hydro-pneumatic boosting, noise-dampened distribution, and piping architecture.',
    isActive: true,
    displayOrder: 3,
    items: [
      {
        name: 'Constant Pressure Hydro-Pneumatic Booster System',
        description: 'Smart variable frequency drive (VFD) booster pumps ensuring balanced water pressure across all bathroom showers.',
        badge: 'VFD Smart',
        iconName: 'Wrench',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Multi-Zone Residential Piping Distribution',
        description: 'Corrosion-free composite multi-layer plumbing pipelines preventing pressure drops and thermal losses.',
        badge: 'Premium Piping',
        iconName: 'Layers',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Centralized Hot & Cold Water Balancing Manifold',
        description: 'Precision hydraulic manifolds providing instantaneous temperature regulation and balanced volumetric flow.',
        badge: 'Hydraulic Balance',
        iconName: 'Sparkles',
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'Acoustic Drainage & Low-Noise Waste Piping',
        description: 'Sound-insulated triple-layer drainage pipes eliminating hydraulic flush vibration and pipeline noise.',
        badge: 'Acoustic Comfort',
        iconName: 'ShieldCheck',
        isActive: true,
        displayOrder: 4,
      },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true, displayOrder: 1 },
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true, displayOrder: 2 },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false, displayOrder: 3 },
      { name: 'noOfBathrooms', label: 'Number of Bathrooms', type: 'number', placeholder: 'Enter number of bathrooms (e.g. 2, 3, 4)', isRequired: true, displayOrder: 4 },
    ],
  },
  {
    tabName: 'MODULAR KITCHEN',
    category: 'Residential',
    description: 'Designer luxury modular kitchen water distribution, under-sink alkaline RO, and pull-out faucet fixtures.',
    isActive: true,
    displayOrder: 4,
    items: [
      {
        name: 'Under-Sink Hydro-Pure RO System',
        description: 'Tankless compact multi-stage reverse osmosis unit delivering pristine alkaline mineral drinking water on demand.',
        badge: 'Mineral Balanced',
        iconName: 'Droplets',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Ergonomic 3-Way Pull-Out Kitchen Faucets',
        description: 'Dual-flow brushed stainless steel taps dispensing hot, cold, and filtered drinking water from a single spout.',
        badge: 'Dual Flow',
        iconName: 'Utensils',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Inline Dishwasher & Steam Oven Descaling Unit',
        description: 'Targeted ion-exchange cartridge preventing mineral scaling on high-end dishwashers and steam appliances.',
        badge: 'Appliance Shield',
        iconName: 'ShieldCheck',
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'Heavy-Duty Under-Sink Food Waste Disposer',
        description: 'Multi-stage stainless steel grinding chamber with noise-dampening insulation for clean kitchen hygiene.',
        badge: 'Hygiene Core',
        iconName: 'Sparkles',
        isActive: true,
        displayOrder: 4,
      },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true, displayOrder: 1 },
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true, displayOrder: 2 },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false, displayOrder: 3 },
      { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your modular kitchen water requirements...', isRequired: false, displayOrder: 4 },
    ],
  },
  {
    tabName: 'SANITARY & BATHFITTINGS',
    category: 'Both',
    description: 'Architectural luxury sanitary ware, thermostatic concealed valves, and scale-resistant CP bath fittings.',
    isActive: true,
    displayOrder: 5,
    items: [
      {
        name: 'Concealed Thermostatic Shower Dividers',
        description: 'High-precision temperature-limiting cartridges with anti-scald technology and uniform rain shower output.',
        badge: 'Anti-Scald Tech',
        iconName: 'Bath',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'PVD-Coated Scale-Resistant CP Faucets',
        description: 'Physical Vapor Deposition anti-scratch finish resistant to persistent hard-water spots and corrosion.',
        badge: 'PVD Armor',
        iconName: 'Sparkles',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Rimless Smart Wall-Hung Water Closets',
        description: 'Tornado-action 360-degree flushing with antibacterial glaze minimizing water consumption and maintenance.',
        badge: 'Eco Flush',
        iconName: 'ShieldCheck',
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'Commercial Touchless Sensor Taps & Urinal Valves',
        description: 'Infrared proximity sensors engineered for high-frequency sanitary hygiene in commercial enterprises and residences.',
        badge: 'Touchless Clean',
        iconName: 'Layers',
        isActive: true,
        displayOrder: 4,
      },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true, displayOrder: 1 },
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true, displayOrder: 2 },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false, displayOrder: 3 },
      { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your sanitary & bath fittings requirements...', isRequired: false, displayOrder: 4 },
    ],
  },
];

// Helper: Seed or ensure initial 5 tabs have their items populated
async function seedInitialTabsIfEmpty() {
  const existingCount = await EnquiryTab.countDocuments();
  if (existingCount === 0) {
    await EnquiryTab.insertMany(INITIAL_DEFAULT_TABS);
    return;
  }

  // Force update initial tabs with default items if items array is empty
  for (const defTab of INITIAL_DEFAULT_TABS) {
    const rawDoc = await EnquiryTab.collection.findOne({ tabName: defTab.tabName });
    if (rawDoc && (!rawDoc.items || rawDoc.items.length === 0)) {
      await EnquiryTab.collection.updateOne(
        { _id: rawDoc._id },
        { $set: { items: defTab.items, description: defTab.description } }
      );
    }
  }
}

// GET: Retrieve category tabs and their items (Public gets active for specific category, Admin gets all)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const category = searchParams.get('category'); // 'Residential' | 'Commercial'

    let filter = {};

    if (!all) {
      filter.isActive = true;
      if (category === 'Residential') {
        filter.category = { $in: ['Residential', 'Both'] };
      } else if (category === 'Commercial') {
        filter.category = { $in: ['Commercial', 'Both'] };
      }
    }

    const tabs = await EnquiryTab.find(filter).sort({ displayOrder: 1, createdAt: 1 });

    return jsonResponse({
      success: true,
      count: tabs.length,
      tabs,
    });
  } catch (error) {
    console.error('Error fetching category tabs:', error);
    return errorResponse(error.message, 500);
  }
}

// POST: Create a new category tab (Admin only, maximum 10 tabs supported)
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();

    // Check maximum 10 tabs constraint
    const currentCount = await EnquiryTab.countDocuments();
    if (currentCount >= 10) {
      return errorResponse('Maximum limit of 10 category tabs reached. Please edit or remove existing tabs.', 400);
    }

    const body = await req.json();
    const { tabName, category = 'Both', description = '', items = [], fields = [], isActive = true, displayOrder } = body;

    if (!tabName || !tabName.trim()) {
      return errorResponse('Tab name is required', 400);
    }

    let order = Number(displayOrder);
    if (isNaN(order)) {
      const maxDoc = await EnquiryTab.findOne().sort({ displayOrder: -1 });
      order = maxDoc && typeof maxDoc.displayOrder === 'number' ? maxDoc.displayOrder + 1 : currentCount + 1;
    }

    const newTab = await EnquiryTab.create({
      tabName: tabName.trim().toUpperCase(),
      category: ['Residential', 'Commercial', 'Both'].includes(category) ? category : 'Both',
      description: description.trim(),
      items: Array.isArray(items) ? items : [],
      fields: Array.isArray(fields) ? fields : [],
      isActive: Boolean(isActive),
      displayOrder: order,
    });

    return jsonResponse(
      {
        success: true,
        message: 'Category tab created successfully',
        tab: newTab,
      },
      201
    );
  } catch (error) {
    console.error('Error creating category tab:', error);
    return errorResponse(error.message, 500);
  }
}
