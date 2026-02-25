import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id] - 個別ユーザー取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.users.findUnique({
      where: { id: params.id },
      include: {
        org_units: {
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
          },
        },
        tenants: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - ユーザー更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // 存在確認
    const existingUser = await prisma.users.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // メールアドレス変更時の重複チェック
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email: body.email },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already exists',
          },
          { status: 409 }
        );
      }
    }

    // 更新データの準備
    const updateData: Record<string, unknown> = { ...body };

    // 日付フィールドの変換（タイムゾーン問題を回避：UTCの正午として設定）
    if (body.hireDate) {
      const dateStr = body.hireDate.split('T')[0]; // "YYYY-MM-DD" 形式を取得
      updateData.hireDate = new Date(`${dateStr}T12:00:00Z`);
    }
    if (body.retiredDate) {
      const dateStr = body.retiredDate.split('T')[0];
      updateData.retiredDate = new Date(`${dateStr}T12:00:00Z`);
    }

    // roles配列からrole（単数）への同期
    // フロントエンドはroles配列を送信するが、認証システムはroleフィールドを使用
    if (body.roles && Array.isArray(body.roles)) {
      if (body.roles.length === 0) {
        return NextResponse.json(
          { success: false, error: '少なくとも1つの権限が必要です' },
          { status: 400 }
        );
      }
      updateData.role = body.roles[0]; // 最初の権限をプライマリ権限として設定
      updateData.roles = body.roles; // roles配列も更新
    }

    // ユーザー更新
    const user = await prisma.users.update({
      where: { id: params.id },
      data: updateData,
      include: {
        org_units: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        tenants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - ユーザー削除（物理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 存在確認
    const existingUser = await prisma.users.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // ユーザー削除
    await prisma.users.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
