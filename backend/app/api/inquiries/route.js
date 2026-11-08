import connectDB from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// Public GET for count, or Admin GET for full list
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('countOnly');

    // If just requesting count (for frontend slider / counter)
    if (countOnly === 'true') {
      const count = await Inquiry.countDocuments();
      return jsonResponse({
        success: true,
        count,
      });
    }

    // Otherwise, requires admin auth
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const product = searchParams.get('product');

    const query = {};
    if (status && status !== 'All') {
      if (status === 'Solved') {
        query.status = { $in: ['Solved', 'Resolved'] };
      } else {
        query.status = status;
      }
    }
    if (type && type !== 'All') {
      query.type = type;
    }
    if (product && product !== 'All') {
      query.product = product;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { product: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [
      inquiries,
      total,
      totalAll,
      totalNew,
      totalInProgress,
      totalSolved,
      totalNotSolved,
      distinctProducts
    ] = await Promise.all([
      Inquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Inquiry.countDocuments(query),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'New' }),
      Inquiry.countDocuments({ status: { $in: ['In Progress', 'Contacted'] } }),
      Inquiry.countDocuments({ status: { $in: ['Solved', 'Resolved'] } }),
      Inquiry.countDocuments({ status: { $in: ['Not Solved', 'Closed'] } }),
      Inquiry.distinct('product'),
    ]);

    return jsonResponse({
      success: true,
      inquiries,
      summary: {
        total: totalAll,
        new: totalNew,
        inProgress: totalInProgress,
        solved: totalSolved,
        notSolved: totalNotSolved,
      },
      distinctProducts: distinctProducts.filter(Boolean),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// Public POST: User submits inquiry from frontend
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { type, product, name, mobile, email, remarks, location, waterIssue, source } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return errorResponse('Full name is required (min 2 characters)', 400);
    }

    const rawMobile = (mobile || '').replace(/[\s\-\(\)]/g, '');
    const mobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!rawMobile || !mobileRegex.test(rawMobile)) {
      return errorResponse('A valid 10-digit mobile number is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return errorResponse('A valid email address is required', 400);
    }

    const inquiry = await Inquiry.create({
      type: type || 'Residential',
      product: product || 'Water Softener',
      name: name.trim(),
      mobile: rawMobile,
      email: email.trim().toLowerCase(),
      location: location ? location.trim() : '',
      waterIssue: waterIssue ? waterIssue.trim() : '',
      remarks: remarks ? remarks.trim() : '',
      source: source || 'Drawer',
    });

    const totalCount = await Inquiry.countDocuments();

    return jsonResponse(
      {
        success: true,
        message: 'Inquiry received successfully',
        inquiry,
        totalSubmissions: totalCount,
      },
      201
    );
  } catch (error) {
    console.error('Inquiry create error:', error);
    return errorResponse(error.message, 500);
  }
}

