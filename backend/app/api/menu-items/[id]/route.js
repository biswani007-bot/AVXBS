import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const item = await MenuItem.findById(params.id);
    if (!item) {
      return errorResponse('Menu item not found', 404);
    }
    return jsonResponse({ success: true, item });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const data = await req.json();

    const item = await MenuItem.findByIdAndUpdate(params.id, data, { new: true });
    if (!item) {
      return errorResponse('Menu item not found', 404);
    }

    return jsonResponse({ success: true, message: 'Menu item updated', item });
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
    const item = await MenuItem.findByIdAndDelete(params.id);
    if (!item) {
      return errorResponse('Menu item not found', 404);
    }

    return jsonResponse({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

