import { NextResponse } from 'next/server';
import { verifyToken } from './auth';

export async function authenticateRequest(req) {
  // Check auth header or cookie
  let token = null;

  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    const cookieToken = req.cookies.get('avxbs_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    return { error: 'Authentication required. No token provided.', status: 401 };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { error: 'Invalid or expired authentication token.', status: 401 };
  }

  return { user: payload };
}

export function jsonResponse(data, status = 200, headers = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(message, status = 400, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

