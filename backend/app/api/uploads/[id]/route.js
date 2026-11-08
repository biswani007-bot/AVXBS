import { unlink } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import Media from '@/models/Media';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const media = await Media.findById(params.id);
    if (!media) {
      return errorResponse('Media item not found', 404);
    }

    // Try deleting physical file
    try {
      const filePath = path.join(process.cwd(), 'public', 'uploads', media.fileName);
      await unlink(filePath);
    } catch (e) {
      console.warn('Physical file delete warning:', e.message);
    }

    await Media.findByIdAndDelete(params.id);

    return jsonResponse({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

