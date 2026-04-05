import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, ['admin', 'moderator']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search')?.trim();
    const relationship = searchParams.get('relationship')?.trim();

    const query: Record<string, unknown> = {
      gender: 'female',
      $or: [
        { 'mahram.phoneNumber': { $exists: true, $ne: null } },
        { 'mahram.email': { $exists: true, $ne: null } },
      ],
    };

    if (relationship) {
      query['mahram.relationship'] = relationship;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$and = [{
        $or: [
          { name: regex },
          { email: regex },
          { 'mahram.phoneNumber': regex },
          { 'mahram.email': regex },
        ],
      }];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email phoneNumber mahram createdAt')
        .sort({ 'mahram.notifiedAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Stats
    const allMahramUsers = await User.aggregate([
      { $match: { gender: 'female', $or: [{ 'mahram.phoneNumber': { $exists: true, $ne: null } }, { 'mahram.email': { $exists: true, $ne: null } }] } },
      { $group: { _id: '$mahram.relationship', count: { $sum: 1 } } },
    ]);

    const stats: Record<string, number> = { total: 0, father: 0, brother: 0, uncle: 0, grandfather: 0, other: 0 };
    for (const item of allMahramUsers) {
      stats[item._id as string] = item.count;
      stats.total += item.count;
    }

    const serialized = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phoneNumber: u.phoneNumber,
      mahram: {
        email: u.mahram?.email,
        phoneNumber: u.mahram?.phoneNumber,
        relationship: u.mahram?.relationship,
        notifiedAt: u.mahram?.notifiedAt?.toISOString(),
      },
      createdAt: u.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      users: serialized,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin mahrams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
