import mongoose, { Schema, Document } from 'mongoose';

export type AdType = 'banner' | 'interstitial';
export type AdPlacement = 'tab_bar' | 'after_swipes';

export interface IAd extends Document {
  title: string;
  description: string;
  type: AdType;
  placement: AdPlacement;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
  // For interstitial ads
  swipeInterval: number; // show ad every N swipes (default 10)
  // Scheduling
  startDate: Date | null;
  endDate: Date | null;
  // Stats
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const adSchema = new Schema<IAd>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['banner', 'interstitial'],
      required: true,
    },
    placement: {
      type: String,
      enum: ['tab_bar', 'after_swipes'],
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    targetUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    swipeInterval: {
      type: Number,
      default: 10,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Ad = mongoose.models.Ad || mongoose.model<IAd>('Ad', adSchema);
