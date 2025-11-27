require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('メンテナンス記録のシードデータを追加中...');

  // 車両一覧を取得（テナントID問わず）
  const vehicles = await prisma.vehicle.findMany({
    take: 5,
  });

  if (vehicles.length === 0) {
    console.error('車両が見つかりません');
    return;
  }

  // 車両のテナントIDを取得
  const tenantId = vehicles[0].tenantId;
  console.log(`テナントID: ${tenantId}`);

  // 業者一覧を取得
  const vendors = await prisma.vendor.findMany({
    where: { tenantId },
  });

  // 既存のメンテナンス記録を確認
  const existingCount = await prisma.maintenanceRecord.count({
    where: { tenantId },
  });

  if (existingCount > 0) {
    console.log(`既存のメンテナンス記録が${existingCount}件あります。追加をスキップします。`);
    return;
  }

  // メンテナンス記録のサンプルデータ
  const maintenanceTypes = ['oil_change', 'tire_change', 'inspection', 'shaken', 'repair', 'other'];
  const descriptions = {
    oil_change: ['エンジンオイル交換', 'エンジンオイル・オイルフィルター交換', 'エンジンオイル5W-30交換'],
    tire_change: ['スタッドレスタイヤに交換', '夏タイヤに交換', 'タイヤローテーション'],
    inspection: ['12ヶ月点検', '6ヶ月点検', '法定点検'],
    shaken: ['車検（2年）', '車検整備一式'],
    repair: ['ブレーキパッド交換', 'バッテリー交換', 'エアコンフィルター交換', 'ワイパーブレード交換'],
    other: ['洗車・コーティング', 'オイル添加剤投入', 'エアコンガス補充'],
  };

  const costs = {
    oil_change: [5000, 8000, 6500],
    tire_change: [3000, 4000, 15000],
    inspection: [15000, 25000, 20000],
    shaken: [80000, 120000, 100000],
    repair: [15000, 25000, 35000, 8000],
    other: [5000, 3000, 8000],
  };

  const records = [];

  // 各車両に対してメンテナンス記録を生成
  for (const vehicle of vehicles) {
    // 過去6ヶ月分のデータを生成
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const date = new Date();
      date.setMonth(date.getMonth() - monthOffset);
      date.setDate(Math.floor(Math.random() * 28) + 1);

      const type = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
      const typeDescriptions = descriptions[type];
      const typeCosts = costs[type];

      const description = typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
      const cost = typeCosts[Math.floor(Math.random() * typeCosts.length)];
      const mileage = 30000 + Math.floor(Math.random() * 50000);

      const vendor = vendors.length > 0 ? vendors[Math.floor(Math.random() * vendors.length)] : null;

      records.push({
        tenantId: tenantId,
        vehicleId: vehicle.id,
        type,
        date,
        mileage,
        cost,
        vendorId: vendor?.id || null,
        description,
        nextDueDate: type === 'oil_change' ? new Date(date.getTime() + 90 * 24 * 60 * 60 * 1000) : null,
        nextDueMileage: type === 'oil_change' ? mileage + 5000 : null,
        performedBy: null,
        performedByName: null,
        notes: monthOffset === 0 ? '最新の記録' : null,
      });
    }
  }

  // バッチで挿入
  const created = await prisma.maintenanceRecord.createMany({
    data: records,
  });

  console.log(`${created.count}件のメンテナンス記録を追加しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
