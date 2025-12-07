import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

// GET /api/admin/certifications/settings - 通知設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    let settings = await prisma.certificationNotificationSettings.findUnique({
      where: { tenantId },
    });

    // 設定がなければデフォルト値で作成
    if (!settings) {
      settings = await prisma.certificationNotificationSettings.create({
        data: { tenantId },
      });
    }

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error, '通知設定の取得');
  }
}

// PUT /api/admin/certifications/settings - 通知設定更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      notificationDays,
      enableEmailNotification,
      enablePushNotification,
      enableInAppNotification,
      escalateToManagerDays,
      escalateToHrDays,
      autoUpdateStatus,
      warningThresholdDays,
    } = body;

    const finalTenantId = tenantId || 'tenant-demo-001';

    const settings = await prisma.certificationNotificationSettings.upsert({
      where: { tenantId: finalTenantId },
      update: {
        ...(notificationDays !== undefined && { notificationDays }),
        ...(enableEmailNotification !== undefined && { enableEmailNotification }),
        ...(enablePushNotification !== undefined && { enablePushNotification }),
        ...(enableInAppNotification !== undefined && { enableInAppNotification }),
        ...(escalateToManagerDays !== undefined && { escalateToManagerDays }),
        ...(escalateToHrDays !== undefined && { escalateToHrDays }),
        ...(autoUpdateStatus !== undefined && { autoUpdateStatus }),
        ...(warningThresholdDays !== undefined && { warningThresholdDays }),
        updatedAt: new Date(),
      },
      create: {
        tenantId: finalTenantId,
        notificationDays: notificationDays || [90, 60, 30, 14, 7],
        enableEmailNotification: enableEmailNotification ?? true,
        enablePushNotification: enablePushNotification ?? true,
        enableInAppNotification: enableInAppNotification ?? true,
        escalateToManagerDays: escalateToManagerDays ?? 30,
        escalateToHrDays: escalateToHrDays ?? 14,
        autoUpdateStatus: autoUpdateStatus ?? true,
        warningThresholdDays: warningThresholdDays ?? 30,
      },
    });

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error, '通知設定の更新');
  }
}
