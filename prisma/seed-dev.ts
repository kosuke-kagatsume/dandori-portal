import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 既存テナント tenant-006 (subdomain: dandori-work) を使用
const TENANT_ID = 'tenant-006';
// bcrypt hash of 'dandori2026'
const PASSWORD_HASH = '$2b$10$rVi8tYJme3yciDupDVM86uvOs0s85TuipKL34K.y0bEi1Qjl2pjPq';

// 本番組織構造に合わせた部署
const DEPARTMENTS = [
  { id: 'dev-dept-corporate', code: 'CORP', name: 'コーポレート', sortOrder: 1 },
  { id: 'dev-dept-sales', code: 'SALES', name: '営業本部', sortOrder: 2 },
  { id: 'dev-dept-support', code: 'SUP', name: 'サポート', sortOrder: 3 },
  { id: 'dev-dept-product', code: 'PROD', name: 'プロダクト', sortOrder: 4 },
  { id: 'dev-dept-is', code: 'IS', name: 'インサイドセールス', sortOrder: 5 },
  { id: 'dev-dept-hq', code: 'HQ', name: '企画管理本部', sortOrder: 6 },
];

// 本番組織構造に合わせた役職
const POSITIONS = [
  { id: 'dev-pos-executive', name: '役員', level: 5, sortOrder: 1 },
  { id: 'dev-pos-sysadmin', name: 'システム管理者', level: 4, sortOrder: 2 },
  { id: 'dev-pos-manager', name: 'マネージャー', level: 3, sortOrder: 3 },
  { id: 'dev-pos-staff', name: '担当者', level: 2, sortOrder: 4 },
  { id: 'dev-pos-member', name: 'メンバー', level: 1, sortOrder: 5 },
];

const USERS = [
  {
    id: 'dev-user-admin',
    email: 'admin@dandori-work.dev',
    name: 'Dev管理者',
    roles: ['admin', 'hr'],
    role: 'admin',
    department: 'コーポレート',
    position: 'システム管理者',
    employeeNumber: 'D001',
    birthDate: new Date('1985-06-15'),
    gender: 'male',
  },
  {
    id: 'dev-user-hr',
    email: 'hr@dandori-work.dev',
    name: 'Dev人事',
    roles: ['hr'],
    role: 'hr',
    department: 'コーポレート',
    position: '担当者',
    employeeNumber: 'D002',
    birthDate: new Date('1990-03-22'),
    gender: 'female',
  },
  {
    id: 'dev-user-executive',
    email: 'executive@dandori-work.dev',
    name: 'Dev役員',
    roles: ['executive'],
    role: 'executive',
    department: '企画管理本部',
    position: '役員',
    employeeNumber: 'D003',
    birthDate: new Date('1978-11-08'),
    gender: 'male',
  },
  {
    id: 'dev-user-manager',
    email: 'manager@dandori-work.dev',
    name: 'Dev営業部長',
    roles: ['manager'],
    role: 'manager',
    department: '営業本部',
    position: 'マネージャー',
    employeeNumber: 'D004',
    birthDate: new Date('1988-09-03'),
    gender: 'male',
  },
  {
    id: 'dev-user-emp1',
    email: 'employee@dandori-work.dev',
    name: 'Devサポート社員',
    roles: ['employee'],
    role: 'employee',
    department: 'サポート',
    position: 'メンバー',
    employeeNumber: 'D005',
    birthDate: new Date('1995-01-20'),
    gender: 'female',
  },
  {
    id: 'dev-user-emp2',
    email: 'employee2@dandori-work.dev',
    name: 'Devプロダクト社員',
    roles: ['employee'],
    role: 'employee',
    department: 'プロダクト',
    position: 'メンバー',
    employeeNumber: 'D006',
    birthDate: new Date('1992-07-14'),
    gender: 'male',
  },
  {
    id: 'dev-user-emp3',
    email: 'employee3@dandori-work.dev',
    name: 'DevIS社員',
    roles: ['employee'],
    role: 'employee',
    department: 'インサイドセールス',
    position: 'メンバー',
    employeeNumber: 'D007',
    birthDate: new Date('1997-12-01'),
    gender: 'female',
  },
  {
    id: 'dev-user-applicant',
    email: 'applicant@dandori-work.dev',
    name: 'Dev入社予定',
    roles: ['employee'],
    role: 'employee',
    department: 'コーポレート',
    position: 'メンバー',
    employeeNumber: 'D008',
    birthDate: new Date('2000-04-10'),
    gender: 'male',
  },
];

async function main() {
  console.log('🌱 Dev環境シードデータ投入開始...');

  // テナント tenant-006 が存在するか確認（作成はしない）
  const tenant = await prisma.tenants.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) {
    throw new Error(`テナント ${TENANT_ID} が存在しません。先にメインシードを実行してください。`);
  }
  console.log('✅ テナント確認:', tenant.name, `(${tenant.subdomain})`);

  // 部署作成（upsert）
  for (const dept of DEPARTMENTS) {
    await prisma.departments.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: dept.code } },
      update: { name: dept.name, sortOrder: dept.sortOrder },
      create: {
        id: dept.id,
        tenantId: TENANT_ID,
        code: dept.code,
        name: dept.name,
        sortOrder: dept.sortOrder,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`✅ 部署作成/更新: ${DEPARTMENTS.length}部署`);

  // 役職作成（upsert）
  for (const pos of POSITIONS) {
    await prisma.positions.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name: pos.name } },
      update: { level: pos.level, sortOrder: pos.sortOrder },
      create: {
        id: pos.id,
        tenantId: TENANT_ID,
        name: pos.name,
        level: pos.level,
        sortOrder: pos.sortOrder,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`✅ 役職作成/更新: ${POSITIONS.length}役職`);

  // ユーザー作成（upsert）
  for (const userData of USERS) {
    await prisma.users.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        roles: userData.roles,
        role: userData.role,
        department: userData.department,
        position: userData.position,
        employeeNumber: userData.employeeNumber,
        birthDate: userData.birthDate,
        gender: userData.gender,
        passwordHash: PASSWORD_HASH,
      },
      create: {
        id: userData.id,
        tenantId: TENANT_ID,
        email: userData.email,
        name: userData.name,
        roles: userData.roles,
        role: userData.role,
        passwordHash: PASSWORD_HASH,
        status: 'active',
        hireDate: new Date('2024-04-01'),
        department: userData.department,
        position: userData.position,
        employeeNumber: userData.employeeNumber,
        birthDate: userData.birthDate,
        gender: userData.gender,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`✅ ユーザー作成/更新: ${USERS.length}名（パスワード: dandori2026）`);

  // 勤怠データ作成（過去30日分）
  const today = new Date();
  let attendanceCount = 0;

  for (let dayOffset = 30; dayOffset > 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay();

    // 土日スキップ
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const user of USERS) {
      // 90%出勤
      if (Math.random() > 0.9) continue;

      const checkInHour = 8 + Math.floor(Math.random() * 2);
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMinute, 0, 0);

      const checkOutHour = 17 + Math.floor(Math.random() * 3);
      const checkOutMinute = Math.floor(Math.random() * 60);
      const checkOut = new Date(date);
      checkOut.setHours(checkOutHour, checkOutMinute, 0, 0);

      const breakStart = new Date(date);
      breakStart.setHours(12, 0, 0, 0);
      const breakEnd = new Date(date);
      breakEnd.setHours(13, 0, 0, 0);

      const totalMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
      const workMinutes = totalMinutes - 60;
      const overtimeMinutes = Math.max(0, workMinutes - 480);

      const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);

      const rand = Math.random();
      const workLocation = rand > 0.95 ? 'client' : rand > 0.80 ? 'home' : 'office';

      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      const dateStr = dateOnly.toISOString().split('T')[0];

      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: dateOnly,
          },
        },
        update: {},
        create: {
          id: `dev-att-${user.id}-${dateStr}`,
          tenantId: TENANT_ID,
          userId: user.id,
          date: dateOnly,
          checkIn,
          checkOut,
          breakStart,
          breakEnd,
          totalBreakMinutes: 60,
          workMinutes,
          overtimeMinutes,
          workLocation,
          status: isLate ? 'late' : 'present',
          updatedAt: new Date(),
        },
      });
      attendanceCount++;
    }
  }
  console.log(`✅ 勤怠データ作成: ${attendanceCount}件`);

  console.log('🎉 Dev環境シードデータ投入完了！');
  console.log('');
  console.log('📋 ログイン情報:');
  console.log('  テナント: dandori-work（サブドメイン）');
  console.log('  パスワード: dandori2026（全ユーザー共通）');
  console.log('  admin@dandori-work.dev     - Dev管理者（admin+hr）');
  console.log('  hr@dandori-work.dev         - Dev人事（hr）');
  console.log('  executive@dandori-work.dev  - Dev役員（executive）');
  console.log('  manager@dandori-work.dev    - Dev営業部長（manager）');
  console.log('  employee@dandori-work.dev   - Devサポート社員（employee）');
  console.log('  employee2@dandori-work.dev  - Devプロダクト社員（employee）');
  console.log('  employee3@dandori-work.dev  - DevIS社員（employee）');
  console.log('  applicant@dandori-work.dev  - Dev入社予定（employee）');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
