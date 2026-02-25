import { IUser } from '@/lib/db/models/User';

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
    unreadCount: number
) {
    const age = computeAge(participant.dateOfBirth);
    return {
        id:               match._id.toString(),
        matchId:          match._id.toString(),
        participantId:    participant._id.toString(),
        participantName:  participant.name || '',
        participantPhoto: (participant.photos ?? [])[0] ?? '',
        participantAge:   age ?? 0,
        isVerified:       !!(participant.isPhoneVerified || participant.isEmailVerified),
        isPremium:        !!(participant.subscription?.plan !== 'free' && participant.subscription?.isActive),
        isOnline:         participant.lastActive
            ? Date.now() - new Date(participant.lastActive).getTime() < 15 * 60 * 1000
            : false,
        lastActive:       participant.lastActive ? new Date(participant.lastActive).toISOString() : undefined,
        lastMessage:      lastMessage ? serializeMessage(lastMessage) : undefined,
        unreadCount,
        createdAt:        match.createdAt ? new Date(match.createdAt).toISOString() : new Date().toISOString(),
        updatedAt:        match.updatedAt ? new Date(match.updatedAt).toISOString() : new Date().toISOString(),
        isTyping:         false,
    };
}

/**
 * Compute age in years from a date of birth.
 */
export function computeAge(dob: Date | undefined): number | null {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Compute a simple compatibility score (0-100) between two users
 * based on shared interests and matching religious practice.
 */
export function computeCompatibility(
    myInterests: string[],
    myReligiousPractice: string | undefined,
    theirInterests: string[],
    theirReligiousPractice: string | undefined
): number {
    const sharedInterests = myInterests.filter((i) => theirInterests.includes(i));
    const religionMatch = myReligiousPractice && myReligiousPractice === theirReligiousPractice ? 15 : 0;
    return Math.min(100, 50 + sharedInterests.length * 10 + religionMatch);
}

/**
 * Build a MongoDB age-range filter from preferences ageRange.
 */
export function buildAgeRangeFilter(ageRange: { min: number; max: number } | undefined) {
    if (!ageRange) return {};
    const now = new Date();
    return {
        dateOfBirth: {
            $gte: new Date(now.getFullYear() - ageRange.max, now.getMonth(), now.getDate()),
            $lte: new Date(now.getFullYear() - ageRange.min, now.getMonth(), now.getDate()),
        },
    };
}

/**
 * Serialize a lean user document into a ProfileCard shape for the mobile app.
 * Includes all fields needed by the discovery screen UI.
 */
export function serializeProfileCard(
    user: any,
    myInterests: string[] = [],
    myReligiousPractice?: string
) {
    const age = computeAge(user.dateOfBirth);
    const compatibility = computeCompatibility(
        myInterests,
        myReligiousPractice,
        user.interests || [],
        user.religiousPractice
    );

    const locationParts = (user.location || '').split(',').map((s: string) => s.trim());

    return {
        id: user._id.toString(),
        name: user.name || '',
        firstName: (user.name || '').split(' ')[0],
        age,
        city: locationParts[0] || undefined,
        country: locationParts[1] || undefined,
        profilePhoto: (user.photos || [])[0] || '',
        photos: user.photos || [],
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
        isPremium: !!(user.subscription?.plan !== 'free' && user.subscription?.isActive),
        lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : undefined,
        compatibility,
        interests: user.interests || [],
        isOnline: user.lastActive
            ? Date.now() - new Date(user.lastActive).getTime() < 15 * 60 * 1000
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
    isFavorited: boolean
) {
    const age = computeAge(user.dateOfBirth);
    const locationParts = (user.location || '').split(',').map((s: string) => s.trim());

    return {
        id: swipe._id.toString(),
        userId: user._id.toString(),
        name: user.name || '',
        firstName: (user.name || '').split(' ')[0],
        age,
        city: locationParts[0] || undefined,
        profilePhoto: (user.photos || [])[0] || '',
        photos: user.photos || [],
        occupation: user.profession,
        religiosity: user.religiousPractice,
        isVerified: !!(user.isPhoneVerified || user.isEmailVerified),
        isPremium: !!(user.subscription?.plan !== 'free' && user.subscription?.isActive),
        isOnline: user.lastActive
            ? Date.now() - new Date(user.lastActive).getTime() < 15 * 60 * 1000
            : false,
        lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : undefined,
        likedAt: swipe.createdAt ? new Date(swipe.createdAt).toISOString() : new Date().toISOString(),
        action: swipe.action as 'like' | 'superlike',
        isFavorited,
        isMutual,
    };
}

/**
 * Serialize a Favorite document + user into a LikeCard for the favorites feed.
 */
export function serializeFavoriteCard(favorite: any, user: any) {
    const age = computeAge(user.dateOfBirth);
    const locationParts = (user.location || '').split(',').map((s: string) => s.trim());

    return {
        id: favorite._id.toString(),
        userId: user._id.toString(),
        name: user.name || '',
        firstName: (user.name || '').split(' ')[0],
        age,
        city: locationParts[0] || undefined,
        profilePhoto: (user.photos || [])[0] || '',
        photos: user.photos || [],
        occupation: user.profession,
        religiosity: user.religiousPractice,
        isVerified: !!(user.isPhoneVerified || user.isEmailVerified),
        isPremium: !!(user.subscription?.plan !== 'free' && user.subscription?.isActive),
        isOnline: user.lastActive
            ? Date.now() - new Date(user.lastActive).getTime() < 15 * 60 * 1000
            : false,
        lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : undefined,
        likedAt: favorite.createdAt ? new Date(favorite.createdAt).toISOString() : new Date().toISOString(),
        action: 'like' as const,
        isFavorited: true,
        isMutual: false,
    };
}

/**
 * Serialize a Match document with the matched user's profile details.
 */
export function serializeMatch(match: any, currentUserId: string, otherUser: any) {
    const age = computeAge(otherUser.dateOfBirth);
    const locationParts = (otherUser.location || '').split(',').map((s: string) => s.trim());

    return {
        id: match._id.toString(),
        matchedUserId: otherUser._id.toString(),
        matchedUserName: otherUser.name,
        matchedUserPhoto: (otherUser.photos || [])[0] || '',
        matchedUserAge: age,
        matchedUserCity: locationParts[0] || undefined,
        isVerified: !!(otherUser.isPhoneVerified || otherUser.isEmailVerified),
        isPremium: !!(otherUser.subscription?.plan !== 'free' && otherUser.subscription?.isActive),
        matchedAt: match.createdAt?.toISOString(),
        lastMessage: match.lastMessage,
        lastMessageAt: match.lastMessageAt?.toISOString(),
        isRead: true,
        hasNewMessage: false,
        isOnline: otherUser.lastActive
            ? Date.now() - new Date(otherUser.lastActive).getTime() < 15 * 60 * 1000
            : false,
        lastActive: otherUser.lastActive ? new Date(otherUser.lastActive).toISOString() : undefined,
        similarities: match.similarities || [],
        compatibility: match.compatibility,
    };
}
