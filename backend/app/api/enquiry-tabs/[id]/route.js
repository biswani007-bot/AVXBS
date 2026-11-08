import connectDB from '@/lib/db';
import EnquiryTab from '@/models/EnquiryTab';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// GET individual category tab
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const tab = await EnquiryTab.findById(id);

    if (!tab) {
      return errorResponse('Category tab not found', 404);
    }

    return jsonResponse({ success: true, tab });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// PUT: Update category tab and items (Admin only)
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
    if (body.tabName !== undefined) updateData.tabName = body.tabName.trim().toUpperCase();
    if (body.category !== undefined) {
      if (['Residential', 'Commercial', 'Both'].includes(body.category)) {
        updateData.category = body.category;
      }
    }
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.items !== undefined && Array.isArray(body.items)) {
      updateData.items = body.items;
    }
    if (body.fields !== undefined && Array.isArray(body.fields)) {
      updateData.fields = body.fields;
    }
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.displayOrder !== undefined) {
      const ord = Number(body.displayOrder);
      if (!isNaN(ord)) updateData.displayOrder = ord;
    }

    const updated = await EnquiryTab.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return errorResponse('Category tab not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Category tab updated successfully',
      tab: updated,
    });
  } catch (error) {
    console.error('Error updating category tab:', error);
    return errorResponse(error.message, 500);
  }
}

// DELETE: Delete category tab (Admin only)
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { id } = await params;
    const deleted = await EnquiryTab.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse('Category tab not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Category tab deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting category tab:', error);
    return errorResponse(error.message, 500);
  }
}
