import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import InquirySection from '@/models/InquirySection';
import { authenticateRequest } from '@/lib/api-utils';

const DEFAULT_CONFIG = {
  isEnabled: true,
  imageUrl: '/images/hero-enhanced/pure-faucet-glass.jpg',
  imageAlt: 'Premium modern water purification faucet pouring crystal-clear drinking water into a transparent glass goblet',
  imagePosition: 'left',
  imageFit: 'contain',
  imageMaxHeight: 480,

  line1Text1: 'Now',
  line1Color1: '#171B2D',
  line1Text2: 'Just',
  line1Color2: 'gradient',

  line2Text1: 'Put Your',
  line2Color1: '#171B2D',
  line2Text2: 'Inquiry',
  line2Color2: 'gradient',

  line3Text1: 'And Get the',
  line3Color1: '#171B2D',
  line3Text2: 'Solution.',
  line3Color2: 'gradient',

  line4Text1: 'At',
  line4Color1: '#171B2D',
  line4Text2: 'Door step',
  line4Color2: '#087CC1',

  description:
    'Engineered whole-house and commercial water purification, softening, and filtration solutions installed directly at your doorstep.',
  showDescription: false,
};

// GET: Public fetch of Inquiry Section settings
export async function GET() {
  try {
    await connectDB();
    const config = await InquirySection.findOne();
    return NextResponse.json({ success: true, data: config || null });
  } catch (error) {
    console.error('[GET /api/inquiry-section] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Admin update of Inquiry Section settings
export async function PUT(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();

    let config = await InquirySection.findOne();
    if (!config) {
      config = await InquirySection.create({ ...DEFAULT_CONFIG, ...body });
    } else {
      config = await InquirySection.findByIdAndUpdate(
        config._id,
        { $set: body },
        { new: true, runValidators: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry section updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('[PUT /api/inquiry-section] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update inquiry section' },
      { status: 500 }
    );
  }
}

export const POST = PUT;

