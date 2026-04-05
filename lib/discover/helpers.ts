import { IUser } from '@/lib/db/models/User';
import { getPhotosForViewer, shouldBlurPhotosForViewer } from '@/lib/privacy/photos';

// ─── Chat serializers ─────────────────────────────────────────────────────────

export function serializeMessage(msg: any) {
    return {
        id:             msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        senderId:       msg.senderId.toString(),
        receiverId:     msg.receiverId.toString(),
        content:        msg.content,
        contentType:    msg.contentType,
        sentAt:         msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString(),
        readAt:         msg.readAt ? new Date(msg.readAt).toISOString() : undefined,
        isDelivered:    true,
        isRead:         msg.isRead,
    };
}

export function serializeConversation(
  match: any,
  participant: any,
  lastMessage: any | null,
  unreadCount: number,
  viewerUserId?: string,
) {
  const age = computeAge(participant.dateOfBirth);
  const isOwner = viewerUserId
    ? participant._id.toString() === viewerUserId
    : false;
  const participantPhotos = getPhotosForViewer({
    photos: participant.photos,
    targetGender: participant.gender,
    blurEnabled: participant.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: participant.unblurredFor?.map((id: any) => id.toString()),
  });
  const shouldBlurPhotos = shouldBlurPhotosForViewer({
    targetGender: participant.gender,
    blurEnabled: participant.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: participant.unblurredFor?.map((id: any) => id.toString()),
  });

  return {
    id: match._id.toString(),
    matchId: match._id.toString(),
    participantId: participant._id.toString(),
    participantName: participant.name || "",
    participantPhoto: participantPhotos[0] ?? "",
    shouldBlurPhotos,
    participantAge: age ?? 0,
    isVerified: !!(participant.isPhoneVerified || participant.isEmailVerified),
    isPremium: !!(
      participant.subscription?.plan !== "free" &&
      participant.subscription?.isActive
    ),
    isOnline: participant.lastActive
      ? Date.now() - new Date(participant.lastActive).getTime() < 60 * 1000
      : false,
    lastActive: participant.lastActive
      ? new Date(participant.lastActive).toISOString()
      : undefined,
    lastMessage: lastMessage ? serializeMessage(lastMessage) : undefined,
    unreadCount,
    createdAt: match.createdAt
      ? new Date(match.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: match.updatedAt
      ? new Date(match.updatedAt).toISOString()
      : new Date().toISOString(),
    isTyping: false,
  };
}

/**
 * Compute age in years from a date of birth.
 */
export function computeAge(dob: Date | undefined): number | null {
  if (!dob) return null;
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

/**
 * Compute a weighted compatibility score (0-100) between two users.
 *
 * Factors and weights:
 *   - Shared interests        (max 25 pts) — 5 pts per shared interest, cap 25
 *   - Religious practice match (max 20 pts) — exact match 20, adjacent 10
 *   - Shared ethnicity         (max 10 pts) — any overlap
 *   - Same nationality         (max 10 pts) — any overlap
 *   - Education proximity       (max 10 pts) — same level 10, adjacent 5
 *   - Marital status match      (max 10 pts) — exact match
 *   - Age proximity             (max 10 pts) — closer ages score higher
 *   - Recently active           (max  5 pts) — active in last 24h
 */

interface UserForScoring {
  interests?: string[];
  religiousPractice?: string;
  ethnicity?: string[];
  nationality?: string[];
  education?: string;
  maritalStatus?: string;
  dateOfBirth?: Date | string;
  lastActive?: Date | string;
  personality?: string[];
  faithTags?: string[];
}

const RELIGIOSITY_LEVELS = ['veryPracticing', 'practicing', 'moderate', 'nonPracticing'];
const EDUCATION_LEVELS = ['highSchool', 'trade', 'bachelors', 'masters', 'doctorate'];

function arrayOverlap(a?: string[], b?: string[]): number {
  if (!a?.length || !b?.length) return 0;
  return a.filter((v) => b.includes(v)).length;
}

function levelDistance(levels: string[], a?: string, b?: string): number {
  if (!a || !b) return -1;
  const iA = levels.indexOf(a);
  const iB = levels.indexOf(b);
  if (iA === -1 || iB === -1) return -1;
  return Math.abs(iA - iB);
}

export function computeMatchScore(me: UserForScoring, them: UserForScoring): number {
  let score = 0;

  // Shared interests (max 25)
  const sharedInterests = arrayOverlap(me.interests, them.interests);
  score += Math.min(25, sharedInterests * 5);

  // Religious practice (max 20)
  const relDist = levelDistance(RELIGIOSITY_LEVELS, me.religiousPractice, them.religiousPractice);
  if (relDist === 0) score += 20;
  else if (relDist === 1) score += 10;
  else if (relDist === 2) score += 4;

  // Shared ethnicity (max 10)
  if (arrayOverlap(me.ethnicity, them.ethnicity) > 0) score += 10;

  // Same nationality (max 10)
  if (arrayOverlap(me.nationality, them.nationality) > 0) score += 10;

  // Education proximity (max 10)
  const eduDist = levelDistance(EDUCATION_LEVELS, me.education, them.education);
  if (eduDist === 0) score += 10;
  else if (eduDist === 1) score += 5;
  else if (eduDist === 2) score += 2;

  // Marital status match (max 10)
  if (me.maritalStatus && me.maritalStatus === them.maritalStatus) score += 10;

  // Age proximity (max 10) — closer ages score higher
  if (me.dateOfBirth && them.dateOfBirth) {
    const myAge = computeAge(me.dateOfBirth instanceof Date ? me.dateOfBirth : new Date(me.dateOfBirth));
    const theirAge = computeAge(them.dateOfBirth instanceof Date ? them.dateOfBirth : new Date(them.dateOfBirth));
    if (myAge && theirAge) {
      const ageDiff = Math.abs(myAge - theirAge);
      if (ageDiff <= 2) score += 10;
      else if (ageDiff <= 5) score += 7;
      else if (ageDiff <= 10) score += 3;
    }
  }

  // Recently active bonus (max 5)
  if (them.lastActive) {
    const lastActive = them.lastActive instanceof Date ? them.lastActive : new Date(them.lastActive);
    const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursSinceActive < 24) score += 5;
    else if (hoursSinceActive < 72) score += 2;
  }

  // Shared personality traits bonus (up to 5 extra)
  const sharedPersonality = arrayOverlap(me.personality, them.personality);
  score += Math.min(5, sharedPersonality * 2);

  // Shared faith tags bonus (up to 5 extra)
  const sharedFaith = arrayOverlap(me.faithTags, them.faithTags);
  score += Math.min(5, sharedFaith * 2);

  return Math.min(100, Math.round(score));
}

// Legacy wrapper for backward compatibility
export function computeCompatibility(
  myInterests: string[],
  myReligiousPractice: string | undefined,
  theirInterests: string[],
  theirReligiousPractice: string | undefined,
): number {
  return computeMatchScore(
    { interests: myInterests, religiousPractice: myReligiousPractice },
    { interests: theirInterests, religiousPractice: theirReligiousPractice },
  );
}

/**
 * Build a MongoDB age-range filter from preferences ageRange.
 */
export function buildAgeRangeFilter(
  ageRange: { min: number; max: number } | undefined,
) {
  if (!ageRange) return {};
  const now = new Date();
  return {
    dateOfBirth: {
      $gte: new Date(
        now.getFullYear() - ageRange.max,
        now.getMonth(),
        now.getDate(),
      ),
      $lte: new Date(
        now.getFullYear() - ageRange.min,
        now.getMonth(),
        now.getDate(),
      ),
    },
  };
}

type CountryLookup = { code: string; name: string; aliases: string[] };

const COUNTRY_LOOKUP: CountryLookup[] = [
  { code: "DZ", name: "Algeria", aliases: ["Algerian"] },
  { code: "MA", name: "Morocco", aliases: ["Moroccan"] },
  { code: "FR", name: "France", aliases: ["French"] },
  { code: "TN", name: "Tunisia", aliases: ["Tunisian"] },
  { code: "US", name: "United States", aliases: ["American", "USA"] },
  { code: "AF", name: "Afghanistan", aliases: ["Afghan"] },
  { code: "AL", name: "Albania", aliases: ["Albanian"] },
  { code: "BE", name: "Belgium", aliases: ["Belgian"] },
  { code: "BR", name: "Brazil", aliases: ["Brazilian"] },
  { code: "GB", name: "United Kingdom", aliases: ["British", "UK", "Great Britain"] },
  { code: "CA", name: "Canada", aliases: ["Canadian"] },
  { code: "CN", name: "China", aliases: ["Chinese"] },
  { code: "EG", name: "Egypt", aliases: ["Egyptian"] },
  { code: "DE", name: "Germany", aliases: ["German"] },
  { code: "IN", name: "India", aliases: ["Indian"] },
  { code: "ID", name: "Indonesia", aliases: ["Indonesian"] },
  { code: "IR", name: "Iran", aliases: ["Iranian"] },
  { code: "IQ", name: "Iraq", aliases: ["Iraqi"] },
  { code: "IT", name: "Italy", aliases: ["Italian"] },
  { code: "JO", name: "Jordan", aliases: ["Jordanian"] },
  { code: "KW", name: "Kuwait", aliases: ["Kuwaiti"] },
  { code: "LB", name: "Lebanon", aliases: ["Lebanese"] },
  { code: "LY", name: "Libya", aliases: ["Libyan"] },
  { code: "MY", name: "Malaysia", aliases: ["Malaysian"] },
  { code: "MX", name: "Mexico", aliases: ["Mexican"] },
  { code: "NL", name: "Netherlands", aliases: ["Dutch"] },
  { code: "NG", name: "Nigeria", aliases: ["Nigerian"] },
  { code: "OM", name: "Oman", aliases: ["Omani"] },
  { code: "PK", name: "Pakistan", aliases: ["Pakistani"] },
  { code: "PS", name: "Palestine", aliases: ["Palestinian"] },
  { code: "QA", name: "Qatar", aliases: ["Qatari"] },
  { code: "RU", name: "Russia", aliases: ["Russian"] },
  { code: "SA", name: "Saudi Arabia", aliases: ["Saudi"] },
  { code: "SN", name: "Senegal", aliases: ["Senegalese"] },
  { code: "ES", name: "Spain", aliases: ["Spanish"] },
  { code: "SD", name: "Sudan", aliases: ["Sudanese"] },
  { code: "SE", name: "Sweden", aliases: ["Swedish"] },
  { code: "CH", name: "Switzerland", aliases: ["Swiss"] },
  { code: "SY", name: "Syria", aliases: ["Syrian"] },
  { code: "TR", name: "Turkey", aliases: ["Turkish"] },
  { code: "AE", name: "United Arab Emirates", aliases: ["Emirati", "UAE"] },
  { code: "YE", name: "Yemen", aliases: ["Yemeni"] },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveCountryTokens(input: string): string[] {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return [];

  const matched =
    COUNTRY_LOOKUP.find((c) => c.code.toLowerCase() === normalized) ||
    COUNTRY_LOOKUP.find((c) => c.name.toLowerCase() === normalized) ||
    COUNTRY_LOOKUP.find((c) =>
      c.aliases.some((alias) => alias.toLowerCase() === normalized),
    );

  if (!matched) {
    return [normalized];
  }

  return Array.from(
    new Set([
      matched.code.toLowerCase(),
      matched.name.toLowerCase(),
      ...matched.aliases.map((alias) => alias.toLowerCase()),
    ]),
  );
}

/**
 * Build a MongoDB filter that limits discover results to profiles matching
 * the selected country in either location text or nationality values.
 */
export function buildCountryFilter(countryInput?: string) {
  if (!countryInput?.trim()) {
    return null;
  }

  const tokens = resolveCountryTokens(countryInput);
  if (tokens.length === 0) {
    return null;
  }

  const codeTokens = tokens
    .filter((token) => token.length === 2)
    .map((token) => token.toUpperCase());

  const nameTokens = tokens
    .filter((token) => token.length > 2)
    .map((token) => token.replace(/\b\w/g, (char) => char.toUpperCase()));

  const nationalityIn = Array.from(new Set([...codeTokens, ...nameTokens]));

  if (nationalityIn.length === 0) {
    return null;
  }

  return { nationality: { $in: nationalityIn } };
}

/**
 * Serialize a lean user document into a ProfileCard shape for the mobile app.
 * Includes all fields needed by the discovery screen UI.
 */
export function serializeProfileCard(
  user: any,
  myInterests: string[] = [],
  myReligiousPractice?: string,
  viewerUserId?: string,
) {
  const age = computeAge(user.dateOfBirth);
  const compatibility = computeCompatibility(
    myInterests,
    myReligiousPractice,
    user.interests || [],
    user.religiousPractice,
  );

  const locationParts = (user.location || "")
    .split(",")
    .map((s: string) => s.trim());

  const isOwner = viewerUserId ? user._id.toString() === viewerUserId : false;
  const visiblePhotos = getPhotosForViewer({
    photos: user.photos,
    targetGender: user.gender,
    blurEnabled: user.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: user.unblurredFor?.map((id: any) => id.toString()),
  });
  const shouldBlurPhotos = shouldBlurPhotosForViewer({
    targetGender: user.gender,
    blurEnabled: user.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: user.unblurredFor?.map((id: any) => id.toString()),
  });

  return {
    id: user._id.toString(),
    name: user.name || "",
    firstName: (user.name || "").split(" ")[0],
    age,
    city: locationParts[0] || undefined,
    country: locationParts[1] || undefined,
    profilePhoto: visiblePhotos[0] || "",
    photos: visiblePhotos,
    shouldBlurPhotos,
    bio: user.bio,
    occupation: user.profession,
    religiosity: user.religiousPractice,
    // Extra fields used directly by the swipe card UI
    height: user.height,
    maritalStatus: user.maritalStatus,
    nationality: (user.nationality || [])[0] as string | undefined,
    ethnicity: (user.ethnicity || [])[0] as string | undefined,
    drinking: user.drinking,
    smoking: user.smoking,
    hijab: user.hijab,
    faithTags: user.faithTags || [],
    education: user.education,
    //
    isVerified: !!(user.isPhoneVerified || user.isEmailVerified),
    isPremium: !!(
      user.subscription?.plan !== "free" && user.subscription?.isActive
    ),
    lastActive: user.lastActive
      ? new Date(user.lastActive).toISOString()
      : undefined,
    compatibility,
    interests: user.interests || [],
    isOnline: user.lastActive
      ? Date.now() - new Date(user.lastActive).getTime() < 60 * 1000
      : false,
  };
}

/**
 * Serialize a Swipe document + user into a LikeCard for the likes feed.
 */
export function serializeLikeCard(
  swipe: any,
  user: any,
  isMutual: boolean,
  isFavorited: boolean,
  viewerUserId?: string,
) {
  const age = computeAge(user.dateOfBirth);
  const locationParts = (user.location || "")
    .split(",")
    .map((s: string) => s.trim());
  const isOwner = viewerUserId ? user._id.toString() === viewerUserId : false;
  const visiblePhotos = getPhotosForViewer({
    photos: user.photos,
    targetGender: user.gender,
    blurEnabled: user.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: user.unblurredFor?.map((id: any) => id.toString()),
  });
  const shouldBlurPhotos = shouldBlurPhotosForViewer({
    targetGender: user.gender,
    blurEnabled: user.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: user.unblurredFor?.map((id: any) => id.toString()),
  });

  return {
    id: swipe._id.toString(),
    userId: user._id.toString(),
    name: user.name || "",
    firstName: (user.name || "").split(" ")[0],
    age,
    city: locationParts[0] || undefined,
    profilePhoto: visiblePhotos[0] || "",
    photos: visiblePhotos,
    shouldBlurPhotos,
    occupation: user.profession,
    religiosity: user.religiousPractice,
    isVerified: !!(user.isPhoneVerified || user.isEmailVerified),
    isPremium: !!(
      user.subscription?.plan !== "free" && user.subscription?.isActive
    ),
    isOnline: user.lastActive
      ? Date.now() - new Date(user.lastActive).getTime() < 60 * 1000
      : false,
    lastActive: user.lastActive
      ? new Date(user.lastActive).toISOString()
      : undefined,
    likedAt: swipe.createdAt
      ? new Date(swipe.createdAt).toISOString()
      : new Date().toISOString(),
    nationality: (user.nationality || [])[0] as string | undefined,
    action: "like" as const,
    isFavorited,
    isMutual,
  };
}

/**
 * Serialize a Favorite document + user into a LikeCard for the favorites feed.
 */
export function serializeFavoriteCard(
  favorite: any,
  user: any,
  viewerUserId?: string,
) {
  const age = computeAge(user.dateOfBirth);
  const locationParts = (user.location || "")
    .split(",")
    .map((s: string) => s.trim());
  const isOwner = viewerUserId ? user._id.toString() === viewerUserId : false;
  const visiblePhotos = getPhotosForViewer({
    photos: user.photos,
    targetGender: user.gender,
    blurEnabled: user.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: user.unblurredFor?.map((id: any) => id.toString()),
  });
  const shouldBlurPhotos = shouldBlurPhotosForViewer({
    targetGender: user.gender,
    blurEnabled: user.photoBlurEnabled,
    isOwner,
    viewerId: viewerUserId,
    unblurredFor: user.unblurredFor?.map((id: any) => id.toString()),
  });

  return {
    id: favorite._id.toString(),
    userId: user._id.toString(),
    name: user.name || "",
    firstName: (user.name || "").split(" ")[0],
    age,
    city: locationParts[0] || undefined,
    profilePhoto: visiblePhotos[0] || "",
    photos: visiblePhotos,
    shouldBlurPhotos,
    occupation: user.profession,
    religiosity: user.religiousPractice,
    isVerified: !!(user.isPhoneVerified || user.isEmailVerified),
    isPremium: !!(
      user.subscription?.plan !== "free" && user.subscription?.isActive
    ),
    isOnline: user.lastActive
      ? Date.now() - new Date(user.lastActive).getTime() < 60 * 1000
      : false,
    lastActive: user.lastActive
      ? new Date(user.lastActive).toISOString()
      : undefined,
    likedAt: favorite.createdAt
      ? new Date(favorite.createdAt).toISOString()
      : new Date().toISOString(),
    action: "like" as const,
    isFavorited: true,
    isMutual: false,
  };
}

/**
 * Serialize a Match document with the matched user's profile details.
 */
export function serializeMatch(
  match: any,
  currentUserId: string,
  otherUser: any,
) {
  const age = computeAge(otherUser.dateOfBirth);
  const locationParts = (otherUser.location || "")
    .split(",")
    .map((s: string) => s.trim());
  const visiblePhotos = getPhotosForViewer({
    photos: otherUser.photos,
    targetGender: otherUser.gender,
    blurEnabled: otherUser.photoBlurEnabled,
    isOwner: otherUser._id.toString() === currentUserId,
    viewerId: currentUserId,
    unblurredFor: otherUser.unblurredFor?.map((id: any) => id.toString()),
  });
  const shouldBlurPhotos = shouldBlurPhotosForViewer({
    targetGender: otherUser.gender,
    blurEnabled: otherUser.photoBlurEnabled,
    isOwner: otherUser._id.toString() === currentUserId,
    viewerId: currentUserId,
    unblurredFor: otherUser.unblurredFor?.map((id: any) => id.toString()),
  });

  return {
    id: match._id.toString(),
    matchedUserId: otherUser._id.toString(),
    matchedUserName: otherUser.name,
    matchedUserPhoto: visiblePhotos[0] || "",
    shouldBlurPhotos,
    matchedUserAge: age,
    matchedUserCity: locationParts[0] || undefined,
    isVerified: !!(otherUser.isPhoneVerified || otherUser.isEmailVerified),
    isPremium: !!(
      otherUser.subscription?.plan !== "free" &&
      otherUser.subscription?.isActive
    ),
    matchedAt: match.createdAt?.toISOString(),
    lastMessage: match.lastMessage,
    lastMessageAt: match.lastMessageAt?.toISOString(),
    isRead: true,
    hasNewMessage: false,
    isOnline: otherUser.lastActive
      ? Date.now() - new Date(otherUser.lastActive).getTime() < 60 * 1000
      : false,
    lastActive: otherUser.lastActive
      ? new Date(otherUser.lastActive).toISOString()
      : undefined,
    similarities: match.similarities || [],
    compatibility: match.compatibility,
  };
}
