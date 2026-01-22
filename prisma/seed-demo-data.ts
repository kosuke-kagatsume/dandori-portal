import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = 'tenant-1'; // 株式会社サンプル

// 部門データ
const departments = [
  { id: 'dept-001', name: '経営企画室' },
  { id: 'dept-002', name: '人事部' },
  { id: 'dept-003', name: '営業部' },
  { id: 'dept-004', name: '開発部' },
  { id: 'dept-005', name: '総務部' },
  { id: 'dept-006', name: 'マーケティング部' },
];

// 役職データ
const positions = [
  { id: 'pos-001', name: '代表取締役', level: 1 },
  { id: 'pos-002', name: '取締役', level: 2 },
  { id: 'pos-003', name: '部長', level: 3 },
  { id: 'pos-004', name: '課長', level: 4 },
  { id: 'pos-005', name: '係長', level: 5 },
  { id: 'pos-006', name: '主任', level: 6 },
  { id: 'pos-007', name: '一般社員', level: 7 },
];

// ユーザーデータ（30人）
const users = [
  // 経営層
  { id: 'user-001', name: '鈴木一郎', email: 'suzuki@demo.dandori-portal.com', department: '経営企画室', position: '代表取締役', role: 'executive' },
  { id: 'user-002', name: '田中美咲', email: 'tanaka.m@demo.dandori-portal.com', department: '経営企画室', position: '取締役', role: 'executive' },

  // 人事部
  { id: 'user-003', name: '山田太郎', email: 'yamada@demo.dandori-portal.com', department: '人事部', position: '部長', role: 'hr' },
  { id: 'user-004', name: '佐藤花子', email: 'sato.h@demo.dandori-portal.com', department: '人事部', position: '課長', role: 'hr' },
  { id: 'user-005', name: '高橋健一', email: 'takahashi@demo.dandori-portal.com', department: '人事部', position: '一般社員', role: 'employee' },

  // 営業部
  { id: 'user-006', name: '伊藤誠', email: 'ito@demo.dandori-portal.com', department: '営業部', position: '部長', role: 'manager' },
  { id: 'user-007', name: '渡辺由美', email: 'watanabe@demo.dandori-portal.com', department: '営業部', position: '課長', role: 'manager' },
  { id: 'user-008', name: '中村大輔', email: 'nakamura@demo.dandori-portal.com', department: '営業部', position: '係長', role: 'employee' },
  { id: 'user-009', name: '小林優子', email: 'kobayashi@demo.dandori-portal.com', department: '営業部', position: '主任', role: 'employee' },
  { id: 'user-010', name: '加藤翔太', email: 'kato@demo.dandori-portal.com', department: '営業部', position: '一般社員', role: 'employee' },
  { id: 'user-011', name: '吉田春香', email: 'yoshida@demo.dandori-portal.com', department: '営業部', position: '一般社員', role: 'employee' },
  { id: 'user-012', name: '山口隆', email: 'yamaguchi@demo.dandori-portal.com', department: '営業部', position: '一般社員', role: 'employee' },

  // 開発部
  { id: 'user-013', name: '松本英樹', email: 'matsumoto@demo.dandori-portal.com', department: '開発部', position: '部長', role: 'manager' },
  { id: 'user-014', name: '井上真理', email: 'inoue@demo.dandori-portal.com', department: '開発部', position: '課長', role: 'manager' },
  { id: 'user-015', name: '木村拓也', email: 'kimura@demo.dandori-portal.com', department: '開発部', position: '係長', role: 'employee' },
  { id: 'user-016', name: '林直樹', email: 'hayashi@demo.dandori-portal.com', department: '開発部', position: '主任', role: 'employee' },
  { id: 'user-017', name: '清水愛', email: 'shimizu@demo.dandori-portal.com', department: '開発部', position: '一般社員', role: 'employee' },
  { id: 'user-018', name: '森田健太', email: 'morita@demo.dandori-portal.com', department: '開発部', position: '一般社員', role: 'employee' },
  { id: 'user-019', name: '阿部さくら', email: 'abe@demo.dandori-portal.com', department: '開発部', position: '一般社員', role: 'employee' },
  { id: 'user-020', name: '池田光', email: 'ikeda@demo.dandori-portal.com', department: '開発部', position: '一般社員', role: 'employee' },
  { id: 'user-021', name: '橋本遼', email: 'hashimoto@demo.dandori-portal.com', department: '開発部', position: '一般社員', role: 'employee' },

  // 総務部
  { id: 'user-022', name: '石川和也', email: 'ishikawa@demo.dandori-portal.com', department: '総務部', position: '部長', role: 'manager' },
  { id: 'user-023', name: '前田美穂', email: 'maeda@demo.dandori-portal.com', department: '総務部', position: '課長', role: 'employee' },
  { id: 'user-024', name: '藤田一樹', email: 'fujita@demo.dandori-portal.com', department: '総務部', position: '一般社員', role: 'employee' },
  { id: 'user-025', name: '岡田恵', email: 'okada@demo.dandori-portal.com', department: '総務部', position: '一般社員', role: 'employee' },

  // マーケティング部
  { id: 'user-026', name: '後藤智子', email: 'goto@demo.dandori-portal.com', department: 'マーケティング部', position: '部長', role: 'manager' },
  { id: 'user-027', name: '長谷川潤', email: 'hasegawa@demo.dandori-portal.com', department: 'マーケティング部', position: '課長', role: 'employee' },
  { id: 'user-028', name: '村上美月', email: 'murakami@demo.dandori-portal.com', department: 'マーケティング部', position: '主任', role: 'employee' },
  { id: 'user-029', name: '近藤大地', email: 'kondo@demo.dandori-portal.com', department: 'マーケティング部', position: '一般社員', role: 'employee' },
  { id: 'user-030', name: '坂本彩', email: 'sakamoto@demo.dandori-portal.com', department: 'マーケティング部', position: '一般社員', role: 'employee' },
];

// SaaSサービスデータ
const saasServices = [
  { id: 'saas-001', name: 'Slack', category: 'コミュニケーション', vendor: 'Slack Technologies', pricePerUser: 1500 },
  { id: 'saas-002', name: 'Google Workspace', category: '生産性ツール', vendor: 'Google', pricePerUser: 1360 },
  { id: 'saas-003', name: 'GitHub', category: '開発ツール', vendor: 'GitHub', pricePerUser: 2100 },
  { id: 'saas-004', name: 'Figma', category: 'デザインツール', vendor: 'Figma', pricePerUser: 1800 },
  { id: 'saas-005', name: 'Salesforce', category: '営業支援', vendor: 'Salesforce', pricePerUser: 18000 },
  { id: 'saas-006', name: 'Notion', category: 'プロジェクト管理', vendor: 'Notion Labs', pricePerUser: 1000 },
  { id: 'saas-007', name: 'Zoom', category: 'コミュニケーション', vendor: 'Zoom Video', pricePerUser: 2200 },
  { id: 'saas-008', name: 'AWS', category: '開発ツール', vendor: 'Amazon', fixedPrice: 350000 },
  { id: 'saas-009', name: 'Jira', category: 'プロジェクト管理', vendor: 'Atlassian', pricePerUser: 1200 },
  { id: 'saas-010', name: 'HubSpot', category: '営業支援', vendor: 'HubSpot', fixedPrice: 96000 },
];

async function main() {
  console.log('🌱 シードデータの投入を開始します...');

  // 1. 部門データ
  console.log('📁 部門データを投入中...');
  for (const dept of departments) {
    await prisma.departments.upsert({
      where: {
        tenantId_name: {
          tenantId: TENANT_ID,
          name: dept.name,
        },
      },
      update: {},
      create: {
        id: dept.id,
        tenantId: TENANT_ID,
        name: dept.name,
        updatedAt: new Date(),
      },
    });
  }

  // 2. 役職データ
  console.log('👔 役職データを投入中...');
  for (const pos of positions) {
    await prisma.positions.upsert({
      where: {
        tenantId_name: {
          tenantId: TENANT_ID,
          name: pos.name,
        },
      },
      update: {},
      create: {
        id: pos.id,
        tenantId: TENANT_ID,
        name: pos.name,
        level: pos.level,
        updatedAt: new Date(),
      },
    });
  }

  // 3. ユーザーデータ
  console.log('👤 ユーザーデータを投入中...');
  const createdUsers: { id: string; name: string; email: string; department: string; position: string; role: string }[] = [];
  for (const user of users) {
    const hireDate = new Date();
    hireDate.setFullYear(hireDate.getFullYear() - Math.floor(Math.random() * 10) - 1);

    const createdUser = await prisma.users.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        department: user.department,
        position: user.position,
        role: user.role,
        roles: [user.role],
      },
      create: {
        id: user.id,
        tenantId: TENANT_ID,
        email: user.email,
        name: user.name,
        department: user.department,
        position: user.position,
        role: user.role,
        roles: [user.role],
        status: 'active',
        hireDate: hireDate,
        updatedAt: new Date(),
      },
    });
    createdUsers.push({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      department: createdUser.department || '',
      position: createdUser.position || '',
      role: createdUser.role || 'employee',
    });
  }
  console.log(`   ${createdUsers.length}人のユーザーを作成/更新しました`)

  // 4. 勤怠データ（過去30日分）
  console.log('⏰ 勤怠データを投入中...');
  const today = new Date();
  let attendanceCount = 0;
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    // 土日はスキップ
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const user of createdUsers) {
      // 90%の確率で出勤
      if (Math.random() > 0.9) continue;

      const checkInHour = 8 + Math.floor(Math.random() * 2);
      const checkInMin = Math.floor(Math.random() * 60);
      const checkOutHour = 17 + Math.floor(Math.random() * 3);
      const checkOutMin = Math.floor(Math.random() * 60);

      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMin, 0, 0);

      const checkOut = new Date(date);
      checkOut.setHours(checkOutHour, checkOutMin, 0, 0);

      const workMinutes = (checkOutHour - checkInHour) * 60 + (checkOutMin - checkInMin) - 60;
      const overtimeMinutes = Math.max(0, workMinutes - 480);

      const attendanceId = `att-${user.id}-${date.toISOString().split('T')[0]}`;

      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: date,
          },
        },
        update: {},
        create: {
          id: attendanceId,
          tenantId: TENANT_ID,
          userId: user.id,
          date: date,
          checkIn: checkIn,
          checkOut: checkOut,
          workMinutes: workMinutes,
          overtimeMinutes: overtimeMinutes,
          status: Math.random() > 0.85 ? 'remote' : 'present',
          updatedAt: new Date(),
        },
      });
      attendanceCount++;
    }
  }
  console.log(`   ${attendanceCount}件の勤怠データを作成/更新しました`)

  // 5. ワークフロー申請データ
  console.log('📝 ワークフロー申請データを投入中...');
  const workflowTypes = ['経費精算', '休暇申請', '出張申請', '備品購入', '残業申請'];
  const workflowStatuses = ['pending', 'approved', 'rejected'];

  for (let i = 0; i < 50; i++) {
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const type = workflowTypes[Math.floor(Math.random() * workflowTypes.length)];
    const status = i < 14 ? 'pending' : workflowStatuses[Math.floor(Math.random() * 3)];
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1);

    await prisma.workflow_requests.upsert({
      where: { id: `wf-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        id: `wf-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        requesterId: user.id,
        requesterName: user.name,
        department: user.department,
        type: type,
        title: `${type} - ${user.name}`,
        description: `${user.name}による${type}申請です。`,
        amount: type === '経費精算' || type === '備品購入' ? Math.floor(Math.random() * 50000) + 5000 : null,
        status: status,
        priority: Math.random() > 0.7 ? 'high' : 'medium',
        dueDate: dueDate,
        createdAt: createdDate,
        updatedAt: new Date(),
      },
    });
  }

  // 6. 有給残高データ
  console.log('🏖️ 有給残高データを投入中...');
  const currentYear = new Date().getFullYear();
  const expiryDate = new Date(`${currentYear + 1}-03-31`);

  for (const user of createdUsers) {
    const paidTotal = 20;
    const paidUsed = Math.floor(Math.random() * 12);

    await prisma.leave_balances.upsert({
      where: {
        userId_year: {
          userId: user.id,
          year: currentYear,
        },
      },
      update: {
        paidLeaveUsed: paidUsed,
        paidLeaveRemaining: paidTotal - paidUsed,
      },
      create: {
        id: `lb-${user.id}-${currentYear}`,
        tenantId: TENANT_ID,
        userId: user.id,
        year: currentYear,
        paidLeaveTotal: paidTotal,
        paidLeaveUsed: paidUsed,
        paidLeaveRemaining: paidTotal - paidUsed,
        paidLeaveExpiry: expiryDate,
        sickLeaveTotal: 10,
        sickLeaveUsed: Math.floor(Math.random() * 3),
        sickLeaveRemaining: 10 - Math.floor(Math.random() * 3),
        specialLeaveTotal: 5,
        specialLeaveUsed: 0,
        specialLeaveRemaining: 5,
        updatedAt: new Date(),
      },
    });
  }

  // 7. 休暇申請データ
  console.log('📅 休暇申請データを投入中...');
  const leaveTypes = ['annual', 'sick', 'special'];

  for (let i = 0; i < 30; i++) {
    const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3));

    const status = startDate < new Date() ? 'approved' : ['pending', 'approved'][Math.floor(Math.random() * 2)];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    await prisma.leave_requests.upsert({
      where: { id: `lr-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        id: `lr-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        userId: user.id,
        userName: user.name,
        type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
        startDate: startDate,
        endDate: endDate,
        days: days,
        reason: '私用のため',
        status: status,
        updatedAt: new Date(),
      },
    });
  }

  // 8. 健康診断データ
  console.log('🏥 健康診断データを投入中...');
  const healthResults = ['A', 'B', 'C', 'D'];
  const fiscalYear = new Date().getFullYear();

  for (const user of createdUsers) {
    const checkupDate = new Date();
    checkupDate.setMonth(checkupDate.getMonth() - Math.floor(Math.random() * 6));

    await prisma.health_checkups.upsert({
      where: { id: `hc-${user.id}` },
      update: {},
      create: {
        id: `hc-${user.id}`,
        tenantId: TENANT_ID,
        userId: user.id,
        userName: user.name,
        checkupDate: checkupDate,
        checkupType: '定期健康診断',
        fiscalYear: fiscalYear,
        overallResult: healthResults[Math.floor(Math.random() * healthResults.length)],
        height: 160 + Math.floor(Math.random() * 30),
        weight: 50 + Math.floor(Math.random() * 40),
        bloodPressureSystolic: 110 + Math.floor(Math.random() * 30),
        bloodPressureDiastolic: 70 + Math.floor(Math.random() * 20),
        updatedAt: new Date(),
      },
    });
  }

  // 9. ストレスチェックデータ
  console.log('😰 ストレスチェックデータを投入中...');
  for (const user of createdUsers) {
    const checkDate = new Date();
    checkDate.setMonth(checkDate.getMonth() - Math.floor(Math.random() * 3));

    const stressFactors = Math.floor(Math.random() * 30) + 20;
    const stressResponse = Math.floor(Math.random() * 30) + 20;
    const socialSupport = Math.floor(Math.random() * 20) + 10;
    const totalScore = stressFactors + stressResponse + socialSupport;

    await prisma.stress_checks.upsert({
      where: {
        tenantId_userId_fiscalYear: {
          tenantId: TENANT_ID,
          userId: user.id,
          fiscalYear: fiscalYear,
        },
      },
      update: {},
      create: {
        id: `sc-${user.id}-${fiscalYear}`,
        tenantId: TENANT_ID,
        userId: user.id,
        userName: user.name,
        fiscalYear: fiscalYear,
        checkDate: checkDate,
        stressFactorsScore: stressFactors,
        stressResponseScore: stressResponse,
        socialSupportScore: socialSupport,
        totalScore: totalScore,
        isHighStress: totalScore >= 70,
        status: 'completed',
        updatedAt: new Date(),
      },
    });
  }

  // 10. PC資産データ
  console.log('💻 PC資産データを投入中...');
  const pcModels = ['MacBook Pro 14"', 'MacBook Air M2', 'ThinkPad X1 Carbon', 'Dell XPS 15', 'Surface Pro 9'];
  for (let i = 0; i < 35; i++) {
    const user = i < 30 ? createdUsers[i] : null;
    const model = pcModels[Math.floor(Math.random() * pcModels.length)];
    const manufacturer = model.includes('Mac') ? 'Apple' : model.includes('ThinkPad') ? 'Lenovo' : model.includes('Dell') ? 'Dell' : 'Microsoft';

    await prisma.pc_assets.upsert({
      where: { id: `pc-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        id: `pc-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        assetNumber: `PC-${String(i + 1).padStart(4, '0')}`,
        manufacturer: manufacturer,
        model: model,
        serialNumber: `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        cpu: model.includes('Mac') ? 'Apple M2' : 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: model.includes('Mac') ? 'macOS' : 'Windows 11',
        assignedUserId: user?.id || null,
        assignedUserName: user?.name || null,
        assignedDate: user ? new Date() : null,
        purchaseDate: new Date('2023-04-01'),
        purchaseCost: 150000 + Math.floor(Math.random() * 100000),
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  // 11. 車両データ
  console.log('🚗 車両データを投入中...');
  const vehicleModels = [
    { make: 'Toyota', model: 'Prius' },
    { make: 'Honda', model: 'Fit' },
    { make: 'Nissan', model: 'Note' },
    { make: 'Toyota', model: 'Corolla' },
    { make: 'Mazda', model: 'CX-5' },
  ];
  const salesUsers = createdUsers.filter(u => u.department === '営業部');

  for (let i = 0; i < 8; i++) {
    const vehicle = vehicleModels[i % vehicleModels.length];
    const salesUser = i < salesUsers.length ? salesUsers[i] : null;

    await prisma.vehicles.upsert({
      where: { id: `veh-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        id: `veh-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        vehicleNumber: `VH-${String(i + 1).padStart(4, '0')}`,
        licensePlate: `品川 500 あ ${1000 + i}`,
        make: vehicle.make,
        model: vehicle.model,
        year: 2022 + Math.floor(Math.random() * 2),
        color: ['ホワイト', 'シルバー', 'ブラック'][Math.floor(Math.random() * 3)],
        assignedUserId: salesUser?.id || null,
        assignedUserName: salesUser?.name || null,
        assignedDate: salesUser ? new Date() : null,
        ownershipType: i < 5 ? 'owned' : 'leased',
        purchaseDate: new Date('2023-01-01'),
        purchaseCost: i < 5 ? 2500000 : null,
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  // 12. 一般資産データ
  console.log('📦 一般資産データを投入中...');
  const generalAssets = [
    { category: '会議室設備', name: 'プロジェクター', cost: 80000 },
    { category: '会議室設備', name: 'モニター 55インチ', cost: 150000 },
    { category: 'オフィス家具', name: '執務デスク', cost: 30000 },
    { category: 'オフィス家具', name: 'オフィスチェア', cost: 50000 },
    { category: '通信機器', name: 'ルーター', cost: 20000 },
  ];
  for (let i = 0; i < 20; i++) {
    const asset = generalAssets[i % generalAssets.length];

    await prisma.general_assets.upsert({
      where: { id: `ga-${String(i + 1).padStart(3, '0')}` },
      update: {},
      create: {
        id: `ga-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        assetNumber: `GA-${String(i + 1).padStart(4, '0')}`,
        category: asset.category,
        name: asset.name,
        purchaseDate: new Date('2023-01-01'),
        purchaseCost: asset.cost,
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  // 13. SaaSサービスデータ
  console.log('☁️ SaaSサービスデータを投入中...');
  const createdServices: { id: string; name: string; pricePerUser?: number; fixedPrice?: number }[] = [];
  for (const service of saasServices) {
    const createdService = await prisma.saas_services.upsert({
      where: {
        tenantId_name: {
          tenantId: TENANT_ID,
          name: service.name,
        },
      },
      update: {},
      create: {
        id: service.id,
        tenantId: TENANT_ID,
        name: service.name,
        category: service.category,
        vendor: service.vendor,
        licenseType: service.fixedPrice ? 'fixed' : 'per_user',
        isActive: true,
        updatedAt: new Date(),
      },
    });
    createdServices.push({
      id: createdService.id,
      name: createdService.name,
      pricePerUser: service.pricePerUser,
      fixedPrice: service.fixedPrice,
    });

    // プランデータ
    await prisma.saas_license_plans.upsert({
      where: { id: `plan-${createdService.id}` },
      update: {},
      create: {
        id: `plan-${createdService.id}`,
        tenantId: TENANT_ID,
        serviceId: createdService.id,
        planName: 'Standard',
        billingCycle: 'monthly',
        pricePerUser: service.pricePerUser || null,
        fixedPrice: service.fixedPrice || null,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  // 14. SaaSライセンス割り当て
  console.log('🔑 SaaSライセンス割り当てを投入中...');
  // createdServicesの名前で検索してIDを取得するマップを作成
  const serviceIdMap: Record<string, string> = {};
  for (const s of createdServices) {
    serviceIdMap[s.name] = s.id;
  }

  const serviceAssignments: Record<string, string[]> = {};
  // Slack - 全員
  if (serviceIdMap['Slack']) serviceAssignments[serviceIdMap['Slack']] = createdUsers.map(u => u.id);
  // Google Workspace - 全員
  if (serviceIdMap['Google Workspace']) serviceAssignments[serviceIdMap['Google Workspace']] = createdUsers.map(u => u.id);
  // GitHub - 開発部のみ
  if (serviceIdMap['GitHub']) serviceAssignments[serviceIdMap['GitHub']] = createdUsers.filter(u => u.department === '開発部').map(u => u.id);
  // Figma - 開発部とマーケ
  if (serviceIdMap['Figma']) serviceAssignments[serviceIdMap['Figma']] = createdUsers.filter(u => u.department === '開発部' || u.department === 'マーケティング部').map(u => u.id);
  // Salesforce - 営業部のみ
  if (serviceIdMap['Salesforce']) serviceAssignments[serviceIdMap['Salesforce']] = createdUsers.filter(u => u.department === '営業部').map(u => u.id);
  // Notion - 全員
  if (serviceIdMap['Notion']) serviceAssignments[serviceIdMap['Notion']] = createdUsers.map(u => u.id);
  // Zoom - 一部の部門
  if (serviceIdMap['Zoom']) serviceAssignments[serviceIdMap['Zoom']] = createdUsers.filter(u => ['経営企画室', '人事部', '営業部', 'マーケティング部'].includes(u.department)).map(u => u.id);
  // Jira - 開発部のみ
  if (serviceIdMap['Jira']) serviceAssignments[serviceIdMap['Jira']] = createdUsers.filter(u => u.department === '開発部').map(u => u.id);

  let assignmentId = 1;
  for (const [serviceId, userIds] of Object.entries(serviceAssignments)) {
    for (const userId of userIds) {
      const user = createdUsers.find(u => u.id === userId)!;
      await prisma.saas_license_assignments.upsert({
        where: { id: `sla-${String(assignmentId).padStart(4, '0')}` },
        update: {},
        create: {
          id: `sla-${String(assignmentId).padStart(4, '0')}`,
          tenantId: TENANT_ID,
          serviceId: serviceId,
          planId: `plan-${serviceId}`,
          userId: userId,
          userName: user.name,
          userEmail: user.email,
          departmentName: user.department,
          status: 'active',
          assignedDate: new Date(),
          updatedAt: new Date(),
        },
      });
      assignmentId++;
    }
  }

  // 15. SaaS月次コストデータ（過去6ヶ月）
  console.log('💰 SaaS月次コストデータを投入中...');
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    for (const service of createdServices) {
      const assignments = serviceAssignments[service.id] || [];
      const userCount = assignments.length;
      const userCost = (service.pricePerUser || 0) * userCount;
      const fixedCost = service.fixedPrice || 0;
      const totalCost = userCost + fixedCost;

      // 少し変動をつける
      const variance = 1 + (Math.random() * 0.1 - 0.05);

      await prisma.saas_monthly_costs.upsert({
        where: {
          serviceId_period: {
            serviceId: service.id,
            period: period,
          },
        },
        update: {},
        create: {
          id: `smc-${service.id}-${period}`,
          tenantId: TENANT_ID,
          serviceId: service.id,
          period: period,
          userLicenseCount: userCount,
          userLicenseCost: Math.round(userCost * variance),
          fixedCost: fixedCost,
          totalCost: Math.round(totalCost * variance),
          updatedAt: new Date(),
        },
      });
    }
  }

  console.log('✅ シードデータの投入が完了しました！');
  console.log(`
📊 投入されたデータ:
- 部門: ${departments.length}件
- 役職: ${positions.length}件
- ユーザー: ${users.length}人
- 勤怠: 約${users.length * 22}件（30日分）
- ワークフロー申請: 50件
- 有給残高: ${users.length}件
- 休暇申請: 30件
- 健康診断: ${users.length}件
- ストレスチェック: ${users.length}件
- PC資産: 35台
- 車両: 8台
- 一般資産: 20件
- SaaSサービス: ${saasServices.length}件
- SaaSライセンス割り当て: 多数
- SaaS月次コスト: ${saasServices.length * 6}件
  `);
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
