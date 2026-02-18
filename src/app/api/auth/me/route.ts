import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'dandori-portal-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Check for access token
    const accessToken = cookieStore.get('access_token');
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '認証されていません' },
        { status: 401 }
      );
    }

    // Verify JWT token
    let payload: JWTPayload;
    try {
      payload = verify(accessToken.value, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'トークンが無効です' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          roles: [user.role || 'employee'],
          department: user.department,
          position: user.position,
          tenantId: user.tenantId,
          phone: user.phone,
          hireDate: user.hireDate?.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
