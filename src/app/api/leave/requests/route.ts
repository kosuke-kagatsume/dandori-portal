import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leave/requests - 休暇申請一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const tenantId = searchParams.get('tenantId');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (type) {
      where.type = type;
    }

    const requests = await prisma.leave_requests.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leave requests',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/leave/requests - 休暇申請作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tenantId,
      userId,
      userName,
      type,
      startDate,
      endDate,
      days,
      reason,
      status = 'draft',
    } = body;

    // バリデーション
    if (!tenantId || !userId || !userName || !type || !startDate || !endDate || days === undefined || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['tenantId', 'userId', 'userName', 'type', 'startDate', 'endDate', 'days', 'reason'],
        },
        { status: 400 }
      );
    }

    // 休暇申請作成
    const leaveRequest = await prisma.leave_requests.create({
      data: {
        tenantId,
        userId,
        userName,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
        status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: leaveRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create leave request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
