import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: string;
  // Basic Info
  phoneNumber?: string;
  email?: string;
  name: string;
  dateOfBirth?: Date;
  gender?: "male" | "female";

  // Profile
  bio?: string;
  profession?: string;
  location?: string;
  height?: number; // in cm

  // Authentication
  password?: string;
  provider?: "phone" | "google" | "email";
  providerId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;

  // Profile Details
  nationality?: string[];
  ethnicity?: string[];
  maritalStatus?: string;
  education?: string;
  religiousPractice?: string;
  faithTags?: string[];
  drinking?: string;
  smoking?: string;
  hijab?: string;
  interests?: string[];
  personality?: string[];
  photos?: string[];
  photoBlurEnabled?: boolean;
  unblurredFor?: string[];

  // Preferences
  preferences?: {
    distance?: number;
    ageRange?: { min: number; max: number };
    religiousPractice?: string[];
    ethnicity?: string[];
    education?: string[];
    children?: string;
    prayer?: string;
    diet?: string;
  };

  // Subscription
  subscription?: {
    plan?: "free" | "premium" | "gold";
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    cancelledAt?: Date;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // KYC
  kycStatus?: "none" | "pending" | "verified" | "rejected" | "manual_review";
  kycRejectedAt?: Date;

  // Status
  role: "user" | "admin" | "moderator";
  status: "active" | "inactive" | "suspended" | "banned";
  isOnboarded: boolean;
  lastActive?: Date;

  // Mahram (for female users)
  mahram?: {
    email?: string;
    relationship?: "father" | "brother" | "paternalUncle" | "maternalUncle" | "grandfather" | "son" | "muslimFriend" | "sisterInIslam" | "communityRepresentative" | "other";
    notifiedAt?: Date;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    phoneNumber: { type: String, sparse: true, unique: true },
    email: { type: String, sparse: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female"] },

    bio: String,
    profession: String,
    location: String,
    height: Number,

    password: String,
    provider: {
      type: String,
      enum: ["phone", "google", "email"],
      default: "phone",
    },
    providerId: String,
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    nationality: [String],
    ethnicity: [String],
    maritalStatus: String,
    education: String,
    religiousPractice: String,
    faithTags: [String],
    drinking: String,
    smoking: String,
    hijab: String,
    interests: [String],
    personality: [String],
    photos: [String],
    photoBlurEnabled: { type: Boolean, default: true },
    unblurredFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    preferences: {
      distance: { type: Number, default: 500 },
      ageRange: {
        min: { type: Number, default: 18 },
        max: { type: Number, default: 60 },
      },
      religiousPractice: [String],
      ethnicity: [String],
      education: [String],
      children: String,
      prayer: String,
      diet: String,
    },

    subscription: {
      plan: {
        type: String,
        enum: ["free", "premium", "gold"],
        default: "free",
      },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: false },
      cancelledAt: Date,
    },
    stripeCustomerId: { type: String, sparse: true },
    stripeSubscriptionId: { type: String, sparse: true },

    kycStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected", "manual_review"],
      default: "none",
    },
    kycRejectedAt: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "banned"],
      default: "active",
    },
    isOnboarded: { type: Boolean, default: false },
    lastActive: Date,

    mahram: {
      email: String,
      relationship: {
        type: String,
        enum: ["father", "brother", "paternalUncle", "maternalUncle", "grandfather", "son", "muslimFriend", "sisterInIslam", "communityRepresentative", "other"],
      },
      notifiedAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate access code for guardian
// Indexes (phoneNumber and email are already indexed via unique:true in the schema)
userSchema.index({ role: 1, status: 1 });
userSchema.index({ gender: 1, status: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  mongoose.deleteModel('User');
}

export const User = (mongoose.models.User as UserModel) || mongoose.model<IUser, UserModel>('User', userSchema);
