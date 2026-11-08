import connectDB from '@/lib/db';
import EnquirySubmission from '@/models/EnquirySubmission';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// GET individual enquiry submission
export async function GET(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { id } = await params;
    const enquiry = await EnquirySubmission.findById(id);

    if (!enquiry) {
      return errorResponse('Enquiry submission not found', 404);
    }

    return jsonResponse({ success: true, enquiry });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// PUT: Update enquiry status or notes (Admin only)
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
    if (body.status !== undefined) {
      if (['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'].includes(body.status)) {
        updateData.status = body.status;
      }
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await EnquirySubmission.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return errorResponse('Enquiry submission not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Enquiry updated successfully',
      enquiry: updated,
    });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    return errorResponse(error.message, 500);
  }
}

// DELETE: Delete enquiry submission (Admin only)
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { id } = await params;
    const deleted = await EnquirySubmission.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse('Enquiry submission not found', 404);
    }

    return jsonResponse({
      success: true,
      message: 'Enquiry deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return errorResponse(error.message, 500);
  }
}

