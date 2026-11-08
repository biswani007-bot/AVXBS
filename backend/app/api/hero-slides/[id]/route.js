import connectDB from '@/lib/db';
import HeroSlide from '@/models/HeroSlide';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// GET individual slide
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const slide = await HeroSlide.findById(id);
    if (!slide) {
      return errorResponse('Slide not found', 404);
    }
    return jsonResponse({ success: true, slide });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// PUT: Update slide details or toggle active state
export async function PUT(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const slide = await HeroSlide.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!slide) {
      return errorResponse('Slide not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Slide updated successfully',
      slide,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// DELETE: Remove slide
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { id } = await params;

    const deleted = await HeroSlide.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse('Slide not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Slide deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

