import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://dandori_admin:DandoriAdmin2025Secure@dandori-portal-db.chya4uuiiy9m.ap-northeast-1.rds.amazonaws.com:5432/dandori_portal?schema=public'
    }
  }
});

// デモ用テナントID
const DEMO_TENANT_ID = 'tenant-demo-001';

// 共通パスワード
const DEFAULT_PASSWORD = 'demo1234';

// デモユーザーデータ（demo-users.ts と同じ）
const demoUsers = [
  {
    id: 'demo-employee',
    name: '田中太郎',
    email: 'tanaka@demo.dandori-portal.com',
    role: 'employee',
    department: '営業部',
    position: '一般社員',
  },
  {
    id: 'demo-manager',
    name: '佐藤部長',
    email: 'sato@demo.dandori-portal.com',
    role: 'manager',
    department: '営業部',
    position: '部長',
  },
  {
    id: 'demo-executive',
    name: '鈴木社長',
    email: 'suzuki@demo.dandori-portal.com',
    role: 'executive',
    department: '経営企画室',
    position: '代表取締役',
  },
  {
    id: 'demo-hr',
    name: '山田人事',
    email: 'yamada@demo.dandori-portal.com',
    role: 'hr',
    department: '人事部',
    position: '人事担当',
  },
  {
    id: 'demo-admin',
    name: 'システム管理者',
    email: 'admin@demo.dandori-portal.com',
    role: 'admin',
    department: 'IT部',
    position: 'システム管理者',
  },
  {
    id: 'demo-applicant',
    name: '新入太郎',
    email: 'shinnyu@demo.dandori-portal.com',
    role: 'applicant',
    department: '入社予定',
    position: '新入社員',
  },
];

async function main() {
  console.log('デモユーザー登録を開始します...');
  console.log(`対象: ${demoUsers.length}名`);
  console.log(`テナント: ${DEMO_TENANT_ID}`);
  console.log('---');

  // 共通パスワードのハッシュを生成
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log('パスワードハッシュ生成完了');

  // デモ用テナントを作成（存在しない場合）
  const existingTenant = await prisma.tenants.findUnique({
    where: { id: DEMO_TENANT_ID }
  });

  if (!existingTenant) {
    await prisma.tenants.create({
      data: {
        id: DEMO_TENANT_ID,
        name: 'デモ会社',
        subdomain: 'demo',
        updatedAt: new Date(),
      }
    });
    console.log('[新規] デモテナントを作成しました');
  } else {
    console.log('[既存] デモテナントは既に存在します');
  }

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const user of demoUsers) {
    try {
      // 既存ユーザーチェック（メールで検索）
      const existing = await prisma.users.findFirst({
        where: { email: user.email }
      });

      if (existing) {
        // 更新
        await prisma.users.update({
          where: { id: existing.id },
          data: {
            name: user.name,
            role: user.role,
            department: user.department,
            position: user.position,
            tenantId: DEMO_TENANT_ID,
            status: 'active',
          }
        });
        console.log(`[更新] ${user.name} (${user.email}) - ${user.role}`);
        updated++;
      } else {
        // 新規作成
        await prisma.users.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            passwordHash: passwordHash,
            role: user.role,
            department: user.department,
            position: user.position,
            tenantId: DEMO_TENANT_ID,
            status: 'active',
            updatedAt: new Date(),
          }
        });
        console.log(`[新規] ${user.name} (${user.email}) - ${user.role}`);
        created++;
      }
    } catch (error) {
      console.error(`[失敗] ${user.name} (${user.email}):`, error);
      failed++;
    }
  }

  console.log('---');
  console.log(`完了: 新規${created}名, 更新${updated}名, 失敗${failed}名`);
  console.log(`ログインパスワード: ${DEFAULT_PASSWORD}`);
  console.log('');
  console.log('ログイン可能なメールアドレス:');
  demoUsers.forEach(u => {
    console.log(`  - ${u.email} (${u.name} / ${u.role})`);
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});
