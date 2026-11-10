import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
};

// Candidate directories where uploaded files may reside across various deployment layouts
function getUploadDirectories() {
  const cwd = process.cwd();
  const dirs = new Set([
    path.join(cwd, 'public', 'uploads'),
    path.join(cwd, 'backend', 'public', 'uploads'),
    path.join(cwd, '..', 'public', 'uploads'),
    path.join(cwd, '..', 'backend', 'public', 'uploads'),
    path.join(cwd, 'uploads'),
    path.join(cwd, '..', 'uploads'),
  ]);

  // Production aaPanel paths on Linux
  if (process.platform === 'linux') {
    dirs.add('/www/wwwroot/avxadmin.visital.in/public/uploads');
    dirs.add('/www/wwwroot/avxadmin.visital.in/backend/public/uploads');
    dirs.add('/www/wwwroot/avxadmin.visital.in/uploads');
  }

  return Array.from(dirs);
}

export async function GET(req, { params }) {
  try {
    const rawSegments = params?.path || [];
    const segments = Array.isArray(rawSegments) ? rawSegments : [rawSegments];
    
    // Decode URI segments safely
    const decodedSegments = segments.map(seg => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    });

    // Security: sanitize path against directory traversal
    const joinedPath = decodedSegments.join('/');
    if (joinedPath.includes('..') || rawSegments.some(s => typeof s === 'string' && s.includes('..'))) {
      return new Response('Invalid file path', { status: 400 });
    }
    const safePath = path.normalize(joinedPath).replace(/^(\.\.[\/\\])+/, '');
    if (!safePath || safePath.includes('..') || path.isAbsolute(safePath)) {
      return new Response('Invalid file path', { status: 400 });
    }

    const candidateDirs = getUploadDirectories();

    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, safePath);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const ext = path.extname(fullPath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          const fileBuffer = fs.readFileSync(fullPath);

          return new Response(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Length': stat.size.toString(),
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
              'Last-Modified': stat.mtime.toUTCString(),
            },
          });
        }
      }
    }

    return new Response('File not found', { status: 404 });
  } catch (err) {
    console.error('Dynamic uploads route error:', err);
    return new Response('Server error', { status: 500 });
  }
}
