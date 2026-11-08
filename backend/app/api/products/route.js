import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// GET all products (Public - supports filter by category, slider only, or published)
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const sliderOnly = searchParams.get('sliderOnly');
    const all = searchParams.get('all'); // if admin wants unpublished too

    const query = {};
    if (all !== 'true') {
      query.isPublished = true;
    }
    if (category) {
      query.category = category;
    }
    if (sliderOnly === 'true') {
      query.showInSlider = true;
    }

    const products = await Product.find(query).sort({ sortOrder: 1, createdAt: 1 });

    // Ensure sequenceNumber and cardLabel exist for each product
    const formattedProducts = products.map((p, index) => {
      const doc = p.toObject();
      if (!doc.sequenceNumber) {
        doc.sequenceNumber = `0${index + 1}`;
      }
      if (!doc.cardLabel) {
        doc.cardLabel = 'CURRENT USER ACCESS';
      }
      return doc;
    });

    return jsonResponse({ success: true, products: formattedProducts });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// POST create product (Admin only)
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const data = await req.json();

    if (!data.name) {
      return errorResponse('Product name is required', 400);
    }

    const slug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    
    // Check slug collision
    const existing = await Product.findOne({ slug });
    if (existing) {
      return errorResponse('A product with this slug or name already exists', 400);
    }

    const product = await Product.create({
      ...data,
      slug,
    });

    return jsonResponse({ success: true, message: 'Product created', product }, 201);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

