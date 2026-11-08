import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MegaMenuConfig from '@/models/MegaMenuConfig';
import FooterConfig from '@/models/FooterConfig';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const DEFAULT_RESIDENTIAL = {
  scope: 'Residential',
  highlightsHeading: 'Residential Highlights',
  solutionsHeading: 'Residential Solutions & Systems',
  highlights: [
    {
      id: 'res-hl-1',
      title: 'Water Softener Systems',
      subtitle: 'Zero scale protection for homes',
      description: 'Zero scale protection for homes',
      image: '/images/highlights/residential-water-softener.jpg',
      category: 'Residential',
      order: 1,
      isActive: true,
    },
    {
      id: 'res-hl-2',
      title: 'Whole-House Filtration (WTP)',
      subtitle: 'Complete sediment & purity control',
      description: 'Complete sediment & purity control',
      image: '/images/highlights/residential-wtp-filtration.jpg',
      category: 'Residential',
      order: 2,
      isActive: true,
    },
    {
      id: 'res-hl-3',
      title: 'Modular Kitchen Purifiers',
      subtitle: 'Under-sink RO & mineral balancing',
      description: 'Under-sink RO & mineral balancing',
      image: '/images/highlights/residential-modular-kitchen.jpg',
      category: 'Residential',
      order: 3,
      isActive: true,
    },
    {
      id: 'res-hl-4',
      title: 'Sanitary & Bath Protection',
      subtitle: 'Premium fixture & shower scale defense',
      description: 'Premium fixture & shower scale defense',
      image: '/images/highlights/residential-sanitary-bath.jpg',
      category: 'Residential',
      order: 4,
      isActive: true,
    },
  ],
  solutions: [
    { id: 'res-sol-1', title: 'Water Softener', order: 1, isActive: true },
    { id: 'res-sol-2', title: 'WTP', order: 2, isActive: true },
    { id: 'res-sol-3', title: 'Plumbing Solutions', order: 3, isActive: true },
    { id: 'res-sol-4', title: 'Modular Kitchen', order: 4, isActive: true },
    { id: 'res-sol-5', title: 'Sanitary & Bath Fittings', order: 5, isActive: true },
  ],
  usefulLinks: [
    {
      id: 'res-link-1',
      title: 'Hardness Water Testing',
      desc: 'Book a certified on-site mineral analysis',
      order: 1,
      isActive: true,
    },
    {
      id: 'res-link-2',
      title: 'Villa & Apartment Sizing',
      desc: 'Custom flow engineering calculations',
      order: 2,
      isActive: true,
    },
    {
      id: 'res-link-3',
      title: 'Dedicated Installation & AMC',
      desc: 'Preventive service & resin replacement',
      order: 3,
      isActive: true,
    },
    {
      id: 'res-link-4',
      title: 'User Guides & Warranty',
      desc: 'Documentation & genuine consumables',
      order: 4,
      isActive: true,
    },
  ],
  helpline: {
    label: 'Engineering Helpline',
    text: 'Speak directly with an AVXBS certified water treatment engineer for sizing & consultation.',
  },
};

const DEFAULT_COMMERCIAL = {
  scope: 'Commercial',
  highlightsHeading: 'Commercial Highlights',
  solutionsHeading: 'Commercial Solutions & Plants',
  highlights: [
    {
      id: 'comm-hl-1',
      title: 'Commercial Softener Plants',
      subtitle: 'Continuous duplex resin towers',
      description: 'Continuous duplex resin towers',
      image: '/images/highlights/commercial-softener-plant.jpg',
      category: 'Commercial',
      url: '#water-softener-inquiry-section',
      order: 1,
      isActive: true,
    },
    {
      id: 'comm-hl-2',
      title: 'Industrial Water Treatment',
      subtitle: 'Engineered high-capacity WTP facilities',
      description: 'Engineered high-capacity WTP facilities',
      image: '/images/highlights/commercial-industrial-wtp.jpg',
      category: 'Commercial',
      url: '#water-softener-inquiry-section',
      order: 2,
      isActive: true,
    },
  ],
  solutions: [
    { id: 'comm-sol-1', title: 'Commercial Softener Plants', order: 1, isActive: true },
    { id: 'comm-sol-2', title: 'Industrial WTP', order: 2, isActive: true },
    { id: 'comm-sol-3', title: 'Sanitary & Commercial Bath', order: 3, isActive: true },
  ],
  usefulLinks: [
    {
      id: 'comm-link-1',
      title: 'Industrial Plant Sizing',
      desc: 'Flow rate, recovery & footprint analysis',
      order: 1,
      isActive: true,
    },
    {
      id: 'comm-link-2',
      title: 'Zero Liquid Discharge (ZLD)',
      desc: 'Process water recycling architectures',
      order: 2,
      isActive: true,
    },
    {
      id: 'comm-link-3',
      title: '24/7 Operations & Maintenance',
      desc: 'Critical uptime AMC service contracts',
      order: 3,
      isActive: true,
    },
    {
      id: 'comm-link-4',
      title: 'Consult With Specialist',
      desc: 'Direct technical consultation & quotes',
      order: 4,
      isActive: true,
    },
  ],
  helpline: {
    label: 'Engineering Helpline',
    text: 'Speak directly with an AVXBS certified water treatment engineer for sizing & consultation.',
  },
};

// GET: Retrieve Mega Menu Configuration
// - If all=true: returns all highlight records (active and inactive) for admin management
// - If all!=true (public): returns ONLY active and valid highlight records
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const rawScopeParam = searchParams.get('scope');
    const scopeParam = rawScopeParam
      ? (rawScopeParam.toLowerCase() === 'commercial' ? 'Commercial' : (rawScopeParam.toLowerCase() === 'residential' ? 'Residential' : rawScopeParam))
      : null;
    const includeAll = searchParams.get('all') === 'true';

    let resConfig = await MegaMenuConfig.findOne({ scope: 'Residential' }).lean();
    let commConfig = await MegaMenuConfig.findOne({ scope: 'Commercial' }).lean();

    if (!resConfig) {
      const created = await MegaMenuConfig.create(DEFAULT_RESIDENTIAL);
      resConfig = created.toObject ? created.toObject() : created;
    }
    if (!commConfig) {
      const created = await MegaMenuConfig.create(DEFAULT_COMMERCIAL);
      commConfig = created.toObject ? created.toObject() : created;
    }

    const formatConfig = (config) => {
      if (!config) return null;
      const copy = { ...config };
      const rawHighlights = Array.isArray(copy.highlights) ? copy.highlights : [];

      if (!includeAll) {
        // Public website query: ONLY active records with valid title and image
        copy.highlights = rawHighlights
          .filter(
            (h) => h && h.isActive !== false && Boolean(h.title && h.title.trim()) && Boolean(h.image && h.image.trim())
          )
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      } else {
        // Admin query: preserve all records sorted by display order
        copy.highlights = [...rawHighlights].sort((a, b) => (a.order || 0) - (b.order || 0));
      }

      copy.activeHighlightCount = rawHighlights.filter(
        (h) => h && h.isActive !== false && Boolean(h.title && h.title.trim()) && Boolean(h.image && h.image.trim())
      ).length;
      copy.totalHighlightCount = rawHighlights.length;

      return copy;
    };

    const resData = formatConfig(resConfig);
    const commData = formatConfig(commConfig);

    if (scopeParam === 'Residential') {
      return NextResponse.json(
        {
          success: true,
          data: resData,
          activeHighlightCount: resData?.activeHighlightCount || 0,
          totalHighlightCount: resData?.totalHighlightCount || 0,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    if (scopeParam === 'Commercial') {
      return NextResponse.json(
        {
          success: true,
          data: commData,
          activeHighlightCount: commData?.activeHighlightCount || 0,
          totalHighlightCount: commData?.totalHighlightCount || 0,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        residential: resData,
        commercial: commData,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[GET /api/mega-menu] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch mega menu data' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Add a new highlight card or solution item directly to database
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    let scope = body.scope;
    if (scope && typeof scope === 'string') {
      if (scope.toLowerCase() === 'residential') scope = 'Residential';
      else if (scope.toLowerCase() === 'commercial') scope = 'Commercial';
    }
    const type = body.type || 'highlight';
    const itemData = body.item || body;

    if (!scope || !['Residential', 'Commercial'].includes(scope)) {
      return NextResponse.json(
        { success: false, error: 'Scope must be either Residential or Commercial' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    let doc = await MegaMenuConfig.findOne({ scope });
    if (!doc) {
      doc = await MegaMenuConfig.create(scope === 'Residential' ? DEFAULT_RESIDENTIAL : DEFAULT_COMMERCIAL);
    }

    if (type === 'highlight') {
      const title = (itemData.title || '').trim();
      const image = (itemData.image || '').trim();
      const subtitle = (itemData.subtitle || itemData.description || '').trim();
      const description = (itemData.description || itemData.subtitle || '').trim();
      const url = (itemData.url || '').trim();
      const isActive = itemData.isActive !== false;

      if (!title) {
        return NextResponse.json(
          { success: false, error: 'Highlight title is required' },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
      if (!image) {
        return NextResponse.json(
          { success: false, error: 'Highlight image URL or upload path is required' },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      const newId = itemData.id || `${scope.toLowerCase()}-hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newOrder = typeof itemData.order === 'number' && itemData.order > 0
        ? itemData.order
        : (doc.highlights.length + 1);

      const newHighlight = {
        id: newId,
        title,
        subtitle,
        description,
        image,
        category: itemData.category || scope,
        url,
        order: newOrder,
        isActive,
      };

      doc.highlights.push(newHighlight);
      doc.markModified('highlights');
      await doc.save();

      const savedItem = doc.highlights[doc.highlights.length - 1];

      return NextResponse.json(
        {
          success: true,
          message: `${scope} highlight added successfully`,
          item: savedItem,
          data: doc,
        },
        { status: 201, headers: NO_CACHE_HEADERS }
      );
    } else if (type === 'solution') {
      const title = (itemData.title || '').trim();
      if (!title) {
        return NextResponse.json(
          { success: false, error: 'Solution title is required' },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      const newSolution = {
        id: itemData.id || `${scope.toLowerCase()}-sol-${Date.now()}`,
        title,
        description: itemData.description || '',
        icon: itemData.icon || 'Droplets',
        url: itemData.url || '#water-softener-inquiry-section',
        order: typeof itemData.order === 'number' ? itemData.order : (doc.solutions.length + 1),
        isActive: itemData.isActive !== false,
      };

      doc.solutions.push(newSolution);
      await doc.save();

      return NextResponse.json(
        {
          success: true,
          message: `${scope} solution added successfully`,
          item: doc.solutions[doc.solutions.length - 1],
          data: doc,
        },
        { status: 201, headers: NO_CACHE_HEADERS }
      );
    } else {
      return NextResponse.json(
        { success: false, error: `Invalid item type: ${type}` },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
  } catch (error) {
    console.error('[POST /api/mega-menu] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add item' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PUT: Update an existing highlight card, solution item, or full menu scope
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    let { 
      scope, 
      type,
      item,
      highlightsHeading, 
      solutionsHeading, 
      highlights, 
      solutions, 
      usefulLinks, 
      helpline, 
      cta 
    } = body;

    if (scope && typeof scope === 'string') {
      if (scope.toLowerCase() === 'residential') scope = 'Residential';
      else if (scope.toLowerCase() === 'commercial') scope = 'Commercial';
    }

    if (!scope || !['Residential', 'Commercial'].includes(scope)) {
      return NextResponse.json(
        { success: false, error: 'Scope must be either Residential or Commercial' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    let doc = await MegaMenuConfig.findOne({ scope });
    if (!doc) {
      doc = await MegaMenuConfig.create(scope === 'Residential' ? DEFAULT_RESIDENTIAL : DEFAULT_COMMERCIAL);
    }

    // CASE 1: Individual Highlight Card Update (Preserving ID & _id, no duplicate creation)
    if (type === 'highlight' && item) {
      const targetId = item.id || item._id;
      if (!targetId) {
        return NextResponse.json(
          { success: false, error: 'Highlight id or _id is required for update' },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      const existingHl = doc.highlights.find(
        (h) => h.id === targetId || String(h._id) === String(targetId)
      );

      if (!existingHl) {
        return NextResponse.json(
          { success: false, error: `Highlight record "${targetId}" not found in ${scope}` },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }

      if (item.title !== undefined) {
        const titleTrimmed = String(item.title).trim();
        if (!titleTrimmed) {
          return NextResponse.json(
            { success: false, error: 'Highlight title cannot be empty' },
            { status: 400, headers: NO_CACHE_HEADERS }
          );
        }
        existingHl.title = titleTrimmed;
      }

      if (item.image !== undefined) {
        const imageTrimmed = String(item.image).trim();
        if (!imageTrimmed) {
          return NextResponse.json(
            { success: false, error: 'Highlight image cannot be empty' },
            { status: 400, headers: NO_CACHE_HEADERS }
          );
        }
        existingHl.image = imageTrimmed;
      }

      if (item.subtitle !== undefined || item.description !== undefined) {
        const sub = item.subtitle !== undefined ? item.subtitle : item.description;
        existingHl.subtitle = String(sub || '').trim();
        existingHl.description = String(sub || '').trim();
      }

      if (item.url !== undefined) {
        existingHl.url = String(item.url || '').trim();
      }

      if (item.category !== undefined) {
        existingHl.category = String(item.category || scope).trim();
      }

      if (typeof item.order === 'number') {
        existingHl.order = item.order;
      }

      if (item.isActive !== undefined) {
        existingHl.isActive = Boolean(item.isActive);
      }

      doc.markModified('highlights');
      await doc.save();

      return NextResponse.json(
        {
          success: true,
          message: `${scope} highlight updated successfully`,
          item: existingHl,
          data: doc,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // CASE 2: Individual Solution Item Update
    if (type === 'solution' && item) {
      const targetId = item.id || item._id;
      const existingSol = doc.solutions.find(
        (s) => s.id === targetId || String(s._id) === String(targetId)
      );

      if (!existingSol) {
        return NextResponse.json(
          { success: false, error: `Solution record "${targetId}" not found in ${scope}` },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }

      if (item.title !== undefined) existingSol.title = String(item.title).trim();
      if (item.description !== undefined) existingSol.description = String(item.description).trim();
      if (item.icon !== undefined) existingSol.icon = item.icon;
      if (item.url !== undefined) existingSol.url = item.url;
      if (typeof item.order === 'number') existingSol.order = item.order;
      if (item.isActive !== undefined) existingSol.isActive = Boolean(item.isActive);

      doc.markModified('solutions');
      await doc.save();

      return NextResponse.json(
        {
          success: true,
          message: `${scope} solution updated successfully`,
          item: existingSol,
          data: doc,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // CASE 3: Full Scope Menu Update
    const updateSet = {};
    if (highlights !== undefined) {
      updateSet.highlights = highlights;
    }
    if (solutions !== undefined) {
      updateSet.solutions = solutions;
    }
    if (usefulLinks !== undefined) {
      updateSet.usefulLinks = usefulLinks;
    }
    if (helpline !== undefined) {
      updateSet.helpline = helpline;
    }
    if (highlightsHeading !== undefined) {
      updateSet.highlightsHeading = highlightsHeading;
    }
    if (solutionsHeading !== undefined) {
      updateSet.solutionsHeading = solutionsHeading;
    }
    if (cta !== undefined) {
      updateSet.cta = cta;
    }

    const updated = await MegaMenuConfig.findOneAndUpdate(
      { scope },
      { $set: updateSet },
      { new: true, upsert: true }
    );

    // Synchronize footer columns dynamically with Mega Menu Solutions
    try {
      const footerDoc = await FooterConfig.findOne();
      if (footerDoc && Array.isArray(footerDoc.columns)) {
        const colTitle = scope === 'Residential' ? 'Residential' : 'Commercial';
        const colKey = scope.toLowerCase();
        
        const activeSolutions = (updated.solutions || [])
          .filter((s) => s.isActive !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const updatedLinks = activeSolutions.map((s, idx) => ({
          label: s.title,
          url: s.url || '#water-softener-inquiry-section',
          isExternal: false,
          order: idx + 1,
          isActive: true,
        }));

        const existingColIdx = footerDoc.columns.findIndex(
          (c) => c.sectionKey === colKey || c.title.toLowerCase() === colKey
        );

        if (existingColIdx !== -1) {
          footerDoc.columns[existingColIdx].title = colTitle;
          footerDoc.columns[existingColIdx].sectionKey = colKey;
          footerDoc.columns[existingColIdx].links = updatedLinks;
        } else {
          footerDoc.columns.push({
            title: colTitle,
            sectionKey: colKey,
            order: scope === 'Residential' ? 1 : 2,
            isActive: true,
            links: updatedLinks,
          });
        }

        // Also update publishedConfig snapshot so live website reflects immediately
        if (footerDoc.publishedConfig && Array.isArray(footerDoc.publishedConfig.columns)) {
          const pubColIdx = footerDoc.publishedConfig.columns.findIndex(
            (c) => c.sectionKey === colKey || c.title.toLowerCase() === colKey
          );
          if (pubColIdx !== -1) {
            footerDoc.publishedConfig.columns[pubColIdx].title = colTitle;
            footerDoc.publishedConfig.columns[pubColIdx].sectionKey = colKey;
            footerDoc.publishedConfig.columns[pubColIdx].links = updatedLinks;
          } else {
            footerDoc.publishedConfig.columns.push({
              title: colTitle,
              sectionKey: colKey,
              order: scope === 'Residential' ? 1 : 2,
              isActive: true,
              links: updatedLinks,
            });
          }
        } else {
          footerDoc.publishedConfig = {
            companyInfo: footerDoc.companyInfo,
            columns: footerDoc.columns,
            socialLinks: footerDoc.socialLinks,
            legalLinks: footerDoc.legalLinks,
            isActive: true,
          };
        }

        footerDoc.markModified('columns');
        footerDoc.markModified('publishedConfig');
        await footerDoc.save();
      }
    } catch (syncErr) {
      console.warn('[MegaMenu PUT] Could not auto-sync footer columns:', syncErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${scope} mega menu updated successfully`,
        data: updated,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[PUT /api/mega-menu] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update mega menu' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE: Delete a specific highlight card or solution item directly by ID
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    let scope = searchParams.get('scope'); // 'Residential' | 'Commercial'
    let type = searchParams.get('type');   // 'highlight' | 'solution'
    let id = searchParams.get('id');

    // Also support JSON body if query params not present
    if (!id || !scope) {
      try {
        const body = await request.json();
        if (body.scope) scope = body.scope;
        if (body.type) type = body.type;
        if (body.id) id = body.id;
      } catch (_) {}
    }

    if (scope && typeof scope === 'string') {
      if (scope.toLowerCase() === 'residential') scope = 'Residential';
      else if (scope.toLowerCase() === 'commercial') scope = 'Commercial';
    }

    if (!scope || !['Residential', 'Commercial'].includes(scope)) {
      return NextResponse.json(
        { success: false, error: 'Scope must be Residential or Commercial' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'type and id are required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const doc = await MegaMenuConfig.findOne({ scope });
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Menu config not found' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (type === 'highlight') {
      const initialLength = doc.highlights.length;
      doc.highlights = doc.highlights.filter(
        (h) => h.id !== id && String(h._id) !== String(id)
      );

      if (doc.highlights.length === initialLength) {
        return NextResponse.json(
          { success: false, error: `Highlight card "${id}" not found in ${scope}` },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }

      // Re-normalize display orders
      doc.highlights.forEach((h, idx) => {
        h.order = idx + 1;
      });
      doc.markModified('highlights');
    } else if (type === 'solution') {
      const initialLength = doc.solutions.length;
      doc.solutions = doc.solutions.filter(
        (s) => s.id !== id && String(s._id) !== String(id)
      );

      if (doc.solutions.length === initialLength) {
        return NextResponse.json(
          { success: false, error: `Solution item "${id}" not found in ${scope}` },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }

      doc.solutions.forEach((s, idx) => {
        s.order = idx + 1;
      });
      doc.markModified('solutions');
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type (must be highlight or solution)' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await doc.save();

    return NextResponse.json(
      {
        success: true,
        message: `${type} deleted successfully`,
        data: doc,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[DELETE /api/mega-menu] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
