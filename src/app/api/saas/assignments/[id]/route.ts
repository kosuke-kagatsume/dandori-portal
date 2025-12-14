import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/saas/assignments/[id] - ライセンス割り当て詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.saas_license_assignments.findUnique({
      where: { id: params.id },
      include: {
        service: true,
        plan: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'ライセンス割り当てが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error fetching license assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch license assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/saas/assignments/[id] - ライセンス割り当て更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      planId,
      userId,
      userName,
      userEmail,
      userDepartment,
      assignedDate,
      expiryDate,
      isActive,
      notes,
    } = body;

    const assignment = await prisma.saas_license_assignments.update({
      where: { id: params.id },
      data: {
        planId,
        userId,
        userName,
        userEmail,
        userDepartment,
        assignedDate: assignedDate ? new Date(assignedDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive,
        notes,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error updating license assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update license assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/saas/assignments/[id] - ライセンス割り当て削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.saas_license_assignments.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'ライセンス割り当てを削除しました',
    });
  } catch (error) {
    console.error('Error deleting license assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete license assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
