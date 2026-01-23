/**
 * テナントのシードデータ投入スクリプト
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tenants = [
  {
    id: 'tenant-001',
    name: '株式会社サンプル商事',
    subdomain: 'sample-corp',
    timezone: 'Asia/Tokyo',
    closingDay: '末',
    weekStartDay: 1,
  },
  {
    id: 'tenant-002',
    name: 'テスト株式会社',
    subdomain: 'test-corp',
    timezone: 'Asia/Tokyo',
    closingDay: '末',
    weekStartDay: 1,
  },
  {
    id: 'tenant-003',
    name: 'トライアル株式会社',
    subdomain: 'trial-corp',
    timezone: 'Asia/Tokyo',
    closingDay: '末',
    weekStartDay: 1,
  },
  {
    id: 'tenant-004',
    name: '大規模株式会社',
    subdomain: 'large-corp',
    timezone: 'Asia/Tokyo',
    closingDay: '末',
    weekStartDay: 1,
  },
  {
    id: 'tenant-005',
    name: '停止中株式会社',
    subdomain: 'suspended-corp',
    timezone: 'Asia/Tokyo',
    closingDay: '末',
    weekStartDay: 1,
  },
  {
    id: 'tenant-006',
    name: '株式会社ダンドリワーク',
    subdomain: 'dandori-work',
    timezone: 'Asia/Tokyo',
    closingDay: '末',
    weekStartDay: 1,
  },
];

async function main() {
  console.log('🌱 テナントデータを投入中...');

  for (const tenant of tenants) {
    const result = await prisma.tenants.upsert({
      where: { id: tenant.id },
      update: {
        subdomain: tenant.subdomain,
      },
      create: {
        ...tenant,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ ${result.name} (${result.subdomain})`);
  }

  console.log('\n✨ テナントデータ投入完了！');

  // 確認
  const allTenants = await prisma.tenants.findMany({
    orderBy: { id: 'asc' },
  });

  console.log('\n📊 登録済みテナント一覧:');
  console.table(allTenants.map(t => ({
    ID: t.id,
    名前: t.name,
    サブドメイン: t.subdomain,
  })));
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
