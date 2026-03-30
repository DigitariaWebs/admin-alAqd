import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Report } from '@/lib/db/models/Report';
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
    const status = searchParams.get('status')?.trim();
    const reason = searchParams.get('reason')?.trim();

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    // Get user info for reporters and reported users
    const userIds = [
      ...new Set(reports.flatMap((r: any) => [r.reporterId.toString(), r.reportedId.toString()])),
    ];
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email phoneNumber photos')
      .lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const serialized = reports.map((r: any) => {
      const reporter = userMap.get(r.reporterId.toString());
      const reported = userMap.get(r.reportedId.toString());
      return {
        id: r._id.toString(),
        reporter: {
          id: r.reporterId.toString(),
          name: reporter?.name || 'Unknown',
          photo: reporter?.photos?.[0],
        },
        reported: {
          id: r.reportedId.toString(),
          name: reported?.name || 'Unknown',
          photo: reported?.photos?.[0],
        },
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt?.toISOString(),
      };
    });

    // Stats
    const [pending, reviewed, resolved, totalAll] = await Promise.all([
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'reviewed' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({}),
    ]);

    return NextResponse.json({
      success: true,
      reports: serialized,
      stats: { total: totalAll, pending, reviewed, resolved },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = requireRole(request, ['admin', 'moderator']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { id, status } = await request.json();
    if (!id || !['pending', 'reviewed', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
