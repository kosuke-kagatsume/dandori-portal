import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * GET /api/members/status - メンバー状況一覧取得
 *
 * テナント内の全ユーザーと本日の勤怠状況を取得する
 * メンバー状況画面で使用
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    if (!tenantId) {
      return new Response(
        JSON.stringify({ success: false, error: 'tenantId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 今日の日付（時刻部分を00:00:00に）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // テナント内の全ユーザーを取得
    const users = await prisma.users.findMany({
      where: {
        tenantId,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        position: true,
        role: true,
        avatar: true,
      },
      orderBy: [
        { department: 'asc' },
        { name: 'asc' },
      ],
    });

    // 本日の勤怠データを取得
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        tenantId,
        date: today,
        userId: {
          in: users.map((u) => u.id),
        },
      },
      select: {
        userId: true,
        checkIn: true,
        checkOut: true,
        workLocation: true,
        status: true,
        workMinutes: true,
        overtimeMinutes: true,
        updatedAt: true,
      },
    });

    // ユーザーIDをキーにした勤怠マップを作成
    const attendanceMap = new Map(
      attendanceRecords.map((a) => [a.userId, a])
    );

    // 勤務開始時間を取得（デフォルト9:00）
    const settings = await prisma.attendance_settings.findUnique({
      where: { tenantId },
      select: { workStartTime: true },
    });
    const workStartTime = settings?.workStartTime || '09:00';
    const [startHour, startMin] = workStartTime.split(':').map(Number);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    // 勤務開始時間を過ぎているかチェック
    const isPastWorkStart =
      currentHour > startHour ||
      (currentHour === startHour && currentMin >= startMin);

    // メンバー状況データを構築
    const members = users.map((user) => {
      const attendance = attendanceMap.get(user.id);

      let currentStatus: string;
      let workLocation: string | null = null;
      let checkedInAt: string | null = null;
      let workingTime: string | null = null;
      let lastActivity: string | null = null;

      if (attendance) {
        // 勤怠レコードがある場合
        currentStatus = attendance.status;
        workLocation = attendance.workLocation || null;

        if (attendance.checkIn) {
          const checkInDate = new Date(attendance.checkIn);
          checkedInAt = `${checkInDate.getHours().toString().padStart(2, '0')}:${checkInDate.getMinutes().toString().padStart(2, '0')}`;

          // 稼働時間を計算
          if (attendance.workMinutes > 0) {
            const hours = Math.floor(attendance.workMinutes / 60);
            const mins = attendance.workMinutes % 60;
            workingTime = `${hours}h ${mins}m`;
          } else if (!attendance.checkOut) {
            // まだ退勤していない場合はリアルタイム計算
            const diffMs = now.getTime() - checkInDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            workingTime = `${hours}h ${mins}m`;
          }
        }

        // 最終活動時間
        if (attendance.updatedAt) {
          const updatedAt = new Date(attendance.updatedAt);
          const diffMs = now.getTime() - updatedAt.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          if (diffMins < 60) {
            lastActivity = `${diffMins}分前`;
          } else if (diffMins < 1440) {
            lastActivity = `${Math.floor(diffMins / 60)}時間前`;
          } else {
            lastActivity = `${Math.floor(diffMins / 1440)}日前`;
          }
        }
      } else {
        // 勤怠レコードがない場合
        if (isPastWorkStart) {
          // 勤務開始時間を過ぎているのに打刻がない→未出勤
          currentStatus = 'not_checked_in';
        } else {
          // 勤務開始前→未出勤（グレー表示）
          currentStatus = 'not_checked_in';
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        position: user.position,
        role: user.role,
        avatar: user.avatar,
        currentStatus,
        workLocation,
        checkedInAt,
        workingTime,
        lastActivity,
      };
    });

    // ステータス別集計
    const stats = {
      total: members.length,
      present: members.filter((m) => m.currentStatus === 'present').length,
      remote: members.filter((m) => m.currentStatus === 'remote').length,
      business_trip: members.filter((m) => m.currentStatus === 'business_trip').length,
      training: members.filter((m) => m.currentStatus === 'training').length,
      absent: members.filter((m) => m.currentStatus === 'absent').length,
      not_checked_in: members.filter((m) => m.currentStatus === 'not_checked_in').length,
    };

    return successResponse(
      { members, stats },
      {
        count: members.length,
        cacheSeconds: 30, // 30秒キャッシュ（リアルタイム性重視）
      }
    );
  } catch (error) {
    return handleApiError(error, 'メンバー状況の取得');
  }
}
