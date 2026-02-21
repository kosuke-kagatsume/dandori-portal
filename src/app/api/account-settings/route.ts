import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/account-settings - マイアカウント設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // 設定を取得（なければ作成）
    let settings = await prisma.user_account_settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.user_account_settings.create({
        data: {
          id: `uas-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId,
          userId,
          updatedAt: new Date(),
        },
      });
    }

    return successResponse(settings, {
      cacheSeconds: 60,
    });
  } catch (error) {
    return handleApiError(error, 'マイアカウント設定の取得');
  }
}

// PUT /api/account-settings - マイアカウント設定更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tenantId: _tenantId, ...data } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // 既存の設定を確認
    const existing = await prisma.user_account_settings.findUnique({
      where: { userId },
    });

    // tenantIdはCookieから取得（リクエストボディのtenantIdは無視）
    const resolvedTenantId = await getTenantIdFromRequest(request);

    let settings;
    if (existing) {
      // 更新
      settings = await prisma.user_account_settings.update({
        where: { userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } else {
      // 作成
      settings = await prisma.user_account_settings.create({
        data: {
          id: `uas-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId: resolvedTenantId,
          userId,
          ...data,
          updatedAt: new Date(),
        },
      });
    }

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error, 'マイアカウント設定の更新');
  }
}

// PATCH /api/account-settings - 部分更新（パスワード変更など）
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, ...data } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // アクション別処理
    if (action === 'change_password') {
      // パスワード変更処理
      // TODO: AWS Cognitoと連携してパスワード変更
      // 現在はpasswordChangedAtのみ更新
      const settings = await prisma.user_account_settings.upsert({
        where: { userId },
        update: {
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          id: `uas-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId: await getTenantIdFromRequest(request),
          userId,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return successResponse({
        ...settings,
        message: 'パスワードが変更されました',
      });
    }

    if (action === 'toggle_2fa') {
      // 2FA切り替え
      const existing = await prisma.user_account_settings.findUnique({
        where: { userId },
      });

      const settings = await prisma.user_account_settings.upsert({
        where: { userId },
        update: {
          twoFactorEnabled: !existing?.twoFactorEnabled,
          twoFactorSecret: data.twoFactorEnabled ? data.twoFactorSecret : null,
          updatedAt: new Date(),
        },
        create: {
          id: `uas-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId: await getTenantIdFromRequest(request),
          userId,
          twoFactorEnabled: true,
          twoFactorSecret: data.twoFactorSecret,
          updatedAt: new Date(),
        },
      });

      return successResponse({
        ...settings,
        message: settings.twoFactorEnabled
          ? '2段階認証が有効になりました'
          : '2段階認証が無効になりました',
      });
    }

    if (action === 'update_notifications') {
      // 通知設定更新
      const settings = await prisma.user_account_settings.upsert({
        where: { userId },
        update: {
          emailNotifications: data.emailNotifications,
          pushNotifications: data.pushNotifications,
          workflowNotifications: data.workflowNotifications,
          leaveNotifications: data.leaveNotifications,
          systemNotifications: data.systemNotifications,
          announcementNotifications: data.announcementNotifications,
          updatedAt: new Date(),
        },
        create: {
          id: `uas-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId: await getTenantIdFromRequest(request),
          userId,
          ...data,
          updatedAt: new Date(),
        },
      });

      return successResponse({
        ...settings,
        message: '通知設定が更新されました',
      });
    }

    if (action === 'update_appearance') {
      // 外観設定更新
      const settings = await prisma.user_account_settings.upsert({
        where: { userId },
        update: {
          theme: data.theme,
          language: data.language,
          timezone: data.timezone,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
          updatedAt: new Date(),
        },
        create: {
          id: `uas-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId: await getTenantIdFromRequest(request),
          userId,
          theme: data.theme,
          language: data.language,
          timezone: data.timezone,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
          updatedAt: new Date(),
        },
      });

      return successResponse({
        ...settings,
        message: '外観設定が更新されました',
      });
    }

    if (action === 'update_quick_actions') {
      // クイックアクション設定更新
      const settings = await prisma.user_account_settings.upsert({
        where: { userId },
        update: {
          quickActionSettings: JSON.stringify(data.quickActionSettings),
          updatedAt: new Date(),
        },
        create: {
          id: `uas-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId: await getTenantIdFromRequest(request),
          userId,
          quickActionSettings: JSON.stringify(data.quickActionSettings),
          updatedAt: new Date(),
        },
      });

      return successResponse({
        ...settings,
        quickActionSettings: settings.quickActionSettings
          ? JSON.parse(settings.quickActionSettings)
          : null,
        message: 'クイックアクション設定が更新されました',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, 'マイアカウント設定の更新');
  }
}
