import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import Media from '@/models/Media';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
];

const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB configurable limit

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.mp4', '.webm'];

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const media = await Media.find().sort({ createdAt: -1 });
    return jsonResponse({ success: true, media });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'general';
    const altText = formData.get('altText') || '';

    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      return errorResponse('No valid file uploaded', 400);
    }

    // Validate file extension
    const rawExt = path.extname(file.name || '').toLowerCase();
    if (rawExt && !ALLOWED_EXTENSIONS.includes(rawExt)) {
      return errorResponse('Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .webp, .svg, .gif, .mp4, .webm', 400);
    }

    // Resolve & Validate MIME type (handling clients/OS where video/svg MIME defaults to generic binary stream)
    let fileMime = (file.type || '').toLowerCase();
    if ((!fileMime || fileMime === 'application/octet-stream' || fileMime === 'binary/octet-stream') && rawExt && MIME_BY_EXT[rawExt]) {
      fileMime = MIME_BY_EXT[rawExt];
    }

    if (!fileMime || !ALLOWED_MIME_TYPES.includes(fileMime)) {
      return errorResponse('Invalid file type. Only JPEG, PNG, WebP, SVG, GIF images and MP4, WebM videos are allowed.', 400);
    }

    // Validate max file size
    const isVideo = ALLOWED_VIDEO_MIME_TYPES.includes(fileMime);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const limitText = isVideo ? '25MB' : '5MB';
      return errorResponse(`File size exceeds the ${limitText} limit. Please upload a file under ${limitText}.`, 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists in public
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate safe unique filename
    const defaultExt = EXT_MAP[fileMime] || (isVideo ? '.mp4' : '.png');
    const ext = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : defaultExt;

    const rawBaseName = path.basename(file.name || 'upload', path.extname(file.name || ''));
    const baseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'file';
    const uniqueFileName = `${baseName}_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    await connectDB();
    const mediaRecord = await Media.create({
      fileName: uniqueFileName,
      originalName: file.name || uniqueFileName,
      url: fileUrl,
      mimeType: fileMime,
      size: file.size,
      category,
      altText,
    });

    return jsonResponse(
      {
        success: true,
        message: 'File uploaded successfully',
        url: fileUrl,
        filePath: fileUrl,
        media: mediaRecord,
      },
      201
    );
  } catch (error) {
    console.error('File upload error:', error);
    return errorResponse(error.message, 500);
  }
}

