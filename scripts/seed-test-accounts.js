const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env.local or .env
const envLocal = path.join(__dirname, '..', '.env.local');
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envLocal)) {
  require('dotenv').config({ path: envLocal });
} else {
  require('dotenv').config({ path: envFile });
}

const MONGODB_URI = process.env.MONGODB_URI || '';

// ── Schema (mirrors the app model) ──────────────────────────────────────────
const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, sparse: true, unique: true },
  email: { type: String, sparse: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female'] },
  bio: String,
  profession: String,
  height: Number,
  password: String,
  provider: { type: String, enum: ['phone', 'google', 'email'], default: 'phone' },
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
  unblurredFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  preferences: {
    distance: Number,
    ageRange: { min: Number, max: Number },
    religiousPractice: [String],
    ethnicity: [String],
    education: [String],
    children: String,
    prayer: String,
    diet: String,
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium', 'gold'], default: 'free' },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false },
    cancelledAt: Date,
    stripeCustomerId: { type: String, sparse: true },
    stripeSubscriptionId: { type: String, sparse: true },
  },
  kycStatus: { type: String, enum: ['none', 'pending', 'verified', 'rejected', 'manual_review'], default: 'none' },
  kycRejectedAt: { type: Date, default: null },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'banned'], default: 'active' },
  isOnboarded: { type: Boolean, default: false },
  lastActive: Date,
  mahram: {
    email: String,
    relationship: { type: String, enum: ['father', 'brother', 'paternalUncle', 'maternalUncle', 'grandfather', 'son', 'muslimFriend', 'sisterInIslam', 'communityRepresentative', 'other'] },
    notifiedAt: Date,
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Test accounts ───────────────────────────────────────────────────────────
const TEST_ACCOUNTS = [
  {
    phoneNumber: '+213540569559',
    email: 'mohameddn988@gmail.com',
    name: 'Islem gir version',
    gender: 'female',
    dateOfBirth: new Date('2003-09-17T23:00:00.000Z'),
    bio: 'Hello its my girl version test test test',
    profession: 'beautician',
    height: 171,
    provider: 'phone',
    isEmailVerified: true,
    isPhoneVerified: true,
    nationality: ['DE'],
    ethnicity: ['black'],
    maritalStatus: 'annulled',
    education: 'other',
    religiousPractice: 'nonPracticing',
    faithTags: ['umrah'],
    drinking: 'No',
    smoking: 'No',
    interests: ['martialArts', 'diy', 'halalFoodie', 'healthyEating', 'football', 'basketball', 'gym'],
    personality: ['funny', 'romantic', 'charismatic', 'kind'],
    photos: [
      'https://res.cloudinary.com/deyjooxbi/image/upload/v1774880643/al-aqd/profiles/ls53bwur8ij13gq7lw5x.jpg',
      'https://res.cloudinary.com/deyjooxbi/image/upload/v1774892968/al-aqd/profiles/fq0t3yw0ukdnp3ch71ai.jpg',
    ],
    photoBlurEnabled: true,
    unblurredFor: [],
    preferences: {
      ageRange: { min: 18, max: 60 },
      distance: 500,
      religiousPractice: [],
      ethnicity: [],
      education: [],
      children: '',
      diet: '',
      prayer: '',
    },
    subscription: { plan: 'free', isActive: false },
    kycStatus: 'none',
    role: 'user',
    status: 'active',
    isOnboarded: true,
    lastActive: new Date('2026-04-01T22:16:08.207Z'),
    mahram: {
      email: 'denmohamed988@gmail.com',
      relationship: 'communityRepresentative',
      notifiedAt: new Date('2026-03-31T11:39:31.572Z'),
    },
    providerId: '100739737562995474295',
  },
  {
    phoneNumber: '+213665954002',
    email: 'msideneche@gmail.com',
    name: 'Mohamed deneche',
    gender: 'male',
    dateOfBirth: new Date('2000-12-17T23:00:00.000Z'),
    bio: 'Hellloooo my name s jeff',
    profession: 'technician',
    height: 193,
    provider: 'google',
    providerId: '107802273377223087756',
    isEmailVerified: true,
    isPhoneVerified: true,
    nationality: ['DE', 'DZ'],
    ethnicity: ['european', 'black'],
    maritalStatus: 'single',
    education: 'trade',
    religiousPractice: 'preferNotToSay',
    faithTags: [],
    drinking: 'Yes',
    smoking: 'Yes',
    interests: ['backpacking', 'art', 'diningOut', 'tennis'],
    personality: ['estp', 'patient', 'empathetic', 'introverted', 'cultural'],
    photos: [
      'https://res.cloudinary.com/deyjooxbi/image/upload/v1774873236/al-aqd/profiles/k73fr986oetsaoc2dbgz.jpg',
    ],
    photoBlurEnabled: true,
    unblurredFor: [],
    preferences: {
      ageRange: { min: 18, max: 60 },
      distance: 500,
      religiousPractice: [],
      ethnicity: [],
      education: [],
      children: '',
      diet: '',
      prayer: '',
    },
    subscription: { plan: 'free', isActive: false },
    kycStatus: 'none',
    role: 'user',
    status: 'active',
    isOnboarded: true,
    lastActive: new Date('2026-04-01T22:26:17.033Z'),
  },
];

// ── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env or .env.local');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  for (const account of TEST_ACCOUNTS) {
    // Remove existing user by phone or email to avoid duplicates
    await User.deleteMany({
      $or: [
        { phoneNumber: account.phoneNumber },
        { email: account.email },
      ],
    });

    await User.create(account);
    console.log(`Created: ${account.name} (${account.email} / ${account.phoneNumber})`);
  }

  console.log('\nDone!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
