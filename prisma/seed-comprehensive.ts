import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_ID = 'tenant-1';
const DEFAULT_PASSWORD = 'Demo1234!';

// 部門データ
const departments = [
  { id: 'dept-01', name: '経営企画室', description: '経営戦略・企画立案' },
  { id: 'dept-02', name: '人事部', description: '採用・労務・人材開発' },
  { id: 'dept-03', name: '総務部', description: '総務・法務・庶務' },
  { id: 'dept-04', name: '経理部', description: '経理・財務・予算管理' },
  { id: 'dept-05', name: '営業部', description: '法人営業・新規開拓' },
  { id: 'dept-06', name: '開発部', description: 'システム開発・保守' },
  { id: 'dept-07', name: 'マーケティング部', description: '広報・宣伝・ブランディング' },
];

// 役職データ
const positions = [
  { id: 'pos-01', name: '代表取締役', level: 1 },
  { id: 'pos-02', name: '取締役', level: 2 },
  { id: 'pos-03', name: '部長', level: 3 },
  { id: 'pos-04', name: '課長', level: 4 },
  { id: 'pos-05', name: '係長', level: 5 },
  { id: 'pos-06', name: '主任', level: 6 },
  { id: 'pos-07', name: '一般社員', level: 7 },
];

// ユーザーデータ（35人）
const users = [
  // 経営企画室 (3名)
  { id: 'user-01', name: '鈴木一郎', email: 'suzuki@sample.co.jp', department: '経営企画室', position: '代表取締役', role: 'executive', roles: ['executive', 'admin'] },
  { id: 'user-02', name: '田中美咲', email: 'tanaka.m@sample.co.jp', department: '経営企画室', position: '取締役', role: 'executive', roles: ['executive'] },
  { id: 'user-03', name: '山本健太', email: 'yamamoto@sample.co.jp', department: '経営企画室', position: '課長', role: 'manager', roles: ['manager'] },

  // 人事部 (5名)
  { id: 'user-04', name: '佐藤太郎', email: 'sato@sample.co.jp', department: '人事部', position: '部長', role: 'hr', roles: ['hr', 'manager'] },
  { id: 'user-05', name: '高橋花子', email: 'takahashi@sample.co.jp', department: '人事部', position: '課長', role: 'hr', roles: ['hr'] },
  { id: 'user-06', name: '伊藤誠', email: 'ito.m@sample.co.jp', department: '人事部', position: '主任', role: 'hr', roles: ['hr'] },
  { id: 'user-07', name: '渡辺由美', email: 'watanabe@sample.co.jp', department: '人事部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-08', name: '中村大輔', email: 'nakamura@sample.co.jp', department: '人事部', position: '一般社員', role: 'employee', roles: ['employee'] },

  // 総務部 (4名)
  { id: 'user-09', name: '小林優子', email: 'kobayashi@sample.co.jp', department: '総務部', position: '部長', role: 'manager', roles: ['manager'] },
  { id: 'user-10', name: '加藤翔太', email: 'kato@sample.co.jp', department: '総務部', position: '課長', role: 'manager', roles: ['manager'] },
  { id: 'user-11', name: '吉田春香', email: 'yoshida@sample.co.jp', department: '総務部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-12', name: '山口隆', email: 'yamaguchi@sample.co.jp', department: '総務部', position: '一般社員', role: 'employee', roles: ['employee'] },

  // 経理部 (4名)
  { id: 'user-13', name: '松本英樹', email: 'matsumoto@sample.co.jp', department: '経理部', position: '部長', role: 'manager', roles: ['manager'] },
  { id: 'user-14', name: '井上真理', email: 'inoue@sample.co.jp', department: '経理部', position: '課長', role: 'manager', roles: ['manager'] },
  { id: 'user-15', name: '木村拓也', email: 'kimura@sample.co.jp', department: '経理部', position: '主任', role: 'employee', roles: ['employee'] },
  { id: 'user-16', name: '林直樹', email: 'hayashi@sample.co.jp', department: '経理部', position: '一般社員', role: 'employee', roles: ['employee'] },

  // 営業部 (8名)
  { id: 'user-17', name: '清水愛', email: 'shimizu@sample.co.jp', department: '営業部', position: '部長', role: 'manager', roles: ['manager'] },
  { id: 'user-18', name: '森田健太', email: 'morita@sample.co.jp', department: '営業部', position: '課長', role: 'manager', roles: ['manager'] },
  { id: 'user-19', name: '阿部さくら', email: 'abe@sample.co.jp', department: '営業部', position: '係長', role: 'employee', roles: ['employee'] },
  { id: 'user-20', name: '池田光', email: 'ikeda@sample.co.jp', department: '営業部', position: '主任', role: 'employee', roles: ['employee'] },
  { id: 'user-21', name: '橋本遼', email: 'hashimoto@sample.co.jp', department: '営業部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-22', name: '石川和也', email: 'ishikawa@sample.co.jp', department: '営業部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-23', name: '前田美穂', email: 'maeda@sample.co.jp', department: '営業部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-24', name: '藤田一樹', email: 'fujita@sample.co.jp', department: '営業部', position: '一般社員', role: 'employee', roles: ['employee'] },

  // 開発部 (8名)
  { id: 'user-25', name: '岡田恵', email: 'okada@sample.co.jp', department: '開発部', position: '部長', role: 'manager', roles: ['manager'] },
  { id: 'user-26', name: '後藤智子', email: 'goto@sample.co.jp', department: '開発部', position: '課長', role: 'manager', roles: ['manager'] },
  { id: 'user-27', name: '長谷川潤', email: 'hasegawa@sample.co.jp', department: '開発部', position: '係長', role: 'employee', roles: ['employee'] },
  { id: 'user-28', name: '村上美月', email: 'murakami@sample.co.jp', department: '開発部', position: '主任', role: 'employee', roles: ['employee'] },
  { id: 'user-29', name: '近藤大地', email: 'kondo@sample.co.jp', department: '開発部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-30', name: '坂本彩', email: 'sakamoto@sample.co.jp', department: '開発部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-31', name: '遠藤拓海', email: 'endo@sample.co.jp', department: '開発部', position: '一般社員', role: 'employee', roles: ['employee'] },
  { id: 'user-32', name: '青木理沙', email: 'aoki@sample.co.jp', department: '開発部', position: '一般社員', role: 'employee', roles: ['employee'] },

  // マーケティング部 (3名)
  { id: 'user-33', name: '藤井康介', email: 'fujii@sample.co.jp', department: 'マーケティング部', position: '部長', role: 'manager', roles: ['manager'] },
  { id: 'user-34', name: '西村香織', email: 'nishimura@sample.co.jp', department: 'マーケティング部', position: '主任', role: 'employee', roles: ['employee'] },
  { id: 'user-35', name: '原田翼', email: 'harada@sample.co.jp', department: 'マーケティング部', position: '一般社員', role: 'employee', roles: ['employee'] },
];

// お知らせデータ
const announcements = [
  { id: 'ann-01', title: '年末年始休業のお知らせ', content: '12月28日（土）～1月5日（日）まで年末年始休業とさせていただきます。ご不便をおかけしますが、よろしくお願いいたします。', type: 'general', priority: 'high', startDate: new Date('2024-12-20'), publishedAt: new Date('2024-12-20') },
  { id: 'ann-02', title: '健康診断実施のご案内', content: '来月15日より定期健康診断を実施します。対象者は全社員となります。詳細は人事部からの案内をご確認ください。', type: 'general', priority: 'high', startDate: new Date('2024-12-15'), publishedAt: new Date('2024-12-15') },
  { id: 'ann-03', title: '新入社員歓迎会のお知らせ', content: '4月入社の新入社員歓迎会を4月10日（金）18時より開催します。参加希望の方は総務部までご連絡ください。', type: 'event', priority: 'normal', startDate: new Date('2024-12-10'), publishedAt: new Date('2024-12-10') },
  { id: 'ann-04', title: '社内システムメンテナンスのお知らせ', content: '1月15日（土）22時～翌6時まで、社内システムのメンテナンスを実施します。この間、一部サービスがご利用いただけません。', type: 'system', priority: 'normal', startDate: new Date('2024-12-08'), publishedAt: new Date('2024-12-08') },
  { id: 'ann-05', title: '交通費精算ルール変更について', content: '来月より交通費精算のルールが変更になります。詳細は経理部からの通知をご確認ください。', type: 'policy', priority: 'normal', startDate: new Date('2024-12-05'), publishedAt: new Date('2024-12-05') },
  { id: 'ann-06', title: 'リモートワーク制度拡充のお知らせ', content: '社員の働き方改革の一環として、リモートワーク制度を拡充します。週3日までリモートワークが可能となります。', type: 'policy', priority: 'high', startDate: new Date('2024-12-01'), publishedAt: new Date('2024-12-01') },
  { id: 'ann-07', title: '忘年会開催のお知らせ', content: '12月20日（金）19時より、全社忘年会を開催します。会場は後日連絡いたします。', type: 'event', priority: 'low', startDate: new Date('2024-11-25'), publishedAt: new Date('2024-11-25') },
  { id: 'ann-08', title: 'セキュリティ研修受講のお願い', content: '情報セキュリティ研修の受講をお願いします。12月末までに全員受講完了となりますようご協力ください。', type: 'important', priority: 'high', startDate: new Date('2024-11-20'), publishedAt: new Date('2024-11-20') },
];

// ワークフロー申請タイプ
const workflowTypes = ['経費精算', '休暇申請', '出張申請', '備品購入申請', '残業申請', '在宅勤務申請', '研修参加申請'];

async function main() {
  console.log('🌱 包括的シードデータの投入を開始します...');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. 既存データのクリーンアップ（tenant-1のみ）
  console.log('🧹 既存データをクリーンアップ中...');
  await prisma.saas_license_assignments.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.saas_monthly_costs.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.saas_license_plans.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.saas_services.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.workflow_requests.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.leave_requests.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.leave_balances.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.health_checkups.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.stress_checks.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.attendance.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.announcements.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.pc_assets.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.vehicles.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.general_assets.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.users.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.positions.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.departments.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.org_units.deleteMany({ where: { tenantId: TENANT_ID } });

  // 2. テナント確認/作成
  console.log('🏢 テナントを確認/作成中...');
  await prisma.tenants.upsert({
    where: { id: TENANT_ID },
    update: { name: '株式会社サンプル' },
    create: {
      id: TENANT_ID,
      name: '株式会社サンプル',
      timezone: 'Asia/Tokyo',
      closingDay: '末',
      weekStartDay: 1,
      updatedAt: new Date(),
    },
  });

  // 3. 組織単位
  console.log('🏛️ 組織単位を作成中...');
  await prisma.org_units.create({
    data: {
      id: 'org-company',
      tenantId: TENANT_ID,
      name: '株式会社サンプル',
      type: 'company',
      level: 0,
      memberCount: 35,
      description: '会社全体',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // 4. 部門データ
  console.log('📁 部門データを投入中...');
  for (const dept of departments) {
    await prisma.departments.create({
      data: {
        id: dept.id,
        tenantId: TENANT_ID,
        name: dept.name,
        updatedAt: new Date(),
      },
    });

    // org_unitsにも追加
    await prisma.org_units.create({
      data: {
        id: `org-${dept.id}`,
        tenantId: TENANT_ID,
        name: dept.name,
        parentId: 'org-company',
        type: 'division',
        level: 1,
        memberCount: users.filter(u => u.department === dept.name).length,
        description: dept.description,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  // 5. 役職データ
  console.log('👔 役職データを投入中...');
  for (const pos of positions) {
    await prisma.positions.create({
      data: {
        id: pos.id,
        tenantId: TENANT_ID,
        name: pos.name,
        level: pos.level,
        updatedAt: new Date(),
      },
    });
  }

  // 6. ユーザーデータ
  console.log('👤 ユーザーデータを投入中...');
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const hireYear = 2015 + Math.floor(Math.random() * 9); // 2015-2023
    const hireMonth = Math.floor(Math.random() * 12) + 1;
    const hireDate = new Date(`${hireYear}-${String(hireMonth).padStart(2, '0')}-01`);
    const orgUnit = departments.find(d => d.name === user.department);

    await prisma.users.create({
      data: {
        id: user.id,
        tenantId: TENANT_ID,
        email: user.email,
        name: user.name,
        department: user.department,
        position: user.position,
        role: user.role,
        roles: user.roles,
        status: 'active',
        hireDate: hireDate,
        phone: `090-${String(1000 + i).padStart(4, '0')}-${String(5000 + i).padStart(4, '0')}`,
        unitId: orgUnit ? `org-${orgUnit.id}` : 'org-company',
        passwordHash: passwordHash,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`   ${users.length}人のユーザーを作成しました`);

  // 7. お知らせデータ
  console.log('📢 お知らせデータを投入中...');
  for (const ann of announcements) {
    await prisma.announcements.create({
      data: {
        id: ann.id,
        tenantId: TENANT_ID,
        title: ann.title,
        content: ann.content,
        type: ann.type,
        priority: ann.priority,
        published: true,
        publishedAt: ann.publishedAt,
        startDate: ann.startDate,
        createdBy: 'user-04', // 人事部長
        updatedAt: new Date(),
      },
    });
  }

  // 8. 勤怠データ（過去60日分）
  console.log('⏰ 勤怠データを投入中...');
  const today = new Date();
  let attendanceCount = 0;

  for (let dayOffset = 60; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    // 土日スキップ
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const user of users) {
      // 95%出勤
      if (Math.random() > 0.95) continue;

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
      const isLate = checkInHour >= 9 && checkInMin > 30;
      const workLocation = Math.random() > 0.7 ? 'home' : 'office';

      const dateStr = date.toISOString().split('T')[0];
      await prisma.attendance.create({
        data: {
          id: `att-${user.id}-${dateStr}`,
          tenantId: TENANT_ID,
          userId: user.id,
          date: date,
          checkIn: checkIn,
          checkOut: checkOut,
          workMinutes: workMinutes,
          overtimeMinutes: overtimeMinutes,
          totalBreakMinutes: 60,
          status: isLate ? 'late' : 'present',
          workLocation: workLocation,
          updatedAt: new Date(),
        },
      });
      attendanceCount++;
    }
  }
  console.log(`   ${attendanceCount}件の勤怠データを作成しました`);

  // 9. 有給残高データ
  console.log('🏖️ 有給残高データを投入中...');
  const currentYear = new Date().getFullYear();
  for (const user of users) {
    const paidTotal = 20;
    const paidUsed = Math.floor(Math.random() * 10);

    await prisma.leave_balances.create({
      data: {
        id: `lb-${user.id}-${currentYear}`,
        tenantId: TENANT_ID,
        userId: user.id,
        year: currentYear,
        paidLeaveTotal: paidTotal,
        paidLeaveUsed: paidUsed,
        paidLeaveRemaining: paidTotal - paidUsed,
        paidLeaveExpiry: new Date(`${currentYear + 1}-03-31`),
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

  // 10. 休暇申請データ（過去・未来含む80件）
  console.log('📅 休暇申請データを投入中...');
  const leaveTypes = ['annual', 'sick', 'special', 'compensatory'];
  const leaveReasons = [
    '私用のため', '体調不良のため', '家族の用事のため', '通院のため',
    '旅行のため', '引越しのため', '冠婚葬祭のため', '子供の行事のため'
  ];

  for (let i = 0; i < 80; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const startOffset = Math.floor(Math.random() * 90) - 45; // -45 to +45 days
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + startOffset);
    startDate.setHours(0, 0, 0, 0);

    const days = Math.floor(Math.random() * 3) + 1;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    const isPast = startDate < today;
    const status = isPast ? (Math.random() > 0.1 ? 'approved' : 'rejected') :
                   (Math.random() > 0.6 ? 'approved' : 'pending');

    await prisma.leave_requests.create({
      data: {
        id: `t1-lr-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        userId: user.id,
        userName: user.name,
        type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
        startDate: startDate,
        endDate: endDate,
        days: days,
        reason: leaveReasons[Math.floor(Math.random() * leaveReasons.length)],
        status: status,
        updatedAt: new Date(),
      },
    });
  }

  // 11. ワークフロー申請データ（100件）
  console.log('📝 ワークフロー申請データを投入中...');
  for (let i = 0; i < 100; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = workflowTypes[Math.floor(Math.random() * workflowTypes.length)];
    const createdOffset = Math.floor(Math.random() * 60);
    const createdDate = new Date(today);
    createdDate.setDate(createdDate.getDate() - createdOffset);

    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1);

    // 最近の20件はpending、それ以外はランダム
    const status = i < 20 ? 'pending' :
                   (Math.random() > 0.2 ? 'approved' : (Math.random() > 0.5 ? 'rejected' : 'pending'));

    let amount = null;
    let description = '';

    switch (type) {
      case '経費精算':
        amount = Math.floor(Math.random() * 50000) + 1000;
        description = `${['交通費', '接待費', '消耗品費', '通信費'][Math.floor(Math.random() * 4)]}の精算申請です。`;
        break;
      case '備品購入申請':
        amount = Math.floor(Math.random() * 100000) + 5000;
        description = `${['PC周辺機器', 'オフィス用品', '書籍', 'ソフトウェア'][Math.floor(Math.random() * 4)]}の購入申請です。`;
        break;
      case '出張申請':
        amount = Math.floor(Math.random() * 80000) + 10000;
        description = `${['東京', '大阪', '名古屋', '福岡'][Math.floor(Math.random() * 4)]}への出張申請です。`;
        break;
      case '残業申請':
        description = `${Math.floor(Math.random() * 4) + 1}時間の残業申請です。業務都合のため。`;
        break;
      case '在宅勤務申請':
        description = `${['通院', '家庭の事情', '集中作業', '天候不良'][Math.floor(Math.random() * 4)]}のため在宅勤務を希望します。`;
        break;
      case '研修参加申請':
        amount = Math.floor(Math.random() * 30000) + 5000;
        description = `${['技術研修', 'マネジメント研修', 'コンプライアンス研修'][Math.floor(Math.random() * 3)]}への参加申請です。`;
        break;
      default:
        description = `${type}の申請です。`;
    }

    await prisma.workflow_requests.create({
      data: {
        id: `t1-wf-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        requesterId: user.id,
        requesterName: user.name,
        department: user.department,
        type: type,
        title: `${type} - ${user.name}`,
        description: description,
        amount: amount,
        status: status,
        priority: Math.random() > 0.7 ? 'high' : (Math.random() > 0.5 ? 'medium' : 'low'),
        dueDate: dueDate,
        createdAt: createdDate,
        updatedAt: new Date(),
      },
    });
  }

  // 12. 健康診断データ
  console.log('🏥 健康診断データを投入中...');
  const healthResults = ['A', 'B', 'C', 'D'];
  const fiscalYear = new Date().getFullYear();

  for (const user of users) {
    const checkupDate = new Date(today);
    checkupDate.setMonth(checkupDate.getMonth() - Math.floor(Math.random() * 6));

    await prisma.health_checkups.create({
      data: {
        id: `hc-${user.id}`,
        tenantId: TENANT_ID,
        userId: user.id,
        userName: user.name,
        checkupDate: checkupDate,
        checkupType: '定期健康診断',
        fiscalYear: fiscalYear,
        overallResult: healthResults[Math.floor(Math.random() * healthResults.length)],
        height: 155 + Math.floor(Math.random() * 35),
        weight: 45 + Math.floor(Math.random() * 45),
        bloodPressureSystolic: 100 + Math.floor(Math.random() * 40),
        bloodPressureDiastolic: 60 + Math.floor(Math.random() * 30),
        updatedAt: new Date(),
      },
    });
  }

  // 13. ストレスチェックデータ
  console.log('😰 ストレスチェックデータを投入中...');
  for (const user of users) {
    const checkDate = new Date(today);
    checkDate.setMonth(checkDate.getMonth() - Math.floor(Math.random() * 3));

    const stressFactors = Math.floor(Math.random() * 30) + 20;
    const stressResponse = Math.floor(Math.random() * 30) + 20;
    const socialSupport = Math.floor(Math.random() * 20) + 10;
    const totalScore = stressFactors + stressResponse + socialSupport;

    await prisma.stress_checks.create({
      data: {
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

  // 14. PC資産データ
  console.log('💻 PC資産データを投入中...');
  const pcModels = ['MacBook Pro 14"', 'MacBook Air M2', 'ThinkPad X1 Carbon', 'Dell XPS 15', 'Surface Pro 9'];

  for (let i = 0; i < users.length + 5; i++) {
    const user = i < users.length ? users[i] : null;
    const model = pcModels[Math.floor(Math.random() * pcModels.length)];
    const manufacturer = model.includes('Mac') ? 'Apple' : model.includes('ThinkPad') ? 'Lenovo' : model.includes('Dell') ? 'Dell' : 'Microsoft';

    await prisma.pc_assets.create({
      data: {
        id: `t1-pc-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        assetNumber: `PC-${String(i + 1).padStart(4, '0')}`,
        manufacturer: manufacturer,
        model: model,
        serialNumber: `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        cpu: model.includes('Mac') ? 'Apple M2 Pro' : 'Intel Core i7-1365U',
        memory: Math.random() > 0.5 ? '16GB' : '32GB',
        storage: Math.random() > 0.5 ? '512GB SSD' : '1TB SSD',
        os: model.includes('Mac') ? 'macOS Sonoma' : 'Windows 11 Pro',
        assignedUserId: user?.id || null,
        assignedUserName: user?.name || null,
        assignedDate: user ? new Date('2024-04-01') : null,
        purchaseDate: new Date('2024-01-15'),
        purchaseCost: 150000 + Math.floor(Math.random() * 150000),
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  // 15. 車両データ
  console.log('🚗 車両データを投入中...');
  const vehicleModels = [
    { make: 'トヨタ', model: 'プリウス' },
    { make: 'ホンダ', model: 'フィット' },
    { make: '日産', model: 'ノート' },
    { make: 'トヨタ', model: 'カローラ' },
    { make: 'マツダ', model: 'CX-5' },
  ];
  const salesUsers = users.filter(u => u.department === '営業部');

  for (let i = 0; i < 6; i++) {
    const vehicle = vehicleModels[i % vehicleModels.length];
    const assignedUser = i < salesUsers.length ? salesUsers[i] : null;

    await prisma.vehicles.create({
      data: {
        id: `t1-veh-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        vehicleNumber: `VH-${String(i + 1).padStart(4, '0')}`,
        licensePlate: `品川 500 あ ${1000 + i}`,
        make: vehicle.make,
        model: vehicle.model,
        year: 2022 + Math.floor(Math.random() * 3),
        color: ['ホワイト', 'シルバー', 'ブラック'][Math.floor(Math.random() * 3)],
        assignedUserId: assignedUser?.id || null,
        assignedUserName: assignedUser?.name || null,
        assignedDate: assignedUser ? new Date('2024-04-01') : null,
        ownershipType: i < 4 ? 'owned' : 'leased',
        purchaseDate: new Date('2023-04-01'),
        purchaseCost: i < 4 ? 2500000 + Math.floor(Math.random() * 500000) : null,
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  // 16. 一般資産
  console.log('📦 一般資産データを投入中...');
  const generalAssets = [
    { category: '会議室設備', name: 'プロジェクター EPSON EB-2250U', cost: 180000 },
    { category: '会議室設備', name: '大型モニター 65インチ', cost: 250000 },
    { category: '会議室設備', name: 'Web会議システム', cost: 150000 },
    { category: 'オフィス家具', name: '執務デスク', cost: 45000 },
    { category: 'オフィス家具', name: 'エルゴノミクスチェア', cost: 80000 },
    { category: 'オフィス家具', name: 'キャビネット', cost: 35000 },
    { category: '通信機器', name: 'Wi-Fiルーター', cost: 25000 },
    { category: '通信機器', name: 'IP電話機', cost: 15000 },
    { category: '空調設備', name: 'エアコン', cost: 350000 },
    { category: 'セキュリティ', name: '入退室管理システム', cost: 500000 },
  ];

  for (let i = 0; i < 25; i++) {
    const asset = generalAssets[i % generalAssets.length];
    await prisma.general_assets.create({
      data: {
        id: `t1-ga-${String(i + 1).padStart(3, '0')}`,
        tenantId: TENANT_ID,
        assetNumber: `GA-${String(i + 1).padStart(4, '0')}`,
        category: asset.category,
        name: asset.name,
        purchaseDate: new Date('2023-04-01'),
        purchaseCost: asset.cost,
        status: 'active',
        notes: `設置場所: ${['本社1F', '本社2F', '本社3F', '会議室A', '会議室B'][Math.floor(Math.random() * 5)]}`,
        updatedAt: new Date(),
      },
    });
  }

  // 17. SaaSサービス
  console.log('☁️ SaaSサービスデータを投入中...');
  const saasServices = [
    { id: 't1-saas-01', name: 'Chatwork', category: 'コミュニケーション', vendor: 'Chatwork株式会社', pricePerUser: 700 },
    { id: 't1-saas-02', name: 'LINE WORKS', category: 'コミュニケーション', vendor: 'ワークスモバイルジャパン', pricePerUser: 450 },
    { id: 't1-saas-03', name: 'Google Workspace', category: '生産性ツール', vendor: 'Google', pricePerUser: 1360 },
    { id: 't1-saas-04', name: 'GitHub', category: '開発ツール', vendor: 'GitHub', pricePerUser: 2100 },
    { id: 't1-saas-05', name: 'Figma', category: 'デザインツール', vendor: 'Figma', pricePerUser: 1800 },
    { id: 't1-saas-06', name: 'Salesforce', category: '営業支援', vendor: 'Salesforce', pricePerUser: 18000 },
    { id: 't1-saas-07', name: 'freee会計', category: '会計ソフト', vendor: 'freee株式会社', fixedPrice: 65780 },
    { id: 't1-saas-08', name: 'Zoom', category: 'Web会議', vendor: 'Zoom Video', pricePerUser: 2200 },
    { id: 't1-saas-09', name: 'AWS', category: 'クラウドインフラ', vendor: 'Amazon', fixedPrice: 450000 },
    { id: 't1-saas-10', name: 'Notion', category: 'プロジェクト管理', vendor: 'Notion Labs', pricePerUser: 1000 },
  ];

  for (const service of saasServices) {
    await prisma.saas_services.create({
      data: {
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

    await prisma.saas_license_plans.create({
      data: {
        id: `plan-${service.id}`,
        tenantId: TENANT_ID,
        serviceId: service.id,
        planName: 'Standard',
        billingCycle: 'monthly',
        pricePerUser: service.pricePerUser || null,
        fixedPrice: service.fixedPrice || null,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  // 18. SaaSライセンス割り当て
  console.log('🔑 SaaSライセンス割り当てを投入中...');
  const serviceAssignments: Record<string, string[]> = {
    't1-saas-01': users.map(u => u.id), // Chatwork - 全員
    't1-saas-02': users.map(u => u.id), // LINE WORKS - 全員
    't1-saas-03': users.map(u => u.id), // Google Workspace - 全員
    't1-saas-04': users.filter(u => u.department === '開発部').map(u => u.id), // GitHub - 開発部
    't1-saas-05': users.filter(u => ['開発部', 'マーケティング部'].includes(u.department)).map(u => u.id), // Figma
    't1-saas-06': users.filter(u => u.department === '営業部').map(u => u.id), // Salesforce - 営業部
    't1-saas-08': users.filter(u => ['経営企画室', '営業部', 'マーケティング部'].includes(u.department)).map(u => u.id), // Zoom
    't1-saas-10': users.map(u => u.id), // Notion - 全員
  };

  let assignmentId = 1;
  for (const [serviceId, userIds] of Object.entries(serviceAssignments)) {
    for (const userId of userIds) {
      const user = users.find(u => u.id === userId)!;
      await prisma.saas_license_assignments.create({
        data: {
          id: `t1-sla-${String(assignmentId).padStart(4, '0')}`,
          tenantId: TENANT_ID,
          serviceId: serviceId,
          planId: `plan-${serviceId}`,
          userId: userId,
          userName: user.name,
          userEmail: user.email,
          departmentName: user.department,
          status: 'active',
          assignedDate: new Date('2024-04-01'),
          updatedAt: new Date(),
        },
      });
      assignmentId++;
    }
  }

  // 19. SaaS月次コスト（6ヶ月分）
  console.log('💰 SaaS月次コストデータを投入中...');
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - monthOffset);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    for (const service of saasServices) {
      const assignments = serviceAssignments[service.id] || [];
      const userCount = assignments.length;
      const userCost = (service.pricePerUser || 0) * userCount;
      const fixedCost = service.fixedPrice || 0;
      const totalCost = userCost + fixedCost;

      if (totalCost > 0) {
        const variance = 1 + (Math.random() * 0.1 - 0.05);
        await prisma.saas_monthly_costs.create({
          data: {
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
  }

  console.log('');
  console.log('✅ シードデータの投入が完了しました！');
  console.log('');
  console.log('📊 投入されたデータ:');
  console.log(`- テナント: 1件（${TENANT_ID}）`);
  console.log(`- 部門: ${departments.length}件`);
  console.log(`- 役職: ${positions.length}件`);
  console.log(`- ユーザー: ${users.length}人`);
  console.log(`- お知らせ: ${announcements.length}件`);
  console.log(`- 勤怠: ${attendanceCount}件（60日分）`);
  console.log(`- 有給残高: ${users.length}件`);
  console.log(`- 休暇申請: 80件`);
  console.log(`- ワークフロー申請: 100件`);
  console.log(`- 健康診断: ${users.length}件`);
  console.log(`- ストレスチェック: ${users.length}件`);
  console.log(`- PC資産: ${users.length + 5}台`);
  console.log(`- 車両: 6台`);
  console.log(`- 一般資産: 25件`);
  console.log(`- SaaSサービス: ${saasServices.length}件`);
  console.log(`- SaaSライセンス割り当て: ${assignmentId - 1}件`);
  console.log('');
  console.log('🔐 ログイン情報:');
  console.log(`- パスワード（全ユーザー共通）: ${DEFAULT_PASSWORD}`);
  console.log('- 人事部長: sato@sample.co.jp');
  console.log('- 代表取締役: suzuki@sample.co.jp');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
