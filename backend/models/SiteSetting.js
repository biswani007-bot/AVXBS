import mongoose from 'mongoose';

const SiteSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    group: {
      type: String,
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SiteSetting || mongoose.model('SiteSetting', SiteSettingSchema);

