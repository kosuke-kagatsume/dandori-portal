import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance-settings - 勤怠設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const settings = await prisma.attendance_settings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // 設定が存在しない場合はデフォルト値を返す
      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          workStartTime: '09:00',
          workEndTime: '18:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00',
          breakDurationMinutes: 60,
          enableFlexTime: false,
          coreTimeStart: null,
          coreTimeEnd: null,
          overtimeThresholdMinutes: 480,
          maxOvertimeHoursPerMonth: 45,
          allowRemoteCheckIn: true,
          requireLocationOnCheckIn: false,
          allowEarlyCheckIn: true,
          earlyCheckInMinutes: 30,
          weeklyHolidays: ['saturday', 'sunday'],
        },
        isNew: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime,
        breakStartTime: settings.breakStartTime,
        breakEndTime: settings.breakEndTime,
        breakDurationMinutes: settings.breakDurationMinutes,
        enableFlexTime: settings.enableFlexTime,
        coreTimeStart: settings.coreTimeStart,
        coreTimeEnd: settings.coreTimeEnd,
        overtimeThresholdMinutes: settings.overtimeThresholdMinutes,
        maxOvertimeHoursPerMonth: settings.maxOvertimeHoursPerMonth,
        allowRemoteCheckIn: settings.allowRemoteCheckIn,
        requireLocationOnCheckIn: settings.requireLocationOnCheckIn,
        allowEarlyCheckIn: settings.allowEarlyCheckIn,
        earlyCheckInMinutes: settings.earlyCheckInMinutes,
        weeklyHolidays: settings.weeklyHolidays,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/attendance-settings - 勤怠設定更新（upsert）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      workStartTime,
      workEndTime,
      breakStartTime,
      breakEndTime,
      breakDurationMinutes,
      enableFlexTime,
      coreTimeStart,
      coreTimeEnd,
      overtimeThresholdMinutes,
      maxOvertimeHoursPerMonth,
      allowRemoteCheckIn,
      requireLocationOnCheckIn,
      allowEarlyCheckIn,
      earlyCheckInMinutes,
      weeklyHolidays,
    } = body;

    // upsert（存在すれば更新、なければ作成）
    const settings = await prisma.attendance_settings.upsert({
      where: { tenantId },
      update: {
        workStartTime,
        workEndTime,
        breakStartTime,
        breakEndTime,
        breakDurationMinutes,
        enableFlexTime,
        coreTimeStart,
        coreTimeEnd,
        overtimeThresholdMinutes,
        maxOvertimeHoursPerMonth,
        allowRemoteCheckIn,
        requireLocationOnCheckIn,
        allowEarlyCheckIn,
        earlyCheckInMinutes,
        weeklyHolidays,
      },
      create: {
        tenantId,
        workStartTime: workStartTime ?? '09:00',
        workEndTime: workEndTime ?? '18:00',
        breakStartTime: breakStartTime ?? '12:00',
        breakEndTime: breakEndTime ?? '13:00',
        breakDurationMinutes: breakDurationMinutes ?? 60,
        enableFlexTime: enableFlexTime ?? false,
        coreTimeStart,
        coreTimeEnd,
        overtimeThresholdMinutes: overtimeThresholdMinutes ?? 480,
        maxOvertimeHoursPerMonth: maxOvertimeHoursPerMonth ?? 45,
        allowRemoteCheckIn: allowRemoteCheckIn ?? true,
        requireLocationOnCheckIn: requireLocationOnCheckIn ?? false,
        allowEarlyCheckIn: allowEarlyCheckIn ?? true,
        earlyCheckInMinutes: earlyCheckInMinutes ?? 30,
        weeklyHolidays: weeklyHolidays ?? ['saturday', 'sunday'],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
      },
    });
  } catch (error) {
    console.error('Error updating attendance settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update attendance settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
