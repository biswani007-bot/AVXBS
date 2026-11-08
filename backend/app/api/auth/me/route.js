import connectDB from '@/lib/db';
import User from '@/models/User';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/api-utils';

export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const user = await User.findById(auth.user.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return jsonResponse({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { name, currentPassword, newPassword } = await req.json();

    const user = await User.findById(auth.user.userId).select('+password');
    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (name) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return errorResponse('Current password is required to change password', 400);
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return errorResponse('Current password is incorrect', 400);
      }
      if (newPassword.length < 6) {
        return errorResponse('New password must be at least 6 characters', 400);
      }
      user.password = newPassword;
    }

    await user.save();

    return jsonResponse({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

