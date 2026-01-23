import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leave/balances - 休暇残数一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tenantId = searchParams.get('tenantId');
    const year = searchParams.get('year');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (year) {
      where.year = parseInt(year, 10);
    }

    const balances = await prisma.leave_balances.findMany({
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

// POST /api/leave/balances - 休暇残数作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tenantId,
      userId,
      year,
      paidLeaveTotal = 10,
      paidLeaveExpiry,
      sickLeaveTotal = 10,
      specialLeaveTotal = 5,
      compensatoryLeaveTotal = 0,
    } = body;

    // バリデーション
    if (!tenantId || !userId || !year || !paidLeaveExpiry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['tenantId', 'userId', 'year', 'paidLeaveExpiry'],
        },
        { status: 400 }
      );
    }

    // 休暇残数作成
    const balance = await prisma.leave_balances.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        year: parseInt(String(year), 10),
        paidLeaveTotal,
        paidLeaveUsed: 0,
        paidLeaveRemaining: paidLeaveTotal,
        paidLeaveExpiry: new Date(paidLeaveExpiry),
        sickLeaveTotal,
        sickLeaveUsed: 0,
        sickLeaveRemaining: sickLeaveTotal,
        specialLeaveTotal,
        specialLeaveUsed: 0,
        specialLeaveRemaining: specialLeaveTotal,
        compensatoryLeaveTotal,
        compensatoryLeaveUsed: 0,
        compensatoryLeaveRemaining: compensatoryLeaveTotal,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: balance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating leave balance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create leave balance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
