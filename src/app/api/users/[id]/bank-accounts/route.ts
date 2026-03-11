import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError, getTenantIdFromRequest } from '@/lib/api/api-helpers';
import crypto from 'crypto';

/**
 * GET /api/users/[id]/bank-accounts - 振込口座一覧を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId } = await params;

    const accounts = await prisma.employee_bank_accounts.findMany({
      where: { tenantId, userId },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(accounts, { count: accounts.length });
  } catch (error) {
    return handleApiError(error, '振込口座の取得');
  }
}

/**
 * POST /api/users/[id]/bank-accounts - 振込口座を新規作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId } = await params;
    const body = await request.json();

    // メイン口座として追加する場合、既存のメイン口座を解除
    if (body.isPrimary) {
      await prisma.employee_bank_accounts.updateMany({
        where: { tenantId, userId, isPrimary: true },
        data: { isPrimary: false, updatedAt: new Date() },
      });
    }

    const account = await prisma.employee_bank_accounts.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        bankName: body.bankName,
        branchName: body.branchName,
        accountType: body.accountType ?? 'ordinary',
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
        isPrimary: body.isPrimary ?? false,
        transferAmount: body.transferAmount ?? null,
        sortOrder: body.sortOrder ?? 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '振込口座の作成');
  }
}
