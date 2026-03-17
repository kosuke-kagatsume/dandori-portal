import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = 'dandori-work-tenant';
// bcrypt hash of 'dandori2026'
const PASSWORD_HASH = '$2b$10$rVi8tYJme3yciDupDVM86uvOs0s85TuipKL34K.y0bEi1Qjl2pjPq';

const DEPARTMENTS = [
  { id: 'dev-dept-corporate', code: 'CORP', name: 'コーポレート部', sortOrder: 1 },
  { id: 'dev-dept-sales', code: 'SALES', name: '営業部', sortOrder: 2 },
  { id: 'dev-dept-dev', code: 'DEV', name: '開発部', sortOrder: 3 },
  { id: 'dev-dept-general', code: 'GA', name: '総務部', sortOrder: 4 },
];

const POSITIONS = [
  { id: 'dev-pos-ceo', name: '代表取締役', level: 5, sortOrder: 1 },
  { id: 'dev-pos-director', name: '部長', level: 4, sortOrder: 2 },
  { id: 'dev-pos-manager', name: '課長', level: 3, sortOrder: 3 },
  { id: 'dev-pos-senior', name: '担当者', level: 2, sortOrder: 4 },
  { id: 'dev-pos-staff', name: '一般社員', level: 1, sortOrder: 5 },
];

const USERS = [
  {
    id: 'dev-user-admin',
    email: 'admin@dandori-work.dev',
    name: '管理太郎',
    roles: ['employee', 'admin'],
    role: 'admin',
    departmentId: 'dev-dept-corporate',
    positionId: 'dev-pos-ceo',
    department: 'コーポレート部',
    position: '代表取締役',
    unitId: 'dev-org-corporate',
  },
  {
    id: 'dev-user-hr',
    email: 'hr@dandori-work.dev',
    name: '人事花子',
    roles: ['employee', 'hr'],
    role: 'hr',
    departmentId: 'dev-dept-corporate',
    positionId: 'dev-pos-senior',
    department: 'コーポレート部',
    position: '担当者',
    unitId: 'dev-org-corporate',
  },
  {
    id: 'dev-user-manager',
    email: 'manager@dandori-work.dev',
    name: '営業部長',
    roles: ['employee', 'manager'],
    role: 'manager',
    departmentId: 'dev-dept-sales',
    positionId: 'dev-pos-director',
    department: '営業部',
    position: '部長',
    unitId: 'dev-org-sales',
  },
  {
    id: 'dev-user-emp1',
    email: 'employee@dandori-work.dev',
    name: '社員一郎',
    roles: ['employee'],
    role: 'employee',
    departmentId: 'dev-dept-dev',
    positionId: 'dev-pos-staff',
    department: '開発部',
    position: '一般社員',
    unitId: 'dev-org-dev',
  },
  {
    id: 'dev-user-emp2',
    email: 'employee2@dandori-work.dev',
    name: '社員二郎',
    roles: ['employee'],
    role: 'employee',
    departmentId: 'dev-dept-sales',
    positionId: 'dev-pos-staff',
    department: '営業部',
    position: '一般社員',
    unitId: 'dev-org-sales',
  },
  {
    id: 'dev-user-emp3',
    email: 'employee3@dandori-work.dev',
    name: '社員三子',
    roles: ['employee'],
    role: 'employee',
    departmentId: 'dev-dept-general',
    positionId: 'dev-pos-staff',
    department: '総務部',
    position: '一般社員',
    unitId: 'dev-org-general',
  },
  {
    id: 'dev-user-executive',
    email: 'executive@dandori-work.dev',
    name: '経営太郎',
    roles: ['employee', 'executive'],
    role: 'executive',
    departmentId: 'dev-dept-corporate',
    positionId: 'dev-pos-ceo',
    department: 'コーポレート部',
    position: '代表取締役',
    unitId: 'dev-org-corporate',
  },
  {
    id: 'dev-user-applicant',
    email: 'applicant@dandori-work.dev',
    name: '新入花子',
    roles: ['applicant'],
    role: 'applicant',
    departmentId: 'dev-dept-dev',
    positionId: 'dev-pos-staff',
    department: '開発部',
    position: '一般社員',
    unitId: 'dev-org-dev',
  },
];

async function main() {
  console.log('🌱 Dev環境シードデータ投入開始...');

  // 1. テナント作成
  const tenant = await prisma.tenants.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: '株式会社ダンドリワーク',
      subdomain: 'dandori-work',
      timezone: 'Asia/Tokyo',
      closingDay: '末',
      weekStartDay: 1,
      updatedAt: new Date(),
    },
  });
  console.log('✅ テナント作成:', tenant.name);

  // 2. 組織ユニット作成（会社 → 各部門）
  const company = await prisma.org_units.upsert({
    where: { id: 'dev-org-company' },
    update: {},
    create: {
      id: 'dev-org-company',
      tenantId: TENANT_ID,
      name: '株式会社ダンドリワーク',
      type: 'company',
      level: 0,
      memberCount: 6,
      description: '会社全体',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const orgUnits = [
    { id: 'dev-org-corporate', name: 'コーポレート部', memberCount: 2 },
    { id: 'dev-org-sales', name: '営業部', memberCount: 2 },
    { id: 'dev-org-dev', name: '開発部', memberCount: 1 },
    { id: 'dev-org-general', name: '総務部', memberCount: 1 },
  ];

  for (const unit of orgUnits) {
    await prisma.org_units.upsert({
      where: { id: unit.id },
      update: {},
      create: {
        id: unit.id,
        tenantId: TENANT_ID,
        name: unit.name,
        parentId: company.id,
        type: 'division',
        level: 1,
        memberCount: unit.memberCount,
        description: unit.name,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  console.log('✅ 組織ユニット作成: 会社 + 4部門');

  // 3. 部署作成
  for (const dept of DEPARTMENTS) {
    await prisma.departments.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: dept.code } },
      update: {},
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
  console.log('✅ 部署作成: 4部署');

  // 4. 役職作成
  for (const pos of POSITIONS) {
    await prisma.positions.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name: pos.name } },
      update: {},
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
  console.log('✅ 役職作成: 5役職');

  // 5. ユーザー作成
  for (const userData of USERS) {
    await prisma.users.upsert({
      where: { email: userData.email },
      update: {},
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
        unitId: userData.unitId,
        departmentId: userData.departmentId,
        positionId: userData.positionId,
        department: userData.department,
        position: userData.position,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`✅ ユーザー作成: ${USERS.length}名（パスワード: dandori2026）`);

  // 6. 勤怠データ作成（過去30日分）
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
  console.log('  admin@dandori-work.dev  - 管理太郎（admin）');
  console.log('  hr@dandori-work.dev     - 人事花子（hr）');
  console.log('  manager@dandori-work.dev - 営業部長（manager）');
  console.log('  employee@dandori-work.dev - 社員一郎（employee）');
  console.log('  employee2@dandori-work.dev - 社員二郎（employee）');
  console.log('  employee3@dandori-work.dev - 社員三子（employee）');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
