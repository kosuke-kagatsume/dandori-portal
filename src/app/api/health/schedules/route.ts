import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantId,
  successResponse,
  handleApiError,
  validateRequired,
} from '@/lib/api/api-helpers';

// デモ用健診予定データ
const demoSchedules = [
  {
    id: 'schedule-001',
    tenantId: 'tenant-1',
    userId: 'user-001',
    userName: '田中太郎',
    departmentName: '営業部',
    checkupTypeName: '定期健康診断',
    medicalInstitutionId: 'inst-001',
    scheduledDate: new Date('2024-06-15'),
    scheduledTime: '09:00',
    status: 'scheduled',
    fiscalYear: 2024,
    notes: null,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
  },
  {
    id: 'schedule-002',
    tenantId: 'tenant-1',
    userId: 'user-002',
    userName: '山田花子',
    departmentName: '開発部',
    checkupTypeName: '定期健康診断',
    medicalInstitutionId: 'inst-001',
    scheduledDate: new Date('2024-06-15'),
    scheduledTime: '10:00',
    status: 'scheduled',
    fiscalYear: 2024,
    notes: null,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
  },
  {
    id: 'schedule-003',
    tenantId: 'tenant-1',
    userId: 'user-003',
    userName: '佐藤次郎',
    departmentName: '人事部',
    checkupTypeName: '定期健康診断',
    medicalInstitutionId: 'inst-002',
    scheduledDate: new Date('2024-06-20'),
    scheduledTime: '09:30',
    status: 'completed',
    fiscalYear: 2024,
    notes: null,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-06-20'),
  },
  {
    id: 'schedule-004',
    tenantId: 'tenant-1',
    userId: 'user-010',
    userName: '新人一郎',
    departmentName: '営業部',
    checkupTypeName: '雇入時健診',
    medicalInstitutionId: 'inst-001',
    scheduledDate: new Date('2024-04-10'),
    scheduledTime: '11:00',
    status: 'completed',
    fiscalYear: 2024,
    notes: '新入社員',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-10'),
  },
  {
    id: 'schedule-005',
    tenantId: 'tenant-1',
    userId: 'user-004',
    userName: '鈴木一郎',
    departmentName: '開発部',
    checkupTypeName: '定期健康診断',
    medicalInstitutionId: 'inst-003',
    scheduledDate: new Date('2024-07-01'),
    scheduledTime: '14:00',
    status: 'scheduled',
    fiscalYear: 2024,
    notes: null,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
  },
  {
    id: 'schedule-006',
    tenantId: 'tenant-1',
    userId: 'user-005',
    userName: '高橋真理',
    departmentName: '総務部',
    checkupTypeName: '定期健康診断',
    medicalInstitutionId: null,
    scheduledDate: new Date('2024-06-25'),
    scheduledTime: null,
    status: 'cancelled',
    fiscalYear: 2024,
    notes: '出張により予定変更',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-06-01'),
  },
];

// 健診予定一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get('status');
      const fiscalYear = searchParams.get('fiscalYear');

      let filteredSchedules = [...demoSchedules];

      if (status && status !== 'all') {
        filteredSchedules = filteredSchedules.filter((s) => s.status === status);
      }

      if (fiscalYear) {
        filteredSchedules = filteredSchedules.filter(
          (s) => s.fiscalYear === parseInt(fiscalYear)
        );
      }

      return successResponse(filteredSchedules);
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (fiscalYear) {
      where.fiscalYear = parseInt(fiscalYear);
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const schedules = await prisma.health_checkup_schedules.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
    });

    return successResponse(schedules);
  } catch (error) {
    return handleApiError(error, '健診予定の取得');
  }
}

// 健診予定登録
export async function POST(request: NextRequest) {
  try {
    // デモモードの場合は成功レスポンスを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const body = await request.json();
      const newSchedule = {
        id: `schedule-${Date.now()}`,
        ...body,
        scheduledDate: new Date(body.scheduledDate),
        status: body.status || 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return NextResponse.json({ success: true, data: newSchedule }, { status: 201 });
    }

    const body = await request.json();
    const {
      tenantId,
      userId,
      userName,
      departmentName,
      checkupTypeName,
      medicalInstitutionId,
      scheduledDate,
      scheduledTime,
      status,
      fiscalYear,
      notes,
    } = body;

    const validation = validateRequired(body, [
      'tenantId',
      'userId',
      'userName',
      'checkupTypeName',
      'scheduledDate',
      'fiscalYear',
    ]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const schedule = await prisma.health_checkup_schedules.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        userName,
        departmentName,
        checkupTypeName,
        medicalInstitutionId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: status || 'scheduled',
        fiscalYear,
        notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '健診予定の登録');
  }
}
