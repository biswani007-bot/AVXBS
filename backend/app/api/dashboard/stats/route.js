import connectDB from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import Product from '@/models/Product';
import MenuItem from '@/models/MenuItem';
import Media from '@/models/Media';
import Testimonial from '@/models/Testimonial';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();

    const [
      totalInquiries,
      newInquiries,
      residentialInquiries,
      commercialInquiries,
      totalProducts,
      totalMenuItems,
      totalMedia,
      recentInquiries,
      totalFeedback,
      pendingFeedback,
      approvedFeedback,
      rejectedFeedback,
    ] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'New' }),
      Inquiry.countDocuments({ type: 'Residential' }),
      Inquiry.countDocuments({ type: 'Commercial' }),
      Product.countDocuments(),
      MenuItem.countDocuments(),
      Media.countDocuments(),
      Inquiry.find().sort({ createdAt: -1 }).limit(5),
      Testimonial.countDocuments(),
      Testimonial.countDocuments({ approvalStatus: 'pending' }),
      Testimonial.countDocuments({ approvalStatus: 'approved' }),
      Testimonial.countDocuments({ approvalStatus: 'rejected' }),
    ]);

    return jsonResponse({
      success: true,
      stats: {
        totalInquiries,
        newInquiries,
        residentialInquiries,
        commercialInquiries,
        totalProducts,
        totalMenuItems,
        totalMedia,
        totalFeedback,
        pendingFeedback,
        approvedFeedback,
        rejectedFeedback,
      },
      recentInquiries,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

