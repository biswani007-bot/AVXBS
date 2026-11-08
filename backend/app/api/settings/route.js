import connectDB from '@/lib/db';
import SiteSetting from '@/models/SiteSetting';
import { jsonResponse, errorResponse, authenticateRequest } from '@/lib/api-utils';

// Public GET: Retrieve all or by key/group (e.g. key=website_logo, key=secondary_banner, group=branding)
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const group = searchParams.get('group');

    // Auto-seed default about_overview_image if not present yet
    const existingAboutImg = await SiteSetting.findOne({ key: 'about_overview_image' });
    if (!existingAboutImg) {
      await SiteSetting.create({
        key: 'about_overview_image',
        value: '/images/about/about-water-treatment.jpg',
        description: 'About AVXBS overview section showcase image',
        group: 'about'
      });
    }

    // Specific key query
    if (key) {
      const setting = await SiteSetting.findOne({ key });
      return jsonResponse({
        success: true,
        data: setting || null,
        setting: setting ? setting.value : null,
        settings: setting ? { [setting.key]: setting.value } : {},
        raw: setting ? [setting] : [],
      });
    }

    const query = {};
    if (group) {
      query.group = group;
    }

    const settings = await SiteSetting.find(query);
    
    // Format into an easy key-value map
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const dataPayload = (group && settings.length === 1) ? settings[0] : settingsMap;

    return jsonResponse({
      success: true,
      data: dataPayload,
      settings: settingsMap,
      raw: settings,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// Admin POST: Upsert site settings
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    await connectDB();
    const { key, value, description, group } = await req.json();

    if (!key) {
      return errorResponse('Setting key is required', 400);
    }

    const updated = await SiteSetting.findOneAndUpdate(
      { key },
      { key, value, description: description || '', group: group || 'general' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return jsonResponse({
      success: true,
      message: 'Setting saved successfully',
      setting: updated,
      data: updated,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export const PUT = POST;

