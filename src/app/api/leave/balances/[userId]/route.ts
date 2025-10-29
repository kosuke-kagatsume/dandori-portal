import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leave/balances/[userId] - ユーザー別休暇残数取得
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    const where: Record<string, unknown> = { userId };

    if (year) {
      where.year = parseInt(year, 10);
    }

    const balances = await prisma.leaveBalance.findMany({
      where,
      orderBy: {
        year: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: balances,
      count: balances.length,
    });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leave balances',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/leave/balances/[userId] - ユーザー別休暇残数更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    const {
      year,
      paidLeaveUsed,
      sickLeaveUsed,
      specialLeaveUsed,
      compensatoryLeaveUsed,
    } = body;

    if (!year) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['year'],
        },
        { status: 400 }
      );
    }

    // 既存の残数を確認
    const existingBalance = await prisma.leaveBalance.findFirst({
      where: {
        userId,
        year: parseInt(String(year), 10),
      },
    });

    if (!existingBalance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Leave balance not found',
        },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: Record<string, unknown> = {};

    if (paidLeaveUsed !== undefined) {
      updateData.paidLeaveUsed = paidLeaveUsed;
      updateData.paidLeaveRemaining = existingBalance.paidLeaveTotal - paidLeaveUsed;
    }

    if (sickLeaveUsed !== undefined) {
      updateData.sickLeaveUsed = sickLeaveUsed;
      updateData.sickLeaveRemaining = existingBalance.sickLeaveTotal - sickLeaveUsed;
    }

    if (specialLeaveUsed !== undefined) {
      updateData.specialLeaveUsed = specialLeaveUsed;
      updateData.specialLeaveRemaining = existingBalance.specialLeaveTotal - specialLeaveUsed;
    }

    if (compensatoryLeaveUsed !== undefined) {
      updateData.compensatoryLeaveUsed = compensatoryLeaveUsed;
      updateData.compensatoryLeaveRemaining = existingBalance.compensatoryLeaveTotal - compensatoryLeaveUsed;
    }

    // 更新
    const balance = await prisma.leaveBalance.update({
      where: { id: existingBalance.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update leave balance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
