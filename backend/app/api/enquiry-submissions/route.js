import connectDB from '@/lib/db';
import EnquirySubmission from '@/models/EnquirySubmission';
import EnquiryTab from '@/models/EnquiryTab';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// GET: Retrieve submitted enquiries (Admin only, with search, category & tab filters, and export format)
export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const tabName = searchParams.get('tabName');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const format = searchParams.get('format'); // 'csv' or json

    let query = {};

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (tabName && tabName !== 'ALL') {
      query.tabName = tabName;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: regex },
        { phoneNumber: regex },
        { email: regex },
        { tabName: regex },
      ];
    }

    const enquiries = await EnquirySubmission.find(query).sort({ submittedAt: -1, createdAt: -1 });

    // Handle CSV Export
    if (format === 'csv') {
      const headers = ['Submission ID', 'Date', 'Customer Name', 'Phone Number', 'Email', 'Selected Tab', 'Category', 'Status', 'Form Details'];
      const csvRows = [headers.join(',')];

      for (const enq of enquiries) {
        const formDetailsStr = enq.formData 
          ? JSON.stringify(Object.fromEntries(enq.formData instanceof Map ? enq.formData : Object.entries(enq.formData || {}))).replace(/"/g, '""')
          : '';

        const row = [
          `"${enq._id}"`,
          `"${new Date(enq.submittedAt || enq.createdAt).toLocaleString('en-IN')}"`,
          `"${(enq.customerName || '').replace(/"/g, '""')}"`,
          `"${(enq.phoneNumber || '').replace(/"/g, '""')}"`,
          `"${(enq.email || '').replace(/"/g, '""')}"`,
          `"${(enq.tabName || '').replace(/"/g, '""')}"`,
          `"${(enq.category || '').replace(/"/g, '""')}"`,
          `"${(enq.status || '').replace(/"/g, '""')}"`,
          `"${formDetailsStr}"`,
        ];
        csvRows.push(row.join(','));
      }

      return new Response(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="AVXBS_Enquiries_${Date.now()}.csv"`,
        },
      });
    }

    return jsonResponse({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    console.error('Error fetching enquiry responses:', error);
    return errorResponse(error.message, 500);
  }
}

// POST: Public submission from customer enquiry tabs
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { tabId, tabName, category, customerName, phoneNumber, email = '', formData = {} } = body;

    // Validation
    if (!customerName || !customerName.trim()) {
      return errorResponse('Customer Name is required', 400);
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return errorResponse('Phone Number is required', 400);
    }

    // Phone number format validation (at least 7 to 15 digits)
    const phoneClean = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
    if (!/^\d{7,15}$/.test(phoneClean)) {
      return errorResponse('Please enter a valid phone number (e.g. 10 digits)', 400);
    }

    // Email validation if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return errorResponse('Please provide a valid email address', 400);
      }
    }

    if (!tabName || !tabName.trim()) {
      return errorResponse('Tab name is required', 400);
    }

    const submission = await EnquirySubmission.create({
      tabId: tabId || null,
      tabName: tabName.trim().toUpperCase(),
      category: ['Residential', 'Commercial'].includes(category) ? category : 'Residential',
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email ? email.trim() : '',
      formData: formData,
      status: 'New',
      submittedAt: new Date(),
    });

    return jsonResponse(
      {
        success: true,
        message: 'Your enquiry has been received successfully. Our engineering specialist will connect with you shortly.',
        submission,
      },
      201
    );
  } catch (error) {
    console.error('Error recording enquiry submission:', error);
    return errorResponse(error.message, 500);
  }
}

