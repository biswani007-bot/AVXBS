import connectDB from '@/lib/db';
import Testimonial from '@/models/Testimonial';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// GET: Retrieve testimonials
// - Admin with ?all=true gets all actual customer submissions with filters
// - Public homepage gets ONLY reviews with showOnHomepage = true and isActive != false and approvalStatus = approved
export async function GET(req) {
  try {
    await connectDB();

    // Clean out any sample records that might have existed previously
    await Testimonial.deleteMany({ isSample: true });

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    // Admin query: retrieve submitted customer reviews
    if (all) {
      const auth = await authenticateRequest(req);
      if (auth.error) {
        return errorResponse(auth.error, auth.status);
      }
      const filter = { isSample: { $ne: true } };
      const category = searchParams.get('category');
      const visibility = searchParams.get('visibility'); // 'all', 'visible', 'hidden'
      const status = searchParams.get('status'); // 'all', 'active', 'inactive'
      const search = searchParams.get('search');

      if (category && category !== 'ALL') {
        filter.category = category;
      }
      if (visibility === 'visible') {
        filter.showOnHomepage = true;
      } else if (visibility === 'hidden') {
        filter.showOnHomepage = { $ne: true };
      }
      if (status === 'active') {
        filter.isActive = { $ne: false };
      } else if (status === 'inactive') {
        filter.isActive = false;
      }

      if (search && search.trim()) {
        const s = search.trim();
        filter.$or = [
          { customerName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { designation: { $regex: s, $options: 'i' } },
          { feedback: { $regex: s, $options: 'i' } },
        ];
      }

      const testimonials = await Testimonial.find(filter).sort({ displayOrder: 1, createdAt: -1 });

      const totalCount = await Testimonial.countDocuments({ isSample: { $ne: true } });
      const visibleCount = await Testimonial.countDocuments({ isSample: { $ne: true }, showOnHomepage: true });
      const hiddenCount = totalCount - visibleCount;
      const activeCount = await Testimonial.countDocuments({ isSample: { $ne: true }, isActive: { $ne: false } });
      const inactiveCount = totalCount - activeCount;

      return jsonResponse({
        success: true,
        count: testimonials.length,
        summary: {
          total: totalCount,
          visible: visibleCount,
          hidden: hiddenCount,
          active: activeCount,
          inactive: inactiveCount,
        },
        testimonials,
      });
    }

    // Public homepage query: ONLY approved reviews marked showOnHomepage = true and isActive != false
    const filter = {
      isSample: { $ne: true },
      showOnHomepage: true,
      isActive: { $ne: false },
      approvalStatus: 'approved',
    };

    const testimonials = await Testimonial.find(filter).sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 });

    return jsonResponse({
      success: true,
      count: testimonials.length,
      testimonials,
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return errorResponse(error.message, 500);
  }
}

// POST: Admin manual review creation (requires authentication)
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const body = await req.json();

    const {
      customerName,
      email = '',
      designation = '',
      category = 'Residential',
      rating = 5,
      feedback,
      profileImage = '',
      avatarColor = '',
      isFeatured = false,
      showOnHomepage = true,
      isActive = true,
      approvalStatus = 'approved',
      displayOrder,
    } = body;

    // Validate inputs
    if (!customerName || !customerName.trim()) {
      return errorResponse('Customer name is required', 400);
    }

    if (!feedback || !feedback.trim()) {
      return errorResponse('Feedback message is required', 400);
    }

    if (feedback.trim().length < 6) {
      return errorResponse('Feedback message must be at least 6 characters long', 400);
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return errorResponse('Rating must be between 1 and 5 stars', 400);
    }

    // Email validation if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return errorResponse('Please provide a valid email address', 400);
      }
    }

    let order = 1;
    if (displayOrder !== undefined && !isNaN(Number(displayOrder))) {
      order = Number(displayOrder);
    } else {
      const maxDoc = await Testimonial.findOne().sort({ displayOrder: -1 });
      order = maxDoc && typeof maxDoc.displayOrder === 'number' ? maxDoc.displayOrder + 1 : 1;
    }

    // If marked featured, unset any other featured
    if (isFeatured) {
      await Testimonial.updateMany({}, { isFeatured: false });
    }

    const activeState = isActive !== undefined ? Boolean(isActive) : true;
    const homepageState = showOnHomepage !== undefined ? Boolean(showOnHomepage) : true;
    const finalApprovalStatus = approvalStatus || (homepageState ? 'approved' : 'pending');

    const newTestimonial = await Testimonial.create({
      customerName: customerName.trim(),
      email: email ? email.trim().toLowerCase() : '',
      designation: designation ? designation.trim() : (category === 'Commercial' ? 'Commercial Client' : 'Residential Homeowner'),
      category: category === 'Commercial' ? 'Commercial' : 'Residential',
      rating: numRating,
      feedback: feedback.trim(),
      avatarColor: avatarColor ? avatarColor.trim() : '',
      profileImage: profileImage ? profileImage.trim() : '',
      showOnHomepage: homepageState,
      isActive: activeState,
      isPublished: homepageState,
      isFeatured: Boolean(isFeatured),
      approvalStatus: finalApprovalStatus,
      isSample: false,
      displayOrder: order,
    });

    return jsonResponse(
      {
        success: true,
        message: 'Customer review created successfully',
        testimonial: newTestimonial,
      },
      201
    );
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return errorResponse(error.message, 500);
  }
}
