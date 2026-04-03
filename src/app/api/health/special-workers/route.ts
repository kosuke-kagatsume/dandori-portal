import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// 特定業務従事者一覧 + 最新健診受診日
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const workers = await prisma.users.findMany({
      where: {
        tenantId,
        isSpecialWorker: true,
        employmentStatus: { not: 'retired' },
      },
      select: {
        id: true,
        name: true,
        department: true,
        position: true,
        employeeNumber: true,
      },
      orderBy: { name: 'asc' },
    });

    // 各従事者の最新健診日を取得
    const workerIds = workers.map((w) => w.id);
    const latestCheckups = workerIds.length > 0
      ? await prisma.health_checkups.findMany({
          where: {
            userId: { in: workerIds },
            tenantId,
          },
          select: {
            userId: true,
            checkupDate: true,
          },
          orderBy: { checkupDate: 'desc' },
        })
      : [];

    // userId → 最新checkupDate のマップ
    const lastCheckupMap = new Map<string, Date>();
    for (const c of latestCheckups) {
      if (!lastCheckupMap.has(c.userId)) {
        lastCheckupMap.set(c.userId, c.checkupDate);
      }
    }

    const data = workers.map((w) => ({
      id: w.id,
      name: w.name,
      department: w.department,
      position: w.position,
      employeeNumber: w.employeeNumber,
      lastCheckupDate: lastCheckupMap.get(w.id)?.toISOString() || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('特定業務従事者一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '取得に失敗しました' },
      { status: 500 }
    );
  }
}
