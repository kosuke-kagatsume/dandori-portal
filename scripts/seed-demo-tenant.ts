/**
 * DRM連携テスト用: demo-tenant シードスクリプト
 *
 * 実行: npx tsx scripts/seed-demo-tenant.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = 'demo-tenant';
const DUMMY_PASSWORD_HASH =
  '$2b$12$dummyhashfordrmintegrationtest000000000000000000';
const NOW = new Date();

async function main() {
  console.log('=== demo-tenant シードデータ投入開始 ===\n');

  // 1. テナント作成
  const existingTenant = await prisma.tenants.findUnique({
    where: { id: TENANT_ID },
  });
  if (existingTenant) {
    console.log('[テナント] demo-tenant は既に存在します。スキップ。');
  } else {
    await prisma.tenants.create({
      data: {
        id: TENANT_ID,
        name: 'デモ建設株式会社',
        subdomain: 'demo-kensetsu',
        timezone: 'Asia/Tokyo',
        closingDay: '25',
        weekStartDay: 1,
        updatedAt: NOW,
      },
    });
    console.log('[テナント] demo-tenant を作成しました。');
  }

  // 2. 部署データ（17件）
  const departments = [
    { code: 'YASU-HQ', name: '野洲本社', sortOrder: 1 },
    { code: 'YASU-SALES', name: '営業部', sortOrder: 2 },
    { code: 'YASU-CONST', name: '工事部', sortOrder: 3 },
    { code: 'KUSATSU', name: '草津東支店', sortOrder: 4 },
    { code: 'KUSATSU-SALES', name: '営業部（草津）', sortOrder: 5 },
    { code: 'KUSATSU-CONST', name: '工事部（草津）', sortOrder: 6 },
    { code: 'OTSU', name: '大津支店', sortOrder: 7 },
    { code: 'OTSU-SALES', name: '営業部（大津）', sortOrder: 8 },
    { code: 'OTSU-CONST', name: '工事部（大津）', sortOrder: 9 },
    { code: 'DEPT-1767569562840', name: '管理部', sortOrder: 10 },
    { code: 'DEPT-1767569580102', name: '総務人事部', sortOrder: 11 },
    { code: 'DEPT-1771223241388', name: 'インサイドセールス', sortOrder: 12 },
    { code: 'DEPT-1771223272779', name: '甲賀支店', sortOrder: 13 },
    { code: 'DEPT-1771223291996', name: '高島支店', sortOrder: 14 },
    { code: 'DEPT-1771223303095', name: '岡田支店', sortOrder: 15 },
    { code: 'DEPT-1771223686767', name: 'インバウンド', sortOrder: 16 },
    { code: 'DEPT-1771234158621', name: 'カスタマーサポートインサイド', sortOrder: 17 },
  ];

  // 部署には @@unique([tenantId, name]) 制約があるので、
  // 同名の「営業部」「工事部」は名前を区別する
  let deptCreated = 0;
  let deptSkipped = 0;
  for (const dept of departments) {
    const existing = await prisma.departments.findFirst({
      where: { tenantId: TENANT_ID, code: dept.code },
    });
    if (existing) {
      deptSkipped++;
      continue;
    }
    await prisma.departments.create({
      data: {
        id: `dept-${dept.code.toLowerCase()}`,
        tenantId: TENANT_ID,
        code: dept.code,
        name: dept.name,
        parentId: null,
        sortOrder: dept.sortOrder,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    deptCreated++;
  }
  console.log(
    `[部署] 作成: ${deptCreated}件, スキップ: ${deptSkipped}件`
  );

  // 3. 役職データ（13件）
  const positions = [
    { name: '専務取締役', level: 9, sortOrder: 1 },
    { name: '支社長', level: 8, sortOrder: 2 },
    { name: '営業部長', level: 7, sortOrder: 3 },
    { name: '施工管理部長', level: 7, sortOrder: 4 },
    { name: '事務部長', level: 7, sortOrder: 5 },
    { name: '営業課長', level: 6, sortOrder: 6 },
    { name: '営業主任', level: 5, sortOrder: 7 },
    { name: '施工管理主任', level: 5, sortOrder: 8 },
    { name: '営業担当', level: 3, sortOrder: 9 },
    { name: '施工管理担当', level: 3, sortOrder: 10 },
    { name: '経理担当', level: 3, sortOrder: 11 },
    { name: '総務担当', level: 3, sortOrder: 12 },
    { name: '事務担当', level: 3, sortOrder: 13 },
  ];

  let posCreated = 0;
  let posSkipped = 0;
  for (const pos of positions) {
    const existing = await prisma.positions.findFirst({
      where: { tenantId: TENANT_ID, name: pos.name },
    });
    if (existing) {
      posSkipped++;
      continue;
    }
    await prisma.positions.create({
      data: {
        id: `pos-${pos.sortOrder}`,
        tenantId: TENANT_ID,
        name: pos.name,
        level: pos.level,
        sortOrder: pos.sortOrder,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    posCreated++;
  }
  console.log(
    `[役職] 作成: ${posCreated}件, スキップ: ${posSkipped}件`
  );

  // 4. ユーザーデータ（58件 + NULL employeeNumber 3件 = 61件）
  const users: Array<{
    employeeNumber: string | null;
    name: string;
    email: string;
    role: string;
    department: string | null;
    position: string | null;
    hireDate: string | null;
    status: string;
  }> = [
    { employeeNumber: 'EMP-0002', name: '松本 浩', email: '松本.浩@dandori-corp.jp', role: 'manager', department: 'KUSATSU-SALES', position: '専務取締役', hireDate: '2007-02-01', status: 'active' },
    { employeeNumber: 'EMP-0003', name: '木村 健太', email: '木村.健太@dandori-corp.jp', role: 'manager', department: 'KUSATSU-SALES', position: '支社長', hireDate: '2005-01-01', status: 'active' },
    { employeeNumber: 'EMP-0004', name: '小川 修', email: '小川.修@dandori-corp.jp', role: 'manager', department: 'OTSU-SALES', position: '営業部長', hireDate: '2023-09-01', status: 'active' },
    { employeeNumber: 'EMP-0005', name: '山口 明', email: '山口.明@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '営業課長', hireDate: '2002-03-01', status: 'active' },
    { employeeNumber: 'EMP-0006', name: '林 綾', email: '林.綾@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業主任', hireDate: '2022-05-01', status: 'active' },
    { employeeNumber: 'EMP-0007', name: '井上 和也', email: '井上.和也1@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '営業主任', hireDate: '2003-08-01', status: 'active' },
    { employeeNumber: 'EMP-0008', name: '斉藤 美穂', email: '斉藤.美穂@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業担当', hireDate: '2009-01-01', status: 'active' },
    { employeeNumber: 'EMP-0009', name: '中村 美咲', email: '中村.美咲1@dandori-corp.jp', role: 'employee', department: 'YASU-SALES', position: '営業担当', hireDate: '2011-11-01', status: 'active' },
    { employeeNumber: 'EMP001', name: '田中 太郎', email: 'sales@example.com', role: 'employee', department: 'YASU-SALES', position: '営業担当', hireDate: null, status: 'active' },
    { employeeNumber: 'EMP-0010', name: '加藤 麻衣', email: '加藤.麻衣2@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業担当', hireDate: '2007-03-01', status: 'active' },
    { employeeNumber: 'EMP-0011', name: '佐々木 修', email: '佐々木.修3@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '営業担当', hireDate: '2005-12-01', status: 'active' },
    { employeeNumber: 'EMP-0012', name: '加藤 茂', email: '加藤.茂@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '営業課長', hireDate: '2007-11-01', status: 'active' },
    { employeeNumber: 'EMP-0013', name: '林 恵子', email: '林.恵子@dandori-corp.jp', role: 'employee', department: 'YASU-SALES', position: '営業主任', hireDate: '2020-11-01', status: 'active' },
    { employeeNumber: 'EMP-0014', name: '鈴木 太郎', email: '鈴木.太郎1@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業主任', hireDate: '2021-02-01', status: 'active' },
    { employeeNumber: 'EMP-0015', name: '山崎 美咲', email: '山崎.美咲@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '営業担当', hireDate: '2000-08-01', status: 'active' },
    { employeeNumber: 'EMP-0016', name: '林 茂', email: '林.茂1@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業担当', hireDate: '2020-03-01', status: 'active' },
    { employeeNumber: 'EMP-0017', name: '斉藤 莉子', email: '斉藤.莉子2@dandori-corp.jp', role: 'employee', department: 'YASU-SALES', position: '営業担当', hireDate: '2007-08-01', status: 'active' },
    { employeeNumber: 'EMP-0018', name: '渡辺 次郎', email: '渡辺.次郎@dandori-corp.jp', role: 'employee', department: 'YASU-CONST', position: '施工管理部長', hireDate: '2015-08-01', status: 'active' },
    { employeeNumber: 'EMP-0019', name: '高橋 拓也', email: '高橋.拓也@dandori-corp.jp', role: 'employee', department: 'KUSATSU-CONST', position: '施工管理主任', hireDate: '2007-09-01', status: 'active' },
    { employeeNumber: 'EMP-0020', name: '中村 三郎', email: '中村.三郎1@dandori-corp.jp', role: 'employee', department: 'OTSU-CONST', position: '施工管理主任', hireDate: '2020-05-01', status: 'active' },
    { employeeNumber: 'EMP-0021', name: '山田 美咲', email: '山田.美咲@dandori-corp.jp', role: 'employee', department: 'OTSU-CONST', position: '施工管理担当', hireDate: '2011-11-01', status: 'active' },
    { employeeNumber: 'EMP-0022', name: '佐藤 稔', email: '佐藤.稔1@dandori-corp.jp', role: 'employee', department: 'YASU-CONST', position: '施工管理担当', hireDate: '2015-08-01', status: 'active' },
    { employeeNumber: 'EMP-0023', name: '池田 由美', email: '池田.由美2@dandori-corp.jp', role: 'employee', department: 'YASU-CONST', position: '施工管理担当', hireDate: '2023-01-01', status: 'active' },
    { employeeNumber: 'EMP-0024', name: '吉田 真由美', email: '吉田.真由美@dandori-corp.jp', role: 'admin', department: 'YASU-HQ', position: '事務部長', hireDate: '2024-06-01', status: 'active' },
    { employeeNumber: 'EMP-0025', name: '林 香', email: '林.香@dandori-corp.jp', role: 'employee', department: 'YASU-SALES', position: '経理担当', hireDate: '2001-03-01', status: 'active' },
    { employeeNumber: 'EMP-0026', name: '清水 美穂', email: '清水.美穂1@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '経理担当', hireDate: '2013-10-01', status: 'active' },
    { employeeNumber: 'EMP-0027', name: '小林 麻衣', email: '小林.麻衣@dandori-corp.jp', role: 'admin', department: 'YASU-HQ', position: '総務担当', hireDate: '2014-12-01', status: 'active' },
    { employeeNumber: 'EMP-0028', name: '松本 梨花', email: '松本.梨花1@dandori-corp.jp', role: 'admin', department: 'YASU-HQ', position: '総務担当', hireDate: '2023-01-01', status: 'active' },
    { employeeNumber: 'EMP-0029', name: '林 茂', email: '林.茂@dandori-corp.jp', role: 'manager', department: 'YASU-SALES', position: '支社長', hireDate: '2004-06-01', status: 'active' },
    { employeeNumber: 'EMP-0030', name: '中村 太郎', email: '中村.太郎@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業部長', hireDate: '2008-01-01', status: 'active' },
    { employeeNumber: 'EMP-0031', name: '木村 恵子', email: '木村.恵子@dandori-corp.jp', role: 'employee', department: 'YASU-SALES', position: '営業担当', hireDate: '2000-02-01', status: 'active' },
    { employeeNumber: 'EMP-0032', name: '松本 誠', email: '松本.誠1@dandori-corp.jp', role: 'employee', department: 'YASU-SALES', position: '営業担当', hireDate: '2011-03-01', status: 'active' },
    { employeeNumber: 'EMP-0033', name: '井上 菜々子', email: '井上.菜々子2@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業担当', hireDate: '2014-11-01', status: 'active' },
    { employeeNumber: 'EMP-0034', name: '井上 幸子', email: '井上.幸子3@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '営業担当', hireDate: '2000-01-01', status: 'active' },
    { employeeNumber: 'EMP-0035', name: '前田 修', email: '前田.修@dandori-corp.jp', role: 'employee', department: 'OTSU-CONST', position: '施工管理部長', hireDate: '2017-04-01', status: 'active' },
    { employeeNumber: 'EMP-0036', name: '中島 大輔', email: '中島.大輔@dandori-corp.jp', role: 'employee', department: 'YASU-CONST', position: '施工管理担当', hireDate: '2006-11-01', status: 'active' },
    { employeeNumber: 'EMP-0037', name: '山下 正', email: '山下.正1@dandori-corp.jp', role: 'employee', department: 'KUSATSU-CONST', position: '施工管理担当', hireDate: '2004-05-01', status: 'active' },
    { employeeNumber: 'EMP-0038', name: '木村 莉子', email: '木村.莉子@dandori-corp.jp', role: 'admin', department: 'YASU-HQ', position: '事務担当', hireDate: '2005-06-01', status: 'active' },
    { employeeNumber: 'EMP-0039', name: '山口 由美', email: '山口.由美1@dandori-corp.jp', role: 'admin', department: 'YASU-HQ', position: '事務担当', hireDate: '2022-06-01', status: 'active' },
    { employeeNumber: 'EMP-0040', name: '木村 茂', email: '木村.茂@dandori-corp.jp', role: 'manager', department: 'OTSU-SALES', position: '支社長', hireDate: '2012-01-01', status: 'active' },
    { employeeNumber: 'EMP-0041', name: '鈴木 次郎', email: '鈴木.次郎@dandori-corp.jp', role: 'employee', department: 'OTSU-SALES', position: '営業部長', hireDate: '2005-08-01', status: 'active' },
    { employeeNumber: 'EMP-0042', name: '池田 茂', email: '池田.茂@dandori-corp.jp', role: 'employee', department: 'KUSATSU-SALES', position: '営業担当', hireDate: '2019-05-01', status: 'active' },
    { employeeNumber: 'EMP-0043', name: '橋本 美咲', email: '橋本.美咲1@dandori-corp.jp', role: 'employee', department: null, position: '営業担当', hireDate: '2015-09-01', status: 'active' },
    { employeeNumber: 'EMP-0044', name: '木村 太郎', email: '木村.太郎2@dandori-corp.jp', role: 'employee', department: null, position: '営業担当', hireDate: '2003-10-01', status: 'active' },
    { employeeNumber: 'EMP-0045', name: '木村 正', email: '木村.正@dandori-corp.jp', role: 'employee', department: 'KUSATSU-CONST', position: '施工管理部長', hireDate: '2024-02-01', status: 'active' },
    { employeeNumber: 'EMP-0046', name: '山田 誠', email: '山田.誠@dandori-corp.jp', role: 'employee', department: 'YASU-CONST', position: '施工管理担当', hireDate: '2007-11-01', status: 'active' },
    { employeeNumber: 'EMP-0048', name: '山口 彩', email: '山口.彩@dandori-corp.jp', role: 'admin', department: 'YASU-HQ', position: '事務担当', hireDate: '2008-05-01', status: 'active' },
    { employeeNumber: 'EMP-0049', name: '阿部 梨花', email: '阿部.梨花1@dandori-corp.jp', role: 'admin', department: 'YASU-HQ', position: '事務担当', hireDate: '2007-02-01', status: 'active' },
    { employeeNumber: 'EMP-0052', name: '高田dev環境', email: 'takada.naoko+8@dandori-work.com', role: 'admin', department: null, position: null, hireDate: '2026-02-11', status: 'active' },
    { employeeNumber: 'EMP-0053', name: '高田dev環境', email: 'takada.naoko+99998@dandori-work.com', role: 'admin', department: null, position: null, hireDate: '2026-02-11', status: 'active' },
    { employeeNumber: 'EMP-0054', name: '高田役職どうなる子', email: 'takada.naoko+89@dandori-work.com', role: 'admin', department: null, position: null, hireDate: '2026-02-12', status: 'active' },
    { employeeNumber: 'EMP-0055', name: '招待メール確認', email: 'takada.naoko@dandori-work.com', role: 'admin', department: 'KUSATSU-CONST', position: null, hireDate: '2026-02-12', status: 'active' },
    { employeeNumber: 'EMP-0056', name: '招待メール確認する', email: 'takada.naoko+12345@dandori-work.com', role: 'admin', department: 'KUSATSU-CONST', position: null, hireDate: '2026-02-12', status: 'active' },
    { employeeNumber: 'EMP-0057', name: 'デブです、メール飛ぶ？', email: 'takada.naoko+1000000000000032@dandori-work.com', role: 'admin', department: 'DEPT-1771234158621', position: null, hireDate: '2026-02-12', status: 'active' },
    { employeeNumber: 'EMP-0058', name: '部署どうか！', email: 'takada.naoko+1111111@dandori-work.com', role: 'admin', department: 'KUSATSU-CONST', position: null, hireDate: '2026-02-13', status: 'active' },
    { employeeNumber: 'EMP-0059', name: '部署どうかな？', email: 'takada.naokoiii@dandori-work.com', role: 'admin', department: 'KUSATSU-CONST', position: null, hireDate: '2026-02-13', status: 'active' },
    { employeeNumber: 'EMP-0060', name: '招待メール', email: 'takada.naoko+98760@dandori-work.com', role: 'admin', department: 'DEPT-1771234158621', position: null, hireDate: '2026-02-13', status: 'active' },
    { employeeNumber: 'EMP-0061', name: '高田良子', email: 'takada.naoko+10000000000000323@dandori-work.com', role: 'admin', department: 'DEPT-1767569580102', position: null, hireDate: '2026-02-18', status: 'active' },
    // employeeNumber NULL の3件
    { employeeNumber: null, name: '山田 太郎', email: 'yamada@drm.com', role: 'admin', department: 'YASU-SALES', position: null, hireDate: null, status: 'active' },
    { employeeNumber: null, name: 'システム', email: 'system@example.com', role: 'admin', department: 'YASU-HQ', position: null, hireDate: null, status: 'active' },
    { employeeNumber: null, name: '管理者', email: 'admin@example.com', role: 'admin', department: 'YASU-HQ', position: null, hireDate: null, status: 'active' },
  ];

  let userCreated = 0;
  let userSkipped = 0;
  for (const user of users) {
    const existing = await prisma.users.findFirst({
      where: { email: user.email },
    });
    if (existing) {
      userSkipped++;
      continue;
    }
    await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: TENANT_ID,
        email: user.email,
        name: user.name,
        employeeNumber: user.employeeNumber,
        role: user.role,
        roles: [user.role],
        department: user.department,
        position: user.position,
        hireDate: user.hireDate ? new Date(user.hireDate) : null,
        status: user.status,
        passwordHash: DUMMY_PASSWORD_HASH,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    userCreated++;
  }
  console.log(
    `[ユーザー] 作成: ${userCreated}件, スキップ: ${userSkipped}件`
  );

  // 検証
  const tenantCount = await prisma.tenants.count({
    where: { id: TENANT_ID },
  });
  const deptCount = await prisma.departments.count({
    where: { tenantId: TENANT_ID },
  });
  const posCount = await prisma.positions.count({
    where: { tenantId: TENANT_ID },
  });
  const userCount = await prisma.users.count({
    where: { tenantId: TENANT_ID },
  });

  console.log('\n=== 検証結果 ===');
  console.log(`テナント: ${tenantCount}件`);
  console.log(`部署: ${deptCount}件`);
  console.log(`役職: ${posCount}件`);
  console.log(`ユーザー: ${userCount}件`);
  console.log('\n=== 完了 ===');
}

main()
  .catch((e) => {
    console.error('エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
