/**
 * Seed 50 minimal test accounts — 20 male + 30 female
 * Phones: +1555000001 … +1555000050
 *
 * Usage:
 *   node scripts/seed-50-users.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// ─── Env ──────────────────────────────────────────────────────────────────────
const envLocal = path.join(__dirname, '..', '.env.local');
const envFile  = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: fs.existsSync(envLocal) ? envLocal : envFile });

const MONGODB_URI = process.env.MONGODB_URI || '';

// ─── Schema (minimal, mirrors User model) ────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    phoneNumber:       { type: String, sparse: true, unique: true },
    name:              { type: String, required: true },
    provider:          { type: String, default: 'phone' },
    isEmailVerified:   { type: Boolean, default: false },
    isPhoneVerified:   { type: Boolean, default: true },
    gender:            String,
    dateOfBirth:       Date,
    bio:               String,
    profession:        String,
    location:          String,
    height:            Number,
    nationality:       [String],
    ethnicity:         [String],
    maritalStatus:     String,
    education:         String,
    religiousPractice: String,
    faithTags:         [String],
    drinking:          String,
    smoking:           String,
    interests:         [String],
    personality:       [String],
    photos:            [String],
    preferences: {
      ageRange:          { min: Number, max: Number },
      distance:          Number,
      religiousPractice: [String],
      ethnicity:         [String],
      education:         [String],
    },
    subscription: {
      plan:     { type: String, default: 'free' },
      isActive: { type: Boolean, default: false },
    },
    role:        { type: String, default: 'user' },
    status:      { type: String, default: 'active' },
    isOnboarded: { type: Boolean, default: true },
    lastActive:  Date,
    guardian:    { status: { type: String, default: 'pending' } },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ─── Data pools ───────────────────────────────────────────────────────────────
const maleNames = [
  'Adam Bouazza', 'Bilal Mokhtar', 'Hamza Dridi', 'Ilias Benali', 'Karim Sahli',
  'Malik Tazi', 'Nabil Charef', 'Omar Belkacemi', 'Rayan Amrani', 'Sofiane Guerfi',
  'Tarek Messaoudi', 'Walid Lahlou', 'Yacine Boudali', 'Zakaria Hamdi', 'Amine Djellal',
  'Farid Oussama', 'Ghani Belhouari', 'Hakim Khelifi', 'Idris Benabdallah', 'Jawad Rizki',
];

const femaleNames = [
  'Amel Bouazza', 'Bouchra Mokhtar', 'Chaïma Dridi', 'Dina Benali', 'Fatima Sahli',
  'Ghofrane Tazi', 'Hana Charef', 'Ines Belkacemi', 'Jihane Amrani', 'Khadija Guerfi',
  'Leila Messaoudi', 'Meriem Lahlou', 'Nadia Boudali', 'Oumaima Hamdi', 'Priya Benabdallah',
  'Rim Oussama', 'Sara Belhouari', 'Thiziri Khelifi', 'Umm Kalsum Rizki', 'Widad Djellal',
  'Yasmine Benali', 'Zineb Mokhtar', 'Assia Bouazza', 'Basma Dridi', 'Cyrine Sahli',
  'Douae Tazi', 'Elham Charef', 'Fadwa Belkacemi', 'Ghizlane Amrani', 'Hayet Guerfi',
];

const professions = [
  'Ingénieur', 'Médecin', 'Enseignant(e)', 'Avocat(e)', 'Architecte',
  'Pharmacien(ne)', 'Comptable', 'Designer', 'Infirmier(ère)', 'Développeur(se)',
  'Journaliste', 'Chef de projet', 'Commercial(e)', 'Psychologue', 'Entrepreneur(se)',
];

const locations = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux',
  'Nantes', 'Strasbourg', 'Lille', 'Ottawa', 'Montréal',
  'Alger', 'Tunis', 'Casablanca', 'Dubai', 'Londres',
];

const nationalities = ['DZ', 'TN', 'MA', 'FR', 'BE', 'CA', 'AE'];
const ethnicities   = ['Arabe', 'Berbère', 'Africain(e)', 'Métis(se)', 'Européen(ne)'];
const educations    = ['licence', 'masters', 'doctorat', 'bac', 'bts'];
const practices     = ['practicing', 'moderate', 'liberal', 'non-practicing'];
const maritalStatuses = ['single', 'divorced', 'annulled', 'widowed'];
const interestPool  = [
  'Lecture', 'Voyages', 'Cuisine', 'Sport', 'Musique', 'Cinéma',
  'Randonnée', 'Tennis', 'Natation', 'Photographie', 'Arts martiaux',
];
const personalityPool = ['creative', 'intj', 'enfj', 'infp', 'entp', 'cheerful', 'calm'];

// Generic neutral avatar placeholders (won't break if no real URL)
const MALE_PHOTOS   = ['https://i.pravatar.cc/800?img='];
const FEMALE_PHOTOS = ['https://i.pravatar.cc/800?img='];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const dob = (minAge, maxAge) => {
  const now = new Date();
  const year = now.getFullYear() - rnd(minAge, maxAge);
  return new Date(year, rnd(0, 11), rnd(1, 28));
};

function buildUser(index, gender, name) {
  const phone = `+1555000${String(index).padStart(3, '0')}`;
  const isFemale = gender === 'female';
  const avatarIdx = rnd(1, 70);

  return {
    phoneNumber:       phone,
    name,
    provider:          'phone',
    isPhoneVerified:   true,
    isEmailVerified:   false,
    gender,
    dateOfBirth:       dob(20, 38),
    bio:               `Bonjour, je suis ${name.split(' ')[0]}. En recherche d'une relation sérieuse et halal.`,
    profession:        pick(professions),
    location:          pick(locations),
    height:            isFemale ? rnd(155, 175) : rnd(170, 195),
    nationality:       [pick(nationalities)],
    ethnicity:         [pick(ethnicities)],
    maritalStatus:     pick(maritalStatuses),
    education:         pick(educations),
    religiousPractice: pick(practices),
    faithTags:         [],
    drinking:          'No',
    smoking:           'No',
    interests:         pickN(interestPool, 3),
    personality:       pickN(personalityPool, 2),
    photos:            [`https://i.pravatar.cc/800?img=${avatarIdx}`],
    preferences: {
      ageRange:          { min: 18, max: 60 },
      distance:          100,
      religiousPractice: [],
      ethnicity:         [],
      education:         [],
    },
    subscription: { plan: 'free', isActive: false },
    role:        'user',
    status:      'active',
    isOnboarded: true,
    lastActive:  new Date(),
    guardian:    { status: 'pending' },
  };
}

// ─── Build users list ─────────────────────────────────────────────────────────
const users = [];

// Males: index 1–20
for (let i = 0; i < 20; i++) {
  users.push(buildUser(i + 1, 'male', maleNames[i]));
}

// Females: index 21–50
for (let i = 0; i < 30; i++) {
  users.push(buildUser(i + 21, 'female', femaleNames[i]));
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env / .env.local');

  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  let created = 0;
  let skipped = 0;

  for (const data of users) {
    const exists = await User.findOne({ phoneNumber: data.phoneNumber });
    if (exists) {
      console.log(`  SKIP  ${data.phoneNumber}  (${data.name}) — already exists`);
      skipped++;
      continue;
    }
    await User.create(data);
    console.log(`  OK    ${data.phoneNumber}  ${data.gender === 'male' ? '♂' : '♀'}  ${data.name}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}  |  Skipped: ${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
