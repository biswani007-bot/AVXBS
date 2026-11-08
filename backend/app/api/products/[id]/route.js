import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const product = await Product.findById(params.id);
    if (!product) {
      return errorResponse('Product not found', 404);
    }
    return jsonResponse({ success: true, product });
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

    const product = await Product.findByIdAndUpdate(params.id, data, { new: true, runValidators: true });
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return jsonResponse({ success: true, message: 'Product updated', product });
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
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return jsonResponse({ success: true, message: 'Product deleted' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

