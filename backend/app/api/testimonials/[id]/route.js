import connectDB from '@/lib/db';
import Testimonial from '@/models/Testimonial';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// GET individual testimonial
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return errorResponse('Testimonial not found', 404);
    }

    return jsonResponse({ success: true, testimonial });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// PUT: Update testimonial (Admin only)
export async function PUT(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updateData = {};
    if (body.customerName !== undefined) updateData.customerName = body.customerName.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    if (body.designation !== undefined) updateData.designation = body.designation.trim();
    if (body.category !== undefined) {
      updateData.category = body.category === 'Commercial' ? 'Commercial' : 'Residential';
    }
    if (body.rating !== undefined) {
      const num = Number(body.rating);
      if (!isNaN(num) && num >= 1 && num <= 5) updateData.rating = num;
    }
    if (body.feedback !== undefined) updateData.feedback = body.feedback.trim();
    if (body.avatarColor !== undefined) updateData.avatarColor = body.avatarColor.trim();
    if (body.profileImage !== undefined) updateData.profileImage = body.profileImage.trim();
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    if (body.showOnHomepage !== undefined) {
      updateData.showOnHomepage = Boolean(body.showOnHomepage);
      updateData.isPublished = Boolean(body.showOnHomepage);
      updateData.approvalStatus = body.showOnHomepage ? 'approved' : 'pending';
    }
    if (body.isPublished !== undefined && body.showOnHomepage === undefined) {
      updateData.isPublished = Boolean(body.isPublished);
      updateData.showOnHomepage = Boolean(body.isPublished);
      updateData.approvalStatus = body.isPublished ? 'approved' : 'pending';
    }
    if (body.approvalStatus !== undefined && body.showOnHomepage === undefined) {
      updateData.approvalStatus = body.approvalStatus;
      if (body.approvalStatus === 'approved') {
        updateData.isPublished = true;
        updateData.showOnHomepage = true;
      } else {
        updateData.isPublished = false;
        updateData.showOnHomepage = false;
      }
    }
    if (body.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(body.isFeatured);
      if (body.isFeatured) {
        // Unset any previous featured
        await Testimonial.updateMany({ _id: { $ne: id } }, { isFeatured: false });
      }
    }
    if (body.displayOrder !== undefined) {
      const ord = Number(body.displayOrder);
      if (!isNaN(ord)) updateData.displayOrder = ord;
    }

    const updated = await Testimonial.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return errorResponse('Testimonial not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Testimonial updated successfully',
      testimonial: updated,
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return errorResponse(error.message, 500);
  }
}

// DELETE: Delete testimonial (Admin only)
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { id } = await params;
    const deleted = await Testimonial.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse('Testimonial not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return errorResponse(error.message, 500);
  }
}
