import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load .env file explicitly
config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Tenant
  const tenant = await prisma.tenants.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: '株式会社サンプル',
      timezone: 'Asia/Tokyo',
      closingDay: '末',
      weekStartDay: 1,
      updatedAt: new Date(),
    },
  });
  console.log('✅ Created tenant:', tenant.name);

  // 2. Create Organization Units (会社 → 部門 → 部 → チーム)
  const company = await prisma.org_units.upsert({
    where: { id: 'org-company' },
    update: {},
    create: {
      id: 'org-company',
      tenantId: tenant.id,
      name: '株式会社サンプル',
      type: 'company',
      level: 0,
      memberCount: 50,
      description: '会社全体',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const hrDivision = await prisma.org_units.upsert({
    where: { id: 'org-hr' },
    update: {},
    create: {
      id: 'org-hr',
      tenantId: tenant.id,
      name: '人事部',
      parentId: company.id,
      type: 'division',
      level: 1,
      memberCount: 10,
      description: '人事・総務・労務',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const salesDivision = await prisma.org_units.upsert({
    where: { id: 'org-sales' },
    update: {},
    create: {
      id: 'org-sales',
      tenantId: tenant.id,
      name: '営業部',
      parentId: company.id,
      type: 'division',
      level: 1,
      memberCount: 20,
      description: '営業・マーケティング',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const engineeringDivision = await prisma.org_units.upsert({
    where: { id: 'org-engineering' },
    update: {},
    create: {
      id: 'org-engineering',
      tenantId: tenant.id,
      name: '開発部',
      parentId: company.id,
      type: 'division',
      level: 1,
      memberCount: 20,
      description: 'プロダクト開発',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created organization units');

  // 3. Create Users
  const users = [
    {
      id: 'user-1',
      tenantId: tenant.id,
      email: 'tanaka.taro@example.com',
      name: '田中太郎',
      phone: '090-1234-5678',
      hireDate: new Date('2020-04-01'),
      unitId: hrDivision.id,
      roles: ['employee', 'admin'],
      status: 'active',
      position: '人事部長',
      department: '人事部',
    },
    {
      id: 'user-2',
      tenantId: tenant.id,
      email: 'suzuki.hanako@example.com',
      name: '鈴木花子',
      phone: '090-2345-6789',
      hireDate: new Date('2021-04-01'),
      unitId: hrDivision.id,
      roles: ['employee'],
      status: 'active',
      position: '人事担当',
      department: '人事部',
    },
    {
      id: 'user-3',
      tenantId: tenant.id,
      email: 'sato.ichiro@example.com',
      name: '佐藤一郎',
      phone: '090-3456-7890',
      hireDate: new Date('2019-04-01'),
      unitId: salesDivision.id,
      roles: ['employee', 'manager'],
      status: 'active',
      position: '営業部長',
      department: '営業部',
    },
    {
      id: 'user-4',
      tenantId: tenant.id,
      email: 'yamada.yuki@example.com',
      name: '山田勇気',
      phone: '090-4567-8901',
      hireDate: new Date('2022-04-01'),
      unitId: salesDivision.id,
      roles: ['employee'],
      status: 'active',
      position: '営業担当',
      department: '営業部',
    },
    {
      id: 'user-5',
      tenantId: tenant.id,
      email: 'takahashi.mika@example.com',
      name: '高橋美香',
      phone: '090-5678-9012',
      hireDate: new Date('2018-04-01'),
      unitId: engineeringDivision.id,
      roles: ['employee', 'manager'],
      status: 'active',
      position: 'エンジニアリングマネージャー',
      department: '開発部',
    },
    {
      id: 'user-6',
      tenantId: tenant.id,
      email: 'watanabe.ken@example.com',
      name: '渡辺健',
      phone: '090-6789-0123',
      hireDate: new Date('2021-07-01'),
      unitId: engineeringDivision.id,
      roles: ['employee'],
      status: 'active',
      position: 'シニアエンジニア',
      department: '開発部',
    },
    {
      id: 'user-7',
      tenantId: tenant.id,
      email: 'ito.aoi@example.com',
      name: '伊藤葵',
      phone: '090-7890-1234',
      hireDate: new Date('2023-04-01'),
      unitId: engineeringDivision.id,
      roles: ['employee'],
      status: 'active',
      position: 'ジュニアエンジニア',
      department: '開発部',
    },
    {
      id: 'user-8',
      tenantId: tenant.id,
      email: 'nakamura.rei@example.com',
      name: '中村礼',
      phone: '090-8901-2345',
      hireDate: new Date('2020-10-01'),
      unitId: salesDivision.id,
      roles: ['employee'],
      status: 'active',
      position: '営業担当',
      department: '営業部',
    },
    {
      id: 'user-9',
      tenantId: tenant.id,
      email: 'kobayashi.sora@example.com',
      name: '小林空',
      phone: '090-9012-3456',
      hireDate: new Date('2022-07-01'),
      unitId: hrDivision.id,
      roles: ['employee'],
      status: 'active',
      position: '総務担当',
      department: '人事部',
    },
    {
      id: 'user-10',
      tenantId: tenant.id,
      email: 'kato.riku@example.com',
      name: '加藤陸',
      phone: '090-0123-4567',
      hireDate: new Date('2017-04-01'),
      unitId: company.id,
      roles: ['employee', 'admin'],
      status: 'retired',
      retiredDate: new Date('2024-03-31'),
      retirementReason: 'voluntary',
      position: '元営業部長',
      department: '営業部',
    },
  ];

  for (const userData of users) {
    await prisma.users.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Created ${users.length} users`);

  // 4. Create Attendance Records (過去30日分)
  const attendanceRecords = [];
  const today = new Date();
  const daysToGenerate = 30;

  // 退職者以外のユーザーの勤怠データを生成
  const activeUsers = users.filter(u => u.status === 'active');

  for (let dayOffset = daysToGenerate; dayOffset > 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay(); // 0=日, 6=土

    // 土日はスキップ
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const user of activeUsers) {
      // 90%の確率で出勤
      const isPresent = Math.random() > 0.1;
      if (!isPresent) {
        // 欠勤または休暇
        const isLeave = Math.random() > 0.5;
        const absentDateStr = date.toISOString().split('T')[0];
        attendanceRecords.push({
          id: `att-${user.id}-${absentDateStr}`,
          tenantId: tenant.id,
          userId: user.id,
          date: new Date(date.setHours(0, 0, 0, 0)),
          status: isLeave ? 'leave' : 'absent',
          totalBreakMinutes: 0,
          workMinutes: 0,
          overtimeMinutes: 0,
          workLocation: 'office',
          updatedAt: new Date(),
        });
        continue;
      }

      // 出勤時刻（8:30〜9:30の間）
      const checkInHour = 8 + Math.floor(Math.random() * 2);
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMinute, 0, 0);

      // 遅刻判定（9:30以降）
      const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);

      // 退勤時刻（17:30〜19:30の間）
      const checkOutHour = 17 + Math.floor(Math.random() * 3);
      const checkOutMinute = Math.floor(Math.random() * 60);
      const checkOut = new Date(date);
      checkOut.setHours(checkOutHour, checkOutMinute, 0, 0);

      // 早退判定（18:00前）
      const isEarly = checkOutHour < 18;

      // 休憩時間（12:00〜13:00の60分）
      const breakStart = new Date(date);
      breakStart.setHours(12, 0, 0, 0);
      const breakEnd = new Date(date);
      breakEnd.setHours(13, 0, 0, 0);
      const totalBreakMinutes = 60;

      // 勤務時間計算（分）
      const totalMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
      const workMinutes = totalMinutes - totalBreakMinutes;
      const overtimeMinutes = Math.max(0, workMinutes - 480); // 8時間超過分

      // 勤務場所（80%オフィス、15%在宅、5%客先）
      const rand = Math.random();
      let workLocation = 'office';
      if (rand > 0.95) workLocation = 'client';
      else if (rand > 0.80) workLocation = 'home';

      // ステータス決定
      let status = 'present';
      let approvalStatus = undefined;
      let approvalReason = undefined;

      if (isLate && isEarly) {
        status = 'late';
        approvalStatus = 'pending';
        approvalReason = '遅刻・早退のため承認が必要です';
      } else if (isLate) {
        status = 'late';
        approvalStatus = 'pending';
        approvalReason = '遅刻のため承認が必要です';
      } else if (isEarly) {
        status = 'early';
        approvalStatus = 'pending';
        approvalReason = '早退のため承認が必要です';
      }

      const dateStr = date.toISOString().split('T')[0];
      attendanceRecords.push({
        id: `att-${user.id}-${dateStr}`,
        tenantId: tenant.id,
        userId: user.id,
        date: new Date(date.setHours(0, 0, 0, 0)),
        checkIn,
        checkOut,
        breakStart,
        breakEnd,
        totalBreakMinutes,
        workMinutes,
        overtimeMinutes,
        workLocation,
        status,
        approvalStatus,
        approvalReason,
        updatedAt: new Date(),
      });
    }
  }

  // 勤怠レコードを一括作成
  for (const record of attendanceRecords) {
    await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: record.userId,
          date: record.date,
        },
      },
      update: {},
      create: record,
    });
  }

  console.log(`✅ Created ${attendanceRecords.length} attendance records`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
