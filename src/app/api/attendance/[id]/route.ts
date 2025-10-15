import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance/[id] - 個別勤怠取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/attendance/[id] - 勤怠更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // 存在確認
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
        },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: any = { ...body };

    // DateTime フィールドの変換
    if (body.date) {
      updateData.date = new Date(body.date);
    }
    if (body.checkIn) {
      updateData.checkIn = new Date(body.checkIn);
    }
    if (body.checkOut) {
      updateData.checkOut = new Date(body.checkOut);
    }
    if (body.breakStart) {
      updateData.breakStart = new Date(body.breakStart);
    }
    if (body.breakEnd) {
      updateData.breakEnd = new Date(body.breakEnd);
    }

    // 勤怠更新
    const attendance = await prisma.attendance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update attendance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance/[id] - 勤怠削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 存在確認
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
        },
        { status: 404 }
      );
    }

    // 勤怠削除
    await prisma.attendance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attendance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
