/**
 * 既存テナントの初期データセットアップスクリプト
 *
 * テナント tenant-006 (株式会社ダンドリワーク) に
 * 組織構造、管理者ユーザー、設定を追加
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 既存テナントID
const TENANT_ID = 'tenant-006';

const ADMIN_USER = {
  email: 'admin@dandori-work.com',
  name: '管理者',
  password: 'DandoriAdmin2025!',
  phone: '03-0000-0000',
  position: 'システム管理者',
  department: '管理部',
};

const ORG_STRUCTURE = {
  company: {
    name: '株式会社ダンドリワーク',
  },
  departments: [
    { name: '管理部' },
    { name: '営業部' },
    { name: '開発部' },
    { name: '人事部' },
  ],
};

async function main() {
  console.log('🚀 テナント設定の追加を開始します...\n');
  console.log(`   対象テナント: ${TENANT_ID}\n`);

  try {
    // 1. 組織構造を作成
    console.log('🏢 Step 1: 組織構造を作成中...');

    // 会社（ルート組織）
    const rootUnit = await prisma.org_units.create({
      data: {
        tenantId: TENANT_ID,
        name: ORG_STRUCTURE.company.name,
        type: 'company',
        level: 0,
        parentId: null,
      },
    });
    console.log(`   ✅ 会社作成: ${rootUnit.name}`);

    // 部門を作成
    const departments: Record<string, string> = {};
    for (const dept of ORG_STRUCTURE.departments) {
      const unit = await prisma.org_units.create({
        data: {
          tenantId: TENANT_ID,
          name: dept.name,
          type: 'department',
          level: 1,
          parentId: rootUnit.id,
        },
      });
      departments[dept.name] = unit.id;
      console.log(`   ✅ 部門作成: ${unit.name}`);
    }
    console.log('');

    // 2. 管理者ユーザー作成
    console.log('👤 Step 2: 管理者ユーザーを作成中...');

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);

    const adminUser = await prisma.users.create({
      data: {
        tenantId: TENANT_ID,
        email: ADMIN_USER.email,
        name: ADMIN_USER.name,
        passwordHash: passwordHash,
        phone: ADMIN_USER.phone,
        position: ADMIN_USER.position,
        department: ADMIN_USER.department,
        hireDate: new Date(),
        unitId: departments['管理部'],
        roles: ['admin', 'hr'],
        role: 'admin',
        status: 'active',
      },
    });
    console.log(`   ✅ 管理者作成: ${adminUser.name} (${adminUser.email})\n`);

    // 3. テナント設定を作成
    console.log('⚙️ Step 3: テナント設定を作成中...');
    await prisma.tenant_settings.create({
      data: {
        tenantId: TENANT_ID,
        status: 'active',
      },
    });
    console.log('   ✅ テナント設定作成完了');

    // 4. 勤怠設定を作成
    console.log('⏰ Step 4: 勤怠設定を作成中...');
    await prisma.attendance_settings.create({
      data: {
        tenantId: TENANT_ID,
        workStartTime: '09:00',
        workEndTime: '18:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        breakDurationMinutes: 60,
      },
    });
    console.log('   ✅ 勤怠設定作成完了\n');

    // 完了メッセージ
    console.log('═'.repeat(50));
    console.log('🎉 セットアップ完了！\n');
    console.log('📋 ログイン情報:');
    console.log(`   URL: https://dandori-portal.com`);
    console.log(`   メール: ${ADMIN_USER.email}`);
    console.log(`   パスワード: ${ADMIN_USER.password}`);
    console.log('\n⚠️  初回ログイン後、必ずパスワードを変更してください！');
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
