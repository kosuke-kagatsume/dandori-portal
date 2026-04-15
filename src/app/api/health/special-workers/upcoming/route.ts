import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// 特定業務従事者: 受診期限が近い対象者
// 特定業務従事者は6ヶ月以内の受診義務がある
// - 4ヶ月経過: 通常表示（受診予定）
// - 5ヶ月経過: 黄色警告（期限1ヶ月前）
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

    const lastCheckupMap = new Map<string, Date>();
    for (const c of latestCheckups) {
      if (!lastCheckupMap.has(c.userId)) {
        lastCheckupMap.set(c.userId, c.checkupDate);
      }
    }

    // 予約済みの予定がある従業員を除外対象として取得
    const scheduledUsers = workerIds.length > 0
      ? await prisma.health_checkup_schedules.findMany({
          where: {
            userId: { in: workerIds },
            tenantId,
            status: 'scheduled',
          },
          select: { userId: true },
        })
      : [];
    const scheduledUserIds = new Set(scheduledUsers.map(s => s.userId));

    const now = new Date();
    const upcoming: {
      id: string;
      name: string;
      department: string | null;
      position: string | null;
      lastCheckupDate: string | null;
      monthsElapsed: number;
      isWarning: boolean;
    }[] = [];

    for (const w of workers) {
      // 予約済み予定がある場合はアラート対象外
      if (scheduledUserIds.has(w.id)) continue;

      const lastDate = lastCheckupMap.get(w.id);
      if (!lastDate) {
        // 受診記録なし → 即時対象
        upcoming.push({
          id: w.id,
          name: w.name,
          department: w.department,
          position: w.position,
          lastCheckupDate: null,
          monthsElapsed: -1,
          isWarning: true,
        });
        continue;
      }

      const diffMs = now.getTime() - lastDate.getTime();
      const monthsElapsed = diffMs / (1000 * 60 * 60 * 24 * 30.44);

      if (monthsElapsed >= 4) {
        upcoming.push({
          id: w.id,
          name: w.name,
          department: w.department,
          position: w.position,
          lastCheckupDate: lastDate.toISOString(),
          monthsElapsed: Math.floor(monthsElapsed),
          isWarning: monthsElapsed >= 5,
        });
      }
    }

    // 警告者優先、経過月数降順
    upcoming.sort((a, b) => {
      if (a.isWarning !== b.isWarning) return a.isWarning ? -1 : 1;
      return b.monthsElapsed - a.monthsElapsed;
    });

    return NextResponse.json({ success: true, data: upcoming });
  } catch (error) {
    console.error('特定業務従事者期限取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '取得に失敗しました' },
      { status: 500 }
    );
  }
}
