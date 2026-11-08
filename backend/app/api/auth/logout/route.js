import { NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/api-utils';

export async function POST(req) {
  const response = jsonResponse({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete('avxbs_token');
  return response;
}

