/**
 * テナント初期セットアップスクリプト
 *
 * 使用方法:
 * npx ts-node scripts/setup-tenant.ts
 *
 * または
 * npx tsx scripts/setup-tenant.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// 設定: ここを変更してください
// ============================================

const TENANT_CONFIG = {
  name: '株式会社ダンドリワーク',
  subdomain: 'dandori-work',
  timezone: 'Asia/Tokyo',
  closingDay: '末',
  weekStartDay: 1, // 月曜日
};

const ADMIN_USER = {
  email: 'admin@dandori-work.com', // 実際の管理者メールアドレスに変更
  name: '管理者',
  password: 'DandoriAdmin2025!', // 初回ログイン後に変更してください
  phone: '03-0000-0000',
  position: 'システム管理者',
  department: '管理部',
};

const ORG_STRUCTURE = {
  company: {
    name: '株式会社ダンドリワーク',
    code: 'DW',
  },
  departments: [
    { name: '管理部', code: 'ADMIN' },
    { name: '営業部', code: 'SALES' },
    { name: '開発部', code: 'DEV' },
    { name: '人事部', code: 'HR' },
  ],
};

// ============================================
// セットアップ処理
// ============================================

async function main() {
  console.log('🚀 テナントセットアップを開始します...\n');

  try {
    // 1. テナント作成
    console.log('📦 Step 1: テナントを作成中...');
    const tenant = await prisma.tenants.create({
      data: {
        name: TENANT_CONFIG.name,
        subdomain: TENANT_CONFIG.subdomain,
        timezone: TENANT_CONFIG.timezone,
        closingDay: TENANT_CONFIG.closingDay,
        weekStartDay: TENANT_CONFIG.weekStartDay,
      },
    });
    console.log(`   ✅ テナント作成完了: ${tenant.name} (ID: ${tenant.id})\n`);

    // 2. 組織構造を作成
    console.log('🏢 Step 2: 組織構造を作成中...');

    // 会社（ルート組織）
    const rootUnit = await prisma.org_units.create({
      data: {
        tenantId: tenant.id,
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
          tenantId: tenant.id,
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

    // 3. 管理者ユーザー作成
    console.log('👤 Step 3: 管理者ユーザーを作成中...');

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);

    const adminUser = await prisma.users.create({
      data: {
        tenantId: tenant.id,
        email: ADMIN_USER.email,
        name: ADMIN_USER.name,
        passwordHash: passwordHash,
        phone: ADMIN_USER.phone,
        position: ADMIN_USER.position,
        department: ADMIN_USER.department,
        hireDate: new Date(),
        unitId: departments['管理部'], // 管理部に所属
        roles: ['admin', 'hr'], // 管理者 + 人事権限
        role: 'admin',
        status: 'active',
      },
    });
    console.log(`   ✅ 管理者作成: ${adminUser.name} (${adminUser.email})\n`);

    // 4. テナント設定を作成
    console.log('⚙️ Step 4: テナント設定を作成中...');
    await prisma.tenant_settings.create({
      data: {
        tenantId: tenant.id,
        status: 'active',
      },
    });
    console.log('   ✅ テナント設定作成完了');

    // 5. 勤怠設定を作成
    console.log('⏰ Step 5: 勤怠設定を作成中...');
    await prisma.attendance_settings.create({
      data: {
        tenantId: tenant.id,
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
