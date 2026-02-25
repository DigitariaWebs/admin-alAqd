/**
 * Seed script — creates realistic test users for discovery & matching.
 *
 * Usage:
 *   node scripts/seed-test-users.js
 *
 * Creates:
 *   • 1 male user   → phone: +213555000001  (the tester — log in as him)
 *   • 5 female users → phones: +213555000002 … +213555000006
 *
 * Bonus: Fatima (+213555000002) already has a Swipe(like) toward the male
 *        user, so liking her back will instantly trigger a match.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// ─── Load env ─────────────────────────────────────────────────────────────────
const envLocal = path.join(__dirname, '..', '.env.local');
const envFile = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: fs.existsSync(envLocal) ? envLocal : envFile });

const MONGODB_URI = process.env.MONGODB_URI || '';

// ─── Minimal schemas (mirrors the production models) ─────────────────────────
const userSchema = new mongoose.Schema(
    {
        phoneNumber: { type: String, sparse: true, unique: true },
        name: { type: String, required: true },
        dateOfBirth: Date,
        gender: { type: String, enum: ['male', 'female'] },
        bio: String,
        profession: String,
        location: String,
        height: Number,
        isPhoneVerified: { type: Boolean, default: false },
        isEmailVerified: { type: Boolean, default: false },
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
        preferences: {
            distance: Number,
            ageRange: { min: Number, max: Number },
            religiousPractice: [String],
        },
        subscription: {
            plan: { type: String, default: 'free' },
            isActive: { type: Boolean, default: false },
        },
        role: { type: String, default: 'user' },
        status: { type: String, default: 'active' },
        isOnboarded: { type: Boolean, default: false },
        lastActive: Date,
        provider: { type: String, default: 'phone' },
    },
    { timestamps: true }
);

const swipeSchema = new mongoose.Schema(
    {
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        action:   { type: String, enum: ['like', 'pass', 'superlike'], required: true },
    },
    { timestamps: true }
);
swipeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

const User  = mongoose.models.User  || mongoose.model('User',  userSchema);
const Swipe = mongoose.models.Swipe || mongoose.model('Swipe', swipeSchema);

// ─── Test data ────────────────────────────────────────────────────────────────
const MALE_USER = {
    phoneNumber: '+213555000001',
    name: 'Karim Benali',
    dateOfBirth: new Date('1994-03-15'),
    gender: 'male',
    bio: 'Engineer based in Paris. Family-oriented, love outdoor adventures and good food.',
    profession: 'Software Engineer',
    location: 'Paris, France',
    height: 178,
    isPhoneVerified: true,
    nationality: ['Algerian'],
    ethnicity: ['Arab'],
    maritalStatus: 'Single',
    education: "Bachelor's Degree",
    religiousPractice: 'Practicing',
    faithTags: ['Sunni', 'Prayer', 'Halal'],
    drinking: 'No',
    smoking: 'No',
    interests: ['Travel', 'Cooking', 'Football', 'Reading'],
    personality: ['INTJ'],
    photos: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
        'https://images.unsplash.com/photo-1542178243-bc20204b769f?w=800',
    ],
    preferences: {
        distance: 100,
        ageRange: { min: 20, max: 32 },
        religiousPractice: ['Practicing', 'Moderate'],
    },
    role: 'user',
    status: 'active',
    isOnboarded: true,
    lastActive: new Date(),
};

const FEMALE_USERS = [
    {
        phoneNumber: '+213555000002',
        name: 'Fatima Zahra',
        dateOfBirth: new Date('1998-06-22'),
        gender: 'female',
        bio: 'Dentist from Casablanca, now in Paris. Looking for a serious relationship built on deen.',
        profession: 'Dentist',
        location: 'Paris, France',
        height: 165,
        isPhoneVerified: true,
        nationality: ['Moroccan'],
        ethnicity: ['Arab'],
        maritalStatus: 'Single',
        education: "Master's Degree",
        religiousPractice: 'Practicing',
        faithTags: ['Sunni', 'Prayer', 'Hijab'],
        drinking: 'No',
        smoking: 'No',
        hijab: 'Yes',
        interests: ['Travel', 'Cooking', 'Reading', 'Photography'],
        photos: [
            'https://images.pexels.com/photos/9218642/pexels-photo-9218642.jpeg?w=800',
            'https://images.pexels.com/photos/9219302/pexels-photo-9219302.jpeg?w=800',
        ],
        role: 'user', status: 'active', isOnboarded: true,
        lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago (online)
    },
    {
        phoneNumber: '+213555000003',
        name: 'Amira Khelil',
        dateOfBirth: new Date('2000-01-10'),
        gender: 'female',
        bio: 'Software engineer & cat lover. Traveling as much as possible between code sprints.',
        profession: 'Software Engineer',
        location: 'Lyon, France',
        height: 160,
        isPhoneVerified: true,
        nationality: ['Tunisian'],
        ethnicity: ['Arab'],
        maritalStatus: 'Single',
        education: "Bachelor's Degree",
        religiousPractice: 'Moderate',
        faithTags: ['Sunni'],
        drinking: 'No',
        smoking: 'No',
        hijab: 'No',
        interests: ['Photography', 'Art', 'Cats', 'Travel'],
        photos: [
            'https://images.pexels.com/photos/19298248/pexels-photo-19298248.jpeg?w=800',
            'https://images.pexels.com/photos/19298224/pexels-photo-19298224.jpeg?w=800',
        ],
        role: 'user', status: 'active', isOnboarded: true,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    },
    {
        phoneNumber: '+213555000004',
        name: 'Nour El-Amine',
        dateOfBirth: new Date('1996-11-30'),
        gender: 'female',
        bio: 'Architect. I build spaces and relationships with intention.',
        profession: 'Architect',
        location: 'Marseille, France',
        height: 170,
        isPhoneVerified: true,
        nationality: ['Algerian'],
        ethnicity: ['Arab'],
        maritalStatus: 'Single',
        education: "Master's Degree",
        religiousPractice: 'Practicing',
        faithTags: ['Sunni', 'Prayer'],
        drinking: 'No',
        smoking: 'No',
        hijab: 'Yes',
        interests: ['Design', 'Nature', 'Volunteering', 'Reading'],
        photos: [
            'https://images.pexels.com/photos/2698444/pexels-photo-2698444.jpeg?w=800',
        ],
        role: 'user', status: 'active', isOnboarded: true,
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    },
    {
        phoneNumber: '+213555000005',
        name: 'Yasmine Bensalah',
        dateOfBirth: new Date('2001-07-04'),
        gender: 'female',
        bio: 'Medical student. Deen first, always.',
        profession: 'Medical Student',
        location: 'Paris, France',
        height: 162,
        isPhoneVerified: true,
        nationality: ['Egyptian'],
        ethnicity: ['Arab'],
        maritalStatus: 'Single',
        education: 'Doctorate',
        religiousPractice: 'Very Practicing',
        faithTags: ['Sunni', 'Prayer', 'Hijab', 'Quran'],
        drinking: 'No',
        smoking: 'No',
        hijab: 'Yes',
        interests: ['Medicine', 'Reading Quran', 'Running', 'Cooking'],
        photos: [
            'https://images.pexels.com/photos/8525704/pexels-photo-8525704.jpeg?w=800',
        ],
        role: 'user', status: 'active', isOnboarded: true,
        lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
        phoneNumber: '+213555000006',
        name: 'Hana Idrissi',
        dateOfBirth: new Date('1997-09-18'),
        gender: 'female',
        bio: 'Marketing manager with a passion for languages and travel.',
        profession: 'Marketing Manager',
        location: 'Paris, France',
        height: 167,
        isPhoneVerified: true,
        nationality: ['Moroccan'],
        ethnicity: ['Amazigh'],
        maritalStatus: 'Divorced',
        education: "Master's Degree",
        religiousPractice: 'Moderate',
        faithTags: ['Sunni'],
        drinking: 'No',
        smoking: 'No',
        hijab: 'No',
        interests: ['Languages', 'Travel', 'Marketing', 'Yoga'],
        photos: [
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
        ],
        role: 'user', status: 'active', isOnboarded: true,
        lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
    if (!MONGODB_URI) {
        console.error('❌  MONGODB_URI is not set');
        process.exit(1);
    }

    console.log('🔌  Connecting to MongoDB…');
    await mongoose.connect(MONGODB_URI);
    console.log('✅  Connected\n');

    // ── Male user ──────────────────────────────────────────────────────────
    let maleUser = await User.findOne({ phoneNumber: MALE_USER.phoneNumber });
    if (maleUser) {
        console.log(`ℹ️   Male user already exists (${MALE_USER.phoneNumber}) — skipping`);
    } else {
        maleUser = await User.create(MALE_USER);
        console.log(`✅  Created male user: ${MALE_USER.name}  (${MALE_USER.phoneNumber})`);
    }

    // ── Female users ───────────────────────────────────────────────────────
    const femaleIds = [];
    for (const data of FEMALE_USERS) {
        let u = await User.findOne({ phoneNumber: data.phoneNumber });
        if (u) {
            console.log(`ℹ️   ${data.name} already exists — skipping`);
        } else {
            u = await User.create(data);
            console.log(`✅  Created female user: ${data.name}  (${data.phoneNumber})`);
        }
        femaleIds.push({ id: u._id, name: data.name, phone: data.phoneNumber });
    }

    // ── Pre-seed Fatima's "like" toward Karim (instant match when Karim likes her) ──
    const fatima = femaleIds.find(f => f.phone === '+213555000003' || f.phone === '+213555000002');
    if (fatima) {
        const existing = await Swipe.findOne({ fromUser: fatima.id, toUser: maleUser._id });
        if (!existing) {
            await Swipe.create({
                fromUser: fatima.id,
                toUser: maleUser._id,
                action: 'like',
            });
            console.log(`💖  Pre-seeded: ${fatima.name} already liked Karim → instant match ready!`);
        } else {
            console.log(`ℹ️   ${fatima.name}'s pre-seed swipe already exists`);
        }
    }

    console.log('\n─────────────────────────────────────────────');
    console.log('🎉  Seed complete!\n');
    console.log('📱  How to log in as Karim (the tester):');
    console.log('    1. Start the backend:  cd admin-alAqd && npm run dev');
    console.log('    2. POST http://localhost:3000/api/auth/phone-login');
    console.log('       body: { "phoneNumber": "+213555000001" }');
    console.log('    3. Copy "dev_otp" from the response (also printed in the terminal)');
    console.log('    4. POST http://localhost:3000/api/auth/verify-otp');
    console.log('       body: { "phoneNumber": "+213555000001", "otp": "<code>" }');
    console.log('    5. Use the returned "token" in the mobile app\n');
    console.log('💡  Tip: The first female in the queue (Fatima / +213555000002) has');
    console.log('         already liked Karim — swiping right on her will create a match.\n');
    console.log('─────────────────────────────────────────────');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});
