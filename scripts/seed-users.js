const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
  location: String,
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
  preferences: {
    distance: Number,
    ageRange: { min: Number, max: Number },
    religiousPractice: [String],
    ethnicity: [String],
    education: [String],
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium', 'gold'], default: 'free' },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false },
  },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'banned'], default: 'active' },
  isOnboarded: { type: Boolean, default: false },
  lastActive: Date,
  guardian: {
    email: String,
    name: String,
    accessCode: String,
    status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
    linkedAt: Date,
    requestedAt: Date,
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── Countries with dial code and national number length ─────────────────────
const COUNTRIES = [
  { code: 'DZ', dial: '+213', len: 9, name: 'Algeria' },
  { code: 'BE', dial: '+32',  len: 9, name: 'Belgium' },
  { code: 'FR', dial: '+33',  len: 9, name: 'France' },
  { code: 'MA', dial: '+212', len: 9, name: 'Morocco' },
  { code: 'TN', dial: '+216', len: 8, name: 'Tunisia' },
  { code: 'TR', dial: '+90',  len: 10, name: 'Turkey' },
  { code: 'DE', dial: '+49',  len: 10, name: 'Germany' },
  { code: 'GB', dial: '+44',  len: 10, name: 'United Kingdom' },
  { code: 'US', dial: '+1',   len: 10, name: 'United States' },
  { code: 'CA', dial: '+1',   len: 10, name: 'Canada' },
  { code: 'EG', dial: '+20',  len: 10, name: 'Egypt' },
  { code: 'SA', dial: '+966', len: 9, name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', len: 9, name: 'UAE' },
  { code: 'MY', dial: '+60',  len: 10, name: 'Malaysia' },
  { code: 'ID', dial: '+62',  len: 11, name: 'Indonesia' },
];

// ── Names ───────────────────────────────────────────────────────────────────
const MALE_NAMES = [
  'Adam', 'Youssef', 'Omar', 'Ibrahim', 'Khalid',
  'Mehdi', 'Amine', 'Rayan', 'Bilal', 'Hamza',
  'Tariq', 'Nabil', 'Sofiane', 'Zakaria', 'Moussa',
  'Ilyas', 'Ismail', 'Walid', 'Karim', 'Samir',
];

const FEMALE_NAMES = [
  'Fatima', 'Amina', 'Khadija', 'Maryam', 'Aisha',
  'Nour', 'Yasmine', 'Lina', 'Sara', 'Hana',
  'Salma', 'Leila', 'Ines', 'Rania', 'Dina',
  'Samira', 'Zineb', 'Houda', 'Layla', 'Malika',
  'Asma', 'Nawal', 'Soumia', 'Farah', 'Imane',
  'Meriem', 'Sabrina', 'Wafa', 'Nadia', 'Lamia',
];

const LAST_NAMES = [
  'Benali', 'Mansouri', 'Bouzid', 'Khelifi', 'Hadj',
  'El Amrani', 'Saidi', 'Belkacem', 'Cherif', 'Djebbar',
  'Osman', 'Haddad', 'Boudiaf', 'Larbi', 'Toumi',
];

const PROFESSIONS = [
  'Software Engineer', 'Doctor', 'Teacher', 'Architect', 'Pharmacist',
  'Accountant', 'Lawyer', 'Dentist', 'Nurse', 'Business Analyst',
  'Graphic Designer', 'Civil Engineer', 'Journalist', 'Psychologist', 'Chef',
];

const LOCATIONS = [
  'Brussels, Belgium', 'Paris, France', 'Algiers, Algeria',
  'Casablanca, Morocco', 'Tunis, Tunisia', 'Istanbul, Turkey',
  'Berlin, Germany', 'London, UK', 'Cairo, Egypt',
  'Riyadh, Saudi Arabia', 'Dubai, UAE', 'Kuala Lumpur, Malaysia',
];

// Values must match EXACTLY what the mobile app stores
const INTERESTS = [
  'football', 'basketball', 'gym', 'running', 'tennis', 'swimming', 'yoga',
  'art', 'photography', 'writing', 'music', 'reading', 'cooking',
  'roadTrips', 'nature', 'hiking', 'camping', 'cycling',
  'volunteering', 'charity', 'gaming', 'coding',
];

const PERSONALITIES = [
  'ambitious', 'kind', 'funny', 'creative', 'patient',
  'optimistic', 'adventurous', 'loyal', 'humble', 'honest',
  'empathetic', 'cheerful', 'romantic', 'spiritual', 'intellectual',
];

// Country codes (ISO 3166-1 alpha-2)
const NATIONALITIES = [
  'DZ', 'MA', 'TN', 'TR', 'FR',
  'BE', 'EG', 'SA', 'AE', 'MY',
  'ID', 'DE', 'GB', 'CA', 'US',
];

const ETHNICITIES = ['arab', 'amazigh', 'turkish', 'southAsian', 'african', 'european', 'northAfrican', 'middleEastern', 'mixed'];
const EDUCATION_LEVELS = ['highSchool', 'bachelors', 'masters', 'doctorate', 'trade', 'other'];
const MARITAL_STATUSES = ['single', 'divorced', 'widowed'];
const RELIGIOUS_PRACTICES = ['veryPracticing', 'practicing', 'moderate', 'liberal', 'nonPracticing'];
const FAITH_TAGS = ['prayer', 'fasting', 'zakat', 'hajj', 'quranReading', 'dhikr', 'charity', 'halalFood', 'mosqueAttendance', 'sunnah'];

// ── Helpers ─────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, min, max) => {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function buildPhotos(index) {
  const count = randomInt(3, 5);
  const photos = [];
  // Use unique avatar IDs per user to avoid duplicates
  const baseId = ((index - 1) * 5) % 70 + 1;
  for (let i = 0; i < count; i++) {
    const imgId = ((baseId + i) % 70) + 1;
    photos.push(`https://i.pravatar.cc/800?img=${imgId}`);
  }
  return photos;
}

function buildPhone(country, index) {
  // index is 1..50 — pad with leading zeros after "555" prefix
  const suffix = String(index).padStart(2, '0');
  const fivePrefix = '555';
  // remaining digits to fill = national length - len("555") - len(suffix)
  const padLen = country.len - fivePrefix.length - suffix.length;
  const padding = '0'.repeat(Math.max(0, padLen));
  const national = fivePrefix + padding + suffix;
  return country.dial + national;
}

function randomDOB(minAge, maxAge) {
  const now = new Date();
  const year = now.getFullYear() - randomInt(minAge, maxAge);
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  return new Date(year, month, day);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env or .env.local');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // Drop ALL collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.dropCollection(col.name);
    console.log(`  Dropped collection: ${col.name}`);
  }
  console.log('Database cleared.\n');

  // Re-create admin
  const salt = await bcrypt.genSalt(10);
  const hashedPw = await bcrypt.hash('admin123', salt);
  await User.create({
    email: 'admin@admin.com',
    name: 'Admin User',
    password: hashedPw,
    role: 'admin',
    status: 'active',
    provider: 'email',
    isEmailVerified: true,
    isPhoneVerified: true,
    isOnboarded: true,
  });
  console.log('Admin created: admin@admin.com / admin123\n');

  // Create 50 users (1–20 male, 21–50 female)
  const users = [];
  for (let i = 1; i <= 50; i++) {
    const isMale = i <= 20;
    const gender = isMale ? 'male' : 'female';
    const firstName = isMale ? MALE_NAMES[i - 1] : FEMALE_NAMES[i - 21];
    const lastName = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const phone = buildPhone(country, i);
    const emailHandle = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, '')}${i}`;
    const email = `${emailHandle}@alaqd-test.com`;
    const location = pick(LOCATIONS);
    const nationality = [pick(NATIONALITIES)];
    const ethnicity = [pick(ETHNICITIES)];

    const user = {
      name,
      phoneNumber: phone,
      email,
      gender,
      dateOfBirth: randomDOB(20, 38),
      bio: `Salam, I'm ${firstName}. Looking for a serious and blessed relationship.`,
      profession: pick(PROFESSIONS),
      location,
      height: isMale ? randomInt(168, 195) : randomInt(155, 178),
      provider: 'phone',
      isEmailVerified: true,
      isPhoneVerified: true,
      nationality,
      ethnicity,
      maritalStatus: pick(MARITAL_STATUSES),
      education: pick(EDUCATION_LEVELS),
      religiousPractice: pick(RELIGIOUS_PRACTICES),
      faithTags: pickN(FAITH_TAGS, 1, 3),
      drinking: 'No',
      smoking: pick(['No', 'No', 'No', 'Yes']),
      interests: pickN(INTERESTS, 3, 6),
      personality: pickN(PERSONALITIES, 2, 4),
      photos: buildPhotos(i),
      photoBlurEnabled: true,
      preferences: {
        distance: 500,
        ageRange: { min: 18, max: 60 },
        religiousPractice: [],
        ethnicity: [],
        education: [],
      },
      subscription: {
        plan: pick(['free', 'free', 'free', 'premium', 'gold']),
        isActive: false,
      },
      role: 'user',
      status: 'active',
      isOnboarded: true,
      lastActive: new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)),
    };

    users.push(user);
  }

  await User.insertMany(users);

  console.log('Created 50 users:\n');
  console.log('  #  | Gender | Phone              | Email                              | Name');
  console.log('-----+--------+--------------------+------------------------------------+-------------------------');
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const idx = String(i + 1).padStart(3);
    const g = u.gender.padEnd(6);
    const p = u.phoneNumber.padEnd(18);
    const e = u.email.padEnd(34);
    console.log(`  ${idx} | ${g} | ${p} | ${e} | ${u.name}`);
  }

  console.log('\nDone!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
