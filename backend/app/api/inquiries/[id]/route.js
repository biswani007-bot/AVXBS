import connectDB from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

export async function GET(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const inquiry = await Inquiry.findById(params.id);
    if (!inquiry) {
      return errorResponse('Inquiry not found', 404);
    }

    return jsonResponse({ success: true, inquiry });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const body = await req.json();
    const { status, remarks, name, email, mobile, location, waterIssue, product, type } = body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (remarks !== undefined) updateFields.remarks = remarks;
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (mobile) updateFields.mobile = mobile;
    if (location !== undefined) updateFields.location = location;
    if (waterIssue !== undefined) updateFields.waterIssue = waterIssue;
    if (product) updateFields.product = product;
    if (type) updateFields.type = type;

    const inquiry = await Inquiry.findByIdAndUpdate(params.id, updateFields, { new: true });
    if (!inquiry) {
      return errorResponse('Inquiry not found', 404);
    }

    return jsonResponse({ success: true, message: 'Inquiry updated', inquiry });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const inquiry = await Inquiry.findByIdAndDelete(params.id);
    if (!inquiry) {
      return errorResponse('Inquiry not found', 404);
    }

    return jsonResponse({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

