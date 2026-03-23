import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { Guardian } from '@/lib/db/models/Guardian';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeConversation } from '@/lib/discover/helpers';

const PARTICIPANT_SELECT =
  "name dateOfBirth gender photos photoBlurEnabled isPhoneVerified isEmailVerified subscription lastActive";

/**
 * GET /api/conversations
 * Returns all active match-based conversations for the current user,
 * sorted by latest activity (newest message or match date).
 * Matches without messages ("new matches") are included at the bottom.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const currentUserId = new mongoose.Types.ObjectId(authResult.user.userId);
        const currentUser = await User.findById(currentUserId).select('gender').lean();

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const guardianLinks = await Guardian.find({
            maleUserId: currentUserId,
            status: 'active',
        })
            .select('femaleUserId')
            .lean();

        const guardianFemaleIds = guardianLinks
            .map((link) => link.femaleUserId)
            .filter(Boolean);

        const femaleIdsFromMatches = new Set<string>();

        const matches = await Match.find({
            isActive: true,
            $or: [
                { user1: currentUserId },
                { user2: currentUserId },
                ...(guardianFemaleIds.length > 0
                    ? [
                        { user1: { $in: guardianFemaleIds } },
                        { user2: { $in: guardianFemaleIds } },
                    ]
                    : []),
            ],
        })
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .lean();

        for (const match of matches) {
            const user1Id = match.user1.toString();
            const user2Id = match.user2.toString();

            if (user1Id !== authResult.user.userId) {
                femaleIdsFromMatches.add(user1Id);
            }
            if (user2Id !== authResult.user.userId) {
                femaleIdsFromMatches.add(user2Id);
            }
        }

        const directMahrams = await Guardian.find({
            status: 'active',
            maleUserId: { $exists: true, $ne: null },
            femaleUserId: { $in: Array.from(femaleIdsFromMatches).map((id) => new mongoose.Types.ObjectId(id)) },
        })
            .select('femaleUserId maleUserId')
            .lean();

        const mahramByFemaleId = new Map<string, string>();
        for (const rel of directMahrams) {
            if (rel.femaleUserId && rel.maleUserId) {
                mahramByFemaleId.set(rel.femaleUserId.toString(), rel.maleUserId.toString());
            }
        }

        // If current user is female, find her own mahram
        let ownMahramId: string | null = null;
        if (currentUser.gender === 'female') {
            const ownGuardian = await Guardian.findOne({
                femaleUserId: currentUserId,
                status: 'active',
                maleUserId: { $exists: true, $ne: null },
            }).select('maleUserId').lean();
            if (ownGuardian?.maleUserId) {
                ownMahramId = ownGuardian.maleUserId.toString();
            }
        }

        if (matches.length === 0) {
            return NextResponse.json({ success: true, conversations: [] });
        }

        const guardianFemaleIdSet = new Set(guardianFemaleIds.map((id) => id.toString()));

        // Collect participant IDs
        const participantIds: mongoose.Types.ObjectId[] = [];
        const wardIdsByMatch = new Map<string, string>();

        for (const match of matches) {
            const user1Id = match.user1.toString();
            const user2Id = match.user2.toString();

            if (user1Id === authResult.user.userId) {
                if (currentUser.gender === 'male') {
                    const mahramId = mahramByFemaleId.get(user2Id);
                    if (mahramId) {
                        participantIds.push(new mongoose.Types.ObjectId(mahramId));
                        participantIds.push(match.user2);
                        wardIdsByMatch.set(match._id.toString(), user2Id);
                        continue;
                    }
                } else if (ownMahramId) {
                    // Female viewer with her own mahram — include mahram user data
                    participantIds.push(new mongoose.Types.ObjectId(ownMahramId));
                    wardIdsByMatch.set(match._id.toString(), ownMahramId);
                }

                participantIds.push(match.user2);
                continue;
            }

            if (user2Id === authResult.user.userId) {
                if (currentUser.gender === 'male') {
                    const mahramId = mahramByFemaleId.get(user1Id);
                    if (mahramId) {
                        participantIds.push(new mongoose.Types.ObjectId(mahramId));
                        participantIds.push(match.user1);
                        wardIdsByMatch.set(match._id.toString(), user1Id);
                        continue;
                    }
                } else if (ownMahramId) {
                    // Female viewer with her own mahram — include mahram user data
                    participantIds.push(new mongoose.Types.ObjectId(ownMahramId));
                    wardIdsByMatch.set(match._id.toString(), ownMahramId);
                }

                participantIds.push(match.user1);
                continue;
            }

            const wardId = guardianFemaleIdSet.has(user1Id)
                ? user1Id
                : guardianFemaleIdSet.has(user2Id)
                    ? user2Id
                    : null;

            if (!wardId) {
                continue;
            }

            const suitorId = wardId === user1Id ? user2Id : user1Id;
            participantIds.push(new mongoose.Types.ObjectId(suitorId));
            participantIds.push(new mongoose.Types.ObjectId(wardId));
            wardIdsByMatch.set(match._id.toString(), wardId);
        }

        const participants = await User.find({ _id: { $in: participantIds } })
            .select(PARTICIPANT_SELECT)
            .lean();
        const participantMap = new Map(participants.map((u) => [u._id.toString(), u]));

        // Unread counts for all conversations at once
        const unreadAgg = await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: matches.map((m) => m._id) },
                    receiverId: currentUserId,
                    isRead: false,
                    isDeleted: false,
                },
            },
            { $group: { _id: '$conversationId', count: { $sum: 1 } } },
        ]);
        const unreadMap = new Map(unreadAgg.map((r) => [r._id.toString(), r.count as number]));

        // Last message for each conversation
        const lastMessages = await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: matches.map((m) => m._id) },
                    isDeleted: false,
                },
            },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$conversationId', msg: { $first: '$$ROOT' } } },
        ]);
        const lastMessageMap = new Map(lastMessages.map((r) => [r._id.toString(), r.msg]));

        const conversations = matches
            .map((match) => {
                const user1Id = match.user1.toString();
                const user2Id = match.user2.toString();

                const isDirectParticipant =
                    user1Id === authResult.user.userId || user2Id === authResult.user.userId;

                let otherId: string;
                let wardId: string | undefined;

                if (isDirectParticipant) {
                    const directFemaleId = user1Id === authResult.user.userId ? user2Id : user1Id;

                    if (currentUser.gender === 'male') {
                        const mahramId = mahramByFemaleId.get(directFemaleId);
                        if (mahramId) {
                            otherId = mahramId;
                            wardId = directFemaleId;
                        } else {
                            otherId = directFemaleId;
                        }
                    } else {
                        otherId = directFemaleId;
                        // Female viewer — if she has a mahram, include mahram as wardId
                        if (ownMahramId) {
                            wardId = ownMahramId;
                        }
                    }
                } else {
                    wardId = wardIdsByMatch.get(match._id.toString());
                    if (!wardId) return null;
                    otherId = wardId === user1Id ? user2Id : user1Id;
                }

                const participant = participantMap.get(otherId);
                if (!participant) return null;

                const baseConversation = serializeConversation(
                    match,
                    participant,
                    lastMessageMap.get(match._id.toString()) ?? null,
                    unreadMap.get(match._id.toString()) ?? 0,
                    authResult.user.userId
                );

                if (wardId) {
                    const ward = participantMap.get(wardId);
                    return {
                        ...baseConversation,
                        isMahramConversation: true,
                        wardId,
                        wardName: ward?.name || '',
                        wardPhoto: ward?.photos?.[0] || '',
                    };
                }

                return baseConversation;
            })
            .filter(Boolean);

        return NextResponse.json({ success: true, conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
