/**
 * Seed script — creates realistic test users for discovery & matching.
 *
 * Usage:
 *   node scripts/seed-test-users.js
 *
 * Creates:
 *   • 8 male  users → phones: +213555000001 … +213555000008
 *   • 15 female users → phones: +213555000020 … +213555000034
 *
 * Log in as Karim (+213555000001) — he is the "tester" male account.
 * Several females have already pre-liked him for instant matches.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// ─── Load env ─────────────────────────────────────────────────────────────────
const envLocal = path.join(__dirname, '..', '.env.local');
const envFile  = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: fs.existsSync(envLocal) ? envLocal : envFile });

const MONGODB_URI = process.env.MONGODB_URI || '';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
    {
        phoneNumber:      { type: String, sparse: true, unique: true },
        name:             { type: String, required: true },
        dateOfBirth:      Date,
        gender:           { type: String, enum: ['male', 'female'] },
        bio:              String,
        profession:       String,
        location:         String,
        height:           Number,
        isPhoneVerified:  { type: Boolean, default: false },
        isEmailVerified:  { type: Boolean, default: false },
        nationality:      [String],
        ethnicity:        [String],
        maritalStatus:    String,
        education:        String,
        religiousPractice:String,
        faithTags:        [String],
        drinking:         String,
        smoking:          String,
        hijab:            String,
        interests:        [String],
        personality:      [String],
        photos:           [String],
        preferences: {
            ageRange:          { min: Number, max: Number },
            religiousPractice: [String],
        },
        subscription: {
            plan:     { type: String, default: 'free' },
            isActive: { type: Boolean, default: false },
        },
        role:        { type: String, default: 'user' },
        status:      { type: String, default: 'active' },
        isOnboarded: { type: Boolean, default: false },
        lastActive:  Date,
        provider:    { type: String, default: 'phone' },
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

const matchSchema = new mongoose.Schema(
    {
        user1:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        user2:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        matchType:      { type: String, enum: ['like', 'superlike'], default: 'like' },
        isActive:       { type: Boolean, default: true },
        lastMessage:    String,
        lastMessageAt:  Date,
        similarities:   [String],
        compatibility:  Number,
    },
    { timestamps: true }
);
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

const favoriteSchema = new mongoose.Schema(
    {
        fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);
favoriteSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

const messageSchema = new mongoose.Schema(
    {
        conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match',  required: true },
        senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
        receiverId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
        content:        { type: String, required: true },
        contentType:    { type: String, enum: ['text', 'emoji', 'image'], default: 'text' },
        isRead:         { type: Boolean, default: false },
        readAt:         Date,
        isDeleted:      { type: Boolean, default: false },
    },
    { timestamps: true }
);
messageSchema.index({ conversationId: 1, createdAt: -1 });

const User     = mongoose.models.User     || mongoose.model('User',     userSchema);
const Swipe    = mongoose.models.Swipe    || mongoose.model('Swipe',    swipeSchema);
const Match    = mongoose.models.Match    || mongoose.model('Match',    matchSchema);
const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
const Message  = mongoose.models.Message  || mongoose.model('Message',  messageSchema);

// ─── Male users ───────────────────────────────────────────────────────────────
const MALE_USERS = [
  {
    phoneNumber: "+213555000001",
    name: "Karim Benali",
    dateOfBirth: new Date("1994-03-15"),
    gender: "male",
    bio: "Engineer based in Paris. Family-oriented, love outdoor adventures and good food. Looking for a serious, halal relationship.",
    profession: "Software Engineer",
    location: "Paris, France",
    height: 178,
    nationality: ["Algerian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Bachelor's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Halal"],
    drinking: "No",
    smoking: "No",
    interests: ["Travel", "Cooking", "Football", "Reading"],
    personality: ["INTJ"],
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
      "https://images.unsplash.com/photo-1542178243-bc20204b769f?w=800",
    ],
    preferences: {
      ageRange: { min: 20, max: 32 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
  {
    phoneNumber: "+213555000002",
    name: "Youssef Tabbane",
    dateOfBirth: new Date("1992-07-20"),
    gender: "male",
    bio: "Architect living in Lyon. I design homes and dream of building one with the right person.",
    profession: "Architect",
    location: "Lyon, France",
    height: 182,
    nationality: ["Tunisian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni", "Halal"],
    drinking: "No",
    smoking: "No",
    interests: ["Architecture", "Photography", "Hiking", "Chess"],
    personality: ["ENFJ"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
    ],
    preferences: {
      ageRange: { min: 22, max: 35 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
  {
    phoneNumber: "+213555000003",
    name: "Omar Cherif",
    dateOfBirth: new Date("1996-11-05"),
    gender: "male",
    bio: "Doctor in Marseille. Love the sea, good conversations, and Sunday hikes.",
    profession: "Doctor",
    location: "Marseille, France",
    height: 180,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Doctorate",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Halal"],
    drinking: "No",
    smoking: "No",
    interests: ["Medicine", "Hiking", "Swimming", "Cooking"],
    personality: ["INFJ"],
    photos: [
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800",
      "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=800",
    ],
    preferences: {
      ageRange: { min: 23, max: 30 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
  {
    phoneNumber: "+213555000004",
    name: "Adam Mansouri",
    dateOfBirth: new Date("1990-04-12"),
    gender: "male",
    bio: "Entrepreneur and father of one, based in Brussels. Faith, family and ambition drive me.",
    profession: "Entrepreneur",
    location: "Brussels, Belgium",
    height: 176,
    nationality: ["Algerian"],
    ethnicity: ["Berber"],
    maritalStatus: "Divorced",
    education: "Master's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer"],
    drinking: "No",
    smoking: "No",
    interests: ["Business", "Football", "Cooking", "Travel"],
    personality: ["ESTJ"],
    photos: [
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800",
    ],
    preferences: {
      ageRange: { min: 24, max: 36 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
  {
    phoneNumber: "+213555000005",
    name: "Bilal Hadj",
    dateOfBirth: new Date("1998-09-28"),
    gender: "male",
    bio: "Finance student in London. Humble, ambitious, and ready to build something real.",
    profession: "Finance Student",
    location: "London, UK",
    height: 183,
    nationality: ["Algerian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni", "Halal"],
    drinking: "No",
    smoking: "No",
    interests: ["Finance", "Football", "Reading", "Travel"],
    personality: ["ENTP"],
    photos: [
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800",
    ],
    preferences: {
      ageRange: { min: 20, max: 28 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
  {
    phoneNumber: "+213555000006",
    name: "Amine Rahmani",
    dateOfBirth: new Date("1993-02-14"),
    gender: "male",
    bio: "Secondary school teacher in Bordeaux. Patient, caring, and passionate about education.",
    profession: "Teacher",
    location: "Bordeaux, France",
    height: 175,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Halal"],
    drinking: "No",
    smoking: "No",
    interests: ["Education", "Football", "Reading", "Nature"],
    personality: ["ISFJ"],
    photos: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800",
    ],
    preferences: {
      ageRange: { min: 22, max: 32 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
  {
    phoneNumber: "+213555000007",
    name: "Hamza Bouzid",
    dateOfBirth: new Date("1995-06-30"),
    gender: "male",
    bio: "IT consultant between Paris and Algiers. Love my roots and look forward to the future.",
    profession: "IT Consultant",
    location: "Paris, France",
    height: 179,
    nationality: ["Algerian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer"],
    drinking: "No",
    smoking: "No",
    interests: ["Technology", "Travel", "Photography", "Football"],
    personality: ["ISTP"],
    photos: [
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800",
    ],
    preferences: {
      ageRange: { min: 22, max: 30 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
  {
    phoneNumber: "+213555000008",
    name: "Khalid Ouali",
    dateOfBirth: new Date("1991-12-03"),
    gender: "male",
    bio: "Pharmacist in Toulouse. Quiet and grounded, searching for a life partner with strong values.",
    profession: "Pharmacist",
    location: "Toulouse, France",
    height: 177,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Doctorate",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Halal", "Quran"],
    drinking: "No",
    smoking: "No",
    interests: ["Reading", "Nature", "Cooking", "Volunteering"],
    personality: ["INFP"],
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800",
    ],
    preferences: {
      ageRange: { min: 23, max: 33 },
      religiousPractice: ["Practicing", "Moderate"],
    },
  },
];

// ─── Female users ─────────────────────────────────────────────────────────────
const FEMALE_USERS = [
  {
    phoneNumber: "+213555000020",
    name: "Fatima Zahra",
    dateOfBirth: new Date("1998-06-22"),
    gender: "female",
    bio: "Dentist from Casablanca, now in Paris. Looking for a serious relationship built on deen.",
    profession: "Dentist",
    location: "Paris, France",
    height: 165,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Hijab"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Travel", "Cooking", "Reading", "Photography"],
    photos: [
      "https://images.pexels.com/photos/9218642/pexels-photo-9218642.jpeg?w=800",
      "https://images.pexels.com/photos/9219302/pexels-photo-9219302.jpeg?w=800",
    ],
  },
  {
    phoneNumber: "+213555000021",
    name: "Amira Khelil",
    dateOfBirth: new Date("2000-01-10"),
    gender: "female",
    bio: "Software engineer & cat lover. Traveling as much as possible between code sprints.",
    profession: "Software Engineer",
    location: "Lyon, France",
    height: 160,
    nationality: ["Tunisian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Bachelor's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni"],
    drinking: "No",
    smoking: "No",
    hijab: "No",
    interests: ["Photography", "Art", "Cats", "Travel"],
    photos: [
      "https://images.pexels.com/photos/19298248/pexels-photo-19298248.jpeg?w=800",
      "https://images.pexels.com/photos/19298224/pexels-photo-19298224.jpeg?w=800",
    ],
  },
  {
    phoneNumber: "+213555000022",
    name: "Nour El-Amine",
    dateOfBirth: new Date("1996-11-30"),
    gender: "female",
    bio: "Architect. I build spaces and relationships with intention. Looking for someone serious.",
    profession: "Architect",
    location: "Marseille, France",
    height: 170,
    nationality: ["Algerian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Design", "Nature", "Volunteering", "Reading"],
    photos: [
      "https://images.pexels.com/photos/2698444/pexels-photo-2698444.jpeg?w=800",
    ],
  },
  {
    phoneNumber: "+213555000023",
    name: "Yasmine Bensalah",
    dateOfBirth: new Date("2001-07-04"),
    gender: "female",
    bio: "Medical student. Deen first, always. Serious about my future.",
    profession: "Medical Student",
    location: "Paris, France",
    height: 162,
    nationality: ["Egyptian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Doctorate",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Hijab", "Quran"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Medicine", "Reading Quran", "Running", "Cooking"],
    photos: [
      "https://images.pexels.com/photos/8525704/pexels-photo-8525704.jpeg?w=800",
    ],
  },
  {
    phoneNumber: "+213555000024",
    name: "Hana Idrissi",
    dateOfBirth: new Date("1997-09-18"),
    gender: "female",
    bio: "Marketing manager with a passion for languages and travel. Divorced and ready for a new chapter.",
    profession: "Marketing Manager",
    location: "Paris, France",
    height: 167,
    nationality: ["Moroccan"],
    ethnicity: ["Amazigh"],
    maritalStatus: "Divorced",
    education: "Master's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni"],
    drinking: "No",
    smoking: "No",
    hijab: "No",
    interests: ["Languages", "Travel", "Marketing", "Yoga"],
    photos: [
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800",
    ],
  },
  {
    phoneNumber: "+213555000025",
    name: "Salma Bouazza",
    dateOfBirth: new Date("1999-03-25"),
    gender: "female",
    bio: "Journalist in Brussels. I ask a lot of questions — prepare yourself.",
    profession: "Journalist",
    location: "Brussels, Belgium",
    height: 163,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni", "Halal"],
    drinking: "No",
    smoking: "No",
    hijab: "No",
    interests: ["Writing", "Politics", "Travel", "Film"],
    photos: [
      "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800",
    ],
  },
  {
    phoneNumber: "+213555000026",
    name: "Rim Chaabane",
    dateOfBirth: new Date("1995-12-08"),
    gender: "female",
    bio: "Pharmacist in Toulouse. Calm, dedicated, and looking for someone with strong values.",
    profession: "Pharmacist",
    location: "Toulouse, France",
    height: 168,
    nationality: ["Tunisian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Doctorate",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Halal"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Medicine", "Reading", "Cooking", "Nature"],
    photos: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800",
    ],
  },
  {
    phoneNumber: "+213555000027",
    name: "Dounia Saidi",
    dateOfBirth: new Date("2002-05-17"),
    gender: "female",
    bio: "Law student in Paris. Passionate about justice, family, and good food.",
    profession: "Law Student",
    location: "Paris, France",
    height: 164,
    nationality: ["Algerian"],
    ethnicity: ["Berber"],
    maritalStatus: "Single",
    education: "Bachelor's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Law", "Reading", "Cooking", "Music"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
    ],
  },
  {
    phoneNumber: "+213555000028",
    name: "Meriem Lagha",
    dateOfBirth: new Date("1993-08-14"),
    gender: "female",
    bio: "Teacher and mother of one. Open to marriage and building a calm, loving home.",
    profession: "Teacher",
    location: "Bordeaux, France",
    height: 161,
    nationality: ["Algerian"],
    ethnicity: ["Arab"],
    maritalStatus: "Divorced",
    education: "Bachelor's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Hijab"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Education", "Cooking", "Reading", "Volunteering"],
    photos: [
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800",
    ],
  },
  {
    phoneNumber: "+213555000029",
    name: "Ines Ferhat",
    dateOfBirth: new Date("1998-10-01"),
    gender: "female",
    bio: "UX designer in London. Creative, thoughtful, and looking for a genuine partner.",
    profession: "UX Designer",
    location: "London, UK",
    height: 169,
    nationality: ["Algerian"],
    ethnicity: ["Berber"],
    maritalStatus: "Single",
    education: "Bachelor's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni"],
    drinking: "No",
    smoking: "No",
    hijab: "No",
    interests: ["Design", "Art", "Photography", "Travel"],
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
    ],
  },
  {
    phoneNumber: "+213555000030",
    name: "Chaima Bousaid",
    dateOfBirth: new Date("1997-02-19"),
    gender: "female",
    bio: "Nurse in Strasbourg. Caring by nature, serious about marriage.",
    profession: "Nurse",
    location: "Strasbourg, France",
    height: 166,
    nationality: ["Tunisian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Bachelor's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Hijab"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Medicine", "Cooking", "Travel", "Volunteering"],
    photos: ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800"],
  },
  {
    phoneNumber: "+213555000031",
    name: "Lina Benmoussa",
    dateOfBirth: new Date("2000-08-11"),
    gender: "female",
    bio: "Business student in Amsterdam. Ambitious, fun, and grounded in my faith.",
    profession: "Business Student",
    location: "Amsterdam, Netherlands",
    height: 172,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Bachelor's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni", "Halal"],
    drinking: "No",
    smoking: "No",
    hijab: "No",
    interests: ["Business", "Travel", "Sports", "Languages"],
    photos: [
      "https://images.unsplash.com/photo-1502767089025-6572583495b9?w=800",
    ],
  },
  {
    phoneNumber: "+213555000032",
    name: "Sana Meziane",
    dateOfBirth: new Date("1994-04-27"),
    gender: "female",
    bio: "Veterinarian in Nice. Animal lover, nature addict, ready to settle down.",
    profession: "Veterinarian",
    location: "Nice, France",
    height: 164,
    nationality: ["Algerian"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Doctorate",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Animals", "Nature", "Hiking", "Reading"],
    photos: [
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800",
    ],
  },
  {
    phoneNumber: "+213555000033",
    name: "Rania Oueld",
    dateOfBirth: new Date("1996-07-15"),
    gender: "female",
    bio: "Data analyst in Paris. Behind the numbers, there is a warm person who loves coffee and sunsets.",
    profession: "Data Analyst",
    location: "Paris, France",
    height: 167,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Single",
    education: "Master's Degree",
    religiousPractice: "Moderate",
    faithTags: ["Sunni", "Halal"],
    drinking: "No",
    smoking: "No",
    hijab: "No",
    interests: ["Data", "Coffee", "Travel", "Cooking", "Football"],
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
    ],
  },
  {
    phoneNumber: "+213555000034",
    name: "Khadija El-Fassi",
    dateOfBirth: new Date("1991-01-20"),
    gender: "female",
    bio: "Accountant and mother of two in Casablanca. Open, mature, and looking for a serious partner.",
    profession: "Accountant",
    location: "Casablanca, Morocco",
    height: 160,
    nationality: ["Moroccan"],
    ethnicity: ["Arab"],
    maritalStatus: "Divorced",
    education: "Bachelor's Degree",
    religiousPractice: "Practicing",
    faithTags: ["Sunni", "Prayer", "Hijab", "Quran"],
    drinking: "No",
    smoking: "No",
    hijab: "Yes",
    interests: ["Cooking", "Reading Quran", "Family", "Volunteering"],
    photos: [
      "https://images.unsplash.com/photo-1521252659862-eec69941b071?w=800",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ago(hours) {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
}
function daysAgo(days) {
    return ago(days * 24);
}

// Assign each female a "lastActive" offset (hours)
const LAST_ACTIVE_OFFSETS = [
    0.08, 0.5, 1, 2, 3, 5, 8, 12, 18, 24, 36, 48, 72, 96, 120,
];

// ─── Test-interaction tables ───────────────────────────────────────────────────
//
// GOAL: every filter tab in the Likes screen has visible data
//
//   ❤️  Tout         → all 15 females liked Karim
//   ⚡  Nouveaux     → 6 females liked him within the last 48 h
//   🤝  Mutuels      → 3 females he also liked back (= Matches created)
//   👑  Premium      → 3 females have an active premium subscription
//   ⭐  Coup de cœur → 2 females Karim manually favorited
//   📤  Envoyés      → 5 females Karim liked (sent swipes)
//

// All 15 females like Karim — with varying createdAt for the "new" filter
// Format: [ phone, hoursAgo, action ]
const FEMALES_LIKE_KARIM = [
    ['+213555000020', 0.2,   'like'],       // Fatima   — 12 min ago   ✅ new
    ['+213555000021', 1,     'like'],       // Amira    — 1 h ago      ✅ new
    ['+213555000022', 5,     'like'],       // Nour     — 5 h ago      ✅ new
    ['+213555000023', 10,    'superlike'],  // Yasmine  — 10 h ago     ✅ new (superlike!)
    ['+213555000024', 20,    'like'],       // Hana     — 20 h ago     ✅ new
    ['+213555000025', 30,    'like'],       // Salma    — 30 h ago     ✅ new
    ['+213555000026', 72,    'like'],       // Rim      — 3 days ago
    ['+213555000027', 96,    'like'],       // Dounia   — 4 days ago
    ['+213555000028', 120,   'like'],       // Meriem   — 5 days ago
    ['+213555000029', 144,   'like'],       // Ines     — 6 days ago
    ['+213555000030', 168,   'superlike'],  // Chaima   — 7 days ago   (superlike)
    ['+213555000031', 192,   'like'],       // Lina     — 8 days ago
    ['+213555000032', 216,   'like'],       // Sana     — 9 days ago
    ['+213555000033', 240,   'like'],       // Rania    — 10 days ago
    ['+213555000034', 264,   'like'],       // Khadija  — 11 days ago
];

// Karim liked these 5 females back (shows in "Envoyés")
// The first 3 also liked him → will trigger Match creation
const KARIM_LIKES_FEMALES = [
    ['+213555000020', 'like'],       // Fatima   ← mutual → Match
    ['+213555000021', 'like'],       // Amira    ← mutual → Match
    ['+213555000022', 'superlike'],  // Nour     ← mutual → Match (superlike)
    ['+213555000024', 'like'],       // Hana     → one-sided (no match yet)
    ['+213555000029', 'like'],       // Ines     → one-sided (no match yet)
];

// These females have an active premium subscription (shows in "Premium" filter)
const PREMIUM_FEMALE_PHONES = [
    '+213555000023',  // Yasmine
    '+213555000026',  // Rim
    '+213555000032',  // Sana
];

// Karim favorited these 2 females (shows in "Coup de cœur")
const KARIM_FAVORITES = [
    '+213555000032',  // Sana
    '+213555000031',  // Lina
];

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
    if (!MONGODB_URI) {
        console.error('❌  MONGODB_URI is not set in .env / .env.local');
        process.exit(1);
    }

    console.log('🔌  Connecting to MongoDB…');
    await mongoose.connect(MONGODB_URI);
    console.log('✅  Connected\n');

    const base = {
        isPhoneVerified: true,
        role: 'user',
        status: 'active',
        isOnboarded: true,
        provider: 'phone',
        subscription: { plan: 'free', isActive: false },
    };

    // ── Male users ─────────────────────────────────────────────────────────
    console.log('👨  Seeding male users…');
    const maleMap = {};
    for (let i = 0; i < MALE_USERS.length; i++) {
        const data = { ...base, lastActive: ago(i * 3), ...MALE_USERS[i] };
        let u = await User.findOneAndUpdate(
            { phoneNumber: data.phoneNumber },
            { $setOnInsert: data },
            { upsert: true, new: true }
        );
        console.log(`   ✅  ${data.name} (${data.phoneNumber})`);
        maleMap[data.phoneNumber] = u._id;
    }

    // ── Female users ───────────────────────────────────────────────────────
    console.log('\n👩  Seeding female users…');
    const femaleMap = {};
    for (let i = 0; i < FEMALE_USERS.length; i++) {
        const data = { ...base, lastActive: ago(LAST_ACTIVE_OFFSETS[i] || i * 4), ...FEMALE_USERS[i] };
        let u = await User.findOneAndUpdate(
            { phoneNumber: data.phoneNumber },
            { $setOnInsert: data },
            { upsert: true, new: true }
        );
        console.log(`   ✅  ${data.name} (${data.phoneNumber})`);
        femaleMap[data.phoneNumber] = u._id;
    }

    // ── Grant premium to 3 females ──────────────────────────────────────────
    console.log('\n👑  Granting premium subscriptions…');
    for (const phone of PREMIUM_FEMALE_PHONES) {
        const name = FEMALE_USERS.find(f => f.phoneNumber === phone)?.name ?? phone;
        await User.updateOne(
            { phoneNumber: phone },
            { $set: { subscription: { plan: 'gold', isActive: true, startDate: daysAgo(30), endDate: daysAgo(-365) } } }
        );
        console.log(`   ✅  ${name} → gold subscription`);
    }

    const karimId = maleMap['+213555000001'];

    // ── All 15 females like Karim (with backdated createdAt) ───────────────
    console.log('\n💖  Seeding received likes for Karim…');
    for (const [phone, hours, action] of FEMALES_LIKE_KARIM) {
        const fromId = femaleMap[phone];
        if (!fromId) continue;
        const name = FEMALE_USERS.find(f => f.phoneNumber === phone)?.name ?? phone;
        const createdAt = ago(hours);
        const existing = await Swipe.findOne({ fromUser: fromId, toUser: karimId });
        if (existing) {
            // Update the timestamp so "new" filter reflects fresh data on re-seed
            await Swipe.updateOne({ _id: existing._id }, { $set: { action, createdAt, updatedAt: createdAt } });
            console.log(`   ↺   ${name} → updated (${action}, ${hours}h ago)`);
        } else {
            await Swipe.collection.insertOne({
                fromUser: fromId, toUser: karimId, action,
                createdAt, updatedAt: createdAt,
            });
            console.log(`   ✅  ${name} → Karim  (${action}, ${hours}h ago)`);
        }
    }

    // ── Karim likes 5 females (sent swipes) ───────────────────────────────
    console.log('\n📤  Seeding sent likes from Karim…');
    for (const [phone, action] of KARIM_LIKES_FEMALES) {
        const toId = femaleMap[phone];
        if (!toId) continue;
        const name = FEMALE_USERS.find(f => f.phoneNumber === phone)?.name ?? phone;
        await Swipe.findOneAndUpdate(
            { fromUser: karimId, toUser: toId },
            { action },
            { upsert: true }
        );
        console.log(`   ✅  Karim → ${name}  (${action})`);
    }

    // ── Create Matches where both parties liked each other ─────────────────
    console.log('\n🤝  Seeding mutual matches…');
    const mutualPairs = KARIM_LIKES_FEMALES.slice(0, 3); // first 3 are mutual
    for (const [phone, action] of mutualPairs) {
        const otherId = femaleMap[phone];
        if (!otherId) continue;
        const name = FEMALE_USERS.find(f => f.phoneNumber === phone)?.name ?? phone;
        const [u1, u2] = [karimId.toString(), otherId.toString()].sort();
        await Match.findOneAndUpdate(
            { user1: u1, user2: u2 },
            {
                $setOnInsert: {
                    user1: u1, user2: u2,
                    matchType: action, isActive: true,
                    similarities: ['Travel', 'Cooking'],
                    compatibility: 75,
                },
            },
            { upsert: true }
        );
        console.log(`   ✅  Karim ↔ ${name}  (matched!)`);
    }

    // ── Karim favorites 2 females ──────────────────────────────────────────
    console.log('\n⭐  Seeding favorites…');
    for (const phone of KARIM_FAVORITES) {
        const toId = femaleMap[phone];
        if (!toId) continue;
        const name = FEMALE_USERS.find(f => f.phoneNumber === phone)?.name ?? phone;
        await Favorite.findOneAndUpdate(
            { fromUser: karimId, toUser: toId },
            { $setOnInsert: { fromUser: karimId, toUser: toId } },
            { upsert: true }
        );
        console.log(`   ✅  Karim ⭐ ${name}`);
    }

    // ── Seed chat messages for the 3 mutual matches ────────────────────────
    console.log('\n💬  Seeding chat messages…');
    const mutualPhones = KARIM_LIKES_FEMALES.slice(0, 3).map(([phone]) => phone);
    const mutualNames  = ['Fatima', 'Amira', 'Nour']; // display names for logs

    // Pre-written conversations per match (sender: 'karim' | 'other')
    const CONVERSATIONS = [
        // Fatima — active conversation, last message from her (unread for Karim)
        [
            { sender: 'other', content: 'Assalamu alaykum ! Comment vas-tu ?', minsAgo: 120 },
            { sender: 'karim', content: 'Wa alaykum assalam ! Hamdoulillah, et toi ?', minsAgo: 118 },
            { sender: 'other', content: 'Bien hamdoulillah. Tu es de quelle ville exactement ?', minsAgo: 115 },
            { sender: 'karim', content: "Je suis à Paris, dans le 15ème. Et toi ?", minsAgo: 112 },
            { sender: 'other', content: 'Lyon pour moi ! J\'aime bien Paris masha\'Allah 🌹', minsAgo: 10, isRead: false },
        ],
        // Amira — short exchange, both read
        [
            { sender: 'karim', content: 'Assalamu alaykum Amira 😊', minsAgo: 2880 }, // 2 days ago
            { sender: 'other', content: 'Wa alaykum assalam ! Ravi de faire ta connaissance.', minsAgo: 2870 },
            { sender: 'karim', content: 'Moi aussi ! Tu travailles dans quel domaine ?', minsAgo: 2865 },
            { sender: 'other', content: 'Je suis médecin, et toi ?', minsAgo: 2860 },
            { sender: 'karim', content: 'Ingénieur logiciel chez une startup. Masha\'Allah pour la médecine !', minsAgo: 2855 },
        ],
        // Nour — only a new match greeting, last message unread
        [
            { sender: 'other', content: '❤️', minsAgo: 5, contentType: 'emoji', isRead: false },
        ],
    ];

    for (let i = 0; i < mutualPhones.length; i++) {
        const phone    = mutualPhones[i];
        const otherId  = femaleMap[phone];
        if (!otherId) continue;

        const [u1str, u2str] = [karimId.toString(), otherId.toString()].sort();
        const match = await Match.findOne({ user1: u1str, user2: u2str });
        if (!match) { console.log(`   ⚠️   Match not found for ${mutualNames[i]}, skipping`); continue; }

        // Clear previous seed messages
        await Message.deleteMany({ conversationId: match._id });

        const convMsgs = CONVERSATIONS[i];
        let lastMsg = null;
        for (const m of convMsgs) {
            const senderId   = m.sender === 'karim' ? karimId : otherId;
            const receiverId = m.sender === 'karim' ? otherId : karimId;
            const createdAt  = new Date(Date.now() - m.minsAgo * 60 * 1000);
            const doc = await Message.create({
                conversationId: match._id,
                senderId,
                receiverId,
                content:     m.content,
                contentType: m.contentType || 'text',
                isRead:      m.isRead === false ? false : true,
                readAt:      m.isRead === false ? undefined : createdAt,
                createdAt,
                updatedAt:   createdAt,
            });
            lastMsg = { content: m.content, at: createdAt };
        }

        // Update match preview
        if (lastMsg) {
            await Match.updateOne(
                { _id: match._id },
                { $set: { lastMessage: lastMsg.content.substring(0, 100), lastMessageAt: lastMsg.at } }
            );
        }
        console.log(`   ✅  ${mutualNames[i]} — ${convMsgs.length} messages seeded`);
    }

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('🎉  Seed complete! Here is what every screen will show:\n');
    console.log('  LIKES TAB');
    console.log('   ❤️  Tout         →  15 profiles (all received likes)');
    console.log('   ⚡  Nouveaux     →   6 profiles (liked within last 48 h)');
    console.log('   🤝  Mutuels      →   3 profiles (Fatima, Amira, Nour — matched!)');
    console.log('   👑  Premium      →   3 profiles (Yasmine, Rim, Sana)');
    console.log('   ⭐  Coup de cœur →   2 profiles (Sana, Lina — pre-favorited)');
    console.log('   📤  Envoyés      →   5 profiles (Karim liked them)\n');
    console.log('  CHAT TAB');
    console.log('   💬  Fatima  → 5 messages, last from her (UNREAD badge = 1)');
    console.log('   💬  Amira   → 5 messages, fully read');
    console.log('   💬  Nour    → 1 emoji message (UNREAD badge = 1)\n');
    console.log('📱  Login as Karim:');
    console.log('   POST /api/auth/phone-login  →  { "phoneNumber": "+213555000001" }');
    console.log('   POST /api/auth/verify-otp   →  { "phoneNumber": "+213555000001", "otp": "<dev_otp>" }');
    console.log('──────────────────────────────────────────────────────────────────');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});
