import mongoose, { Schema } from 'mongoose';

export interface ISetting {
  // General settings
  platformName: string;
  supportEmail: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // Security settings
  require2FA: boolean;
  passwordExpiryDays: number;
  loginAttemptsLimit: number;
  sessionTimeoutMinutes: number;

  // Ads settings
  adsEnabled: boolean;
  freeSwipeLimit: number;

  // Integrations settings
  stripeEnabled: boolean;
  stripeApiKey: string;
  s3Enabled: boolean;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Bucket: string;
  s3Region: string;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId: string;

  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    // General settings
    platformName: {
      type: String,
      default: 'Al-Aqd',
    },
    supportEmail: {
      type: String,
      default: 'support@al-aqd.com',
    },
    defaultLanguage: {
      type: String,
      default: 'English',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'We are currently performing maintenance. Please check back later.',
    },

    // Security settings
    require2FA: {
      type: Boolean,
      default: false,
    },
    passwordExpiryDays: {
      type: Number,
      default: 90,
    },
    loginAttemptsLimit: {
      type: Number,
      default: 5,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 60,
    },

    // Ads settings
    adsEnabled: {
      type: Boolean,
      default: true,
    },
    freeSwipeLimit: {
      type: Number,
      default: 7,
    },

    // Integrations settings
    stripeEnabled: {
      type: Boolean,
      default: true,
    },
    stripeApiKey: {
      type: String,
      default: '',
    },
    s3Enabled: {
      type: Boolean,
      default: true,
    },
    s3AccessKey: {
      type: String,
      default: '',
    },
    s3SecretKey: {
      type: String,
      default: '',
    },
    s3Bucket: {
      type: String,
      default: '',
    },
    s3Region: {
      type: String,
      default: 'us-east-1',
    },
    googleAnalyticsEnabled: {
      type: Boolean,
      default: false,
    },
    googleAnalyticsId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.models.Setting || mongoose.model<ISetting>('Setting', settingSchema);
