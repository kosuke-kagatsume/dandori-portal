import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAssets() {
  const tenantId = 'tenant-1';

  console.log('Seeding assets data...');

  // 業者データ
  const vendors = await Promise.all([
    prisma.vendors.upsert({
      where: { id: 'vendor-001' },
      update: {},
      create: {
        id: 'vendor-001',
        tenantId,
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都渋谷区1-2-3',
        contactPerson: '山田太郎',
        email: 'yamada@autoservice.example.com',
        rating: 5,
        notes: '車検・点検に強い',
      },
    }),
    prisma.vendors.upsert({
      where: { id: 'vendor-002' },
      update: {},
      create: {
        id: 'vendor-002',
        tenantId,
        name: 'タイヤセンター東京',
        phone: '03-2345-6789',
        address: '東京都新宿区4-5-6',
        contactPerson: '鈴木一郎',
        email: 'suzuki@tire-tokyo.example.com',
        rating: 4,
        notes: 'タイヤ交換専門',
      },
    }),
    prisma.vendors.upsert({
      where: { id: 'vendor-003' },
      update: {},
      create: {
        id: 'vendor-003',
        tenantId,
        name: 'PCリペアショップ秋葉原',
        phone: '03-3456-7890',
        address: '東京都千代田区秋葉原7-8-9',
        contactPerson: '田中花子',
        email: 'tanaka@pcrepair.example.com',
        rating: 5,
        notes: 'PC修理・メンテナンス',
      },
    }),
  ]);

  console.log(`Created ${vendors.length} vendors`);

  // 車両データ
  const vehicles = await Promise.all([
    prisma.vehicles.upsert({
      where: { tenantId_vehicleNumber: { tenantId, vehicleNumber: 'V-001' } },
      update: {},
      create: {
        id: 'vehicle-001',
        tenantId,
        vehicleNumber: 'V-001',
        licensePlate: '品川 300 あ 1234',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2022,
        color: 'ホワイト',
        ownershipType: 'owned',
        purchaseDate: new Date('2022-04-01'),
        purchaseCost: 3200000,
        assignedUserId: 'user-001',
        assignedUserName: '山田太郎',
        assignedDate: new Date('2022-04-15'),
        inspectionDate: new Date('2024-04-01'),
        insuranceDate: new Date('2025-04-01'),
        currentTireType: 'summer',
        status: 'active',
        mileageTracking: true,
        currentMileage: 25000,
        notes: '営業車',
      },
    }),
    prisma.vehicles.upsert({
      where: { tenantId_vehicleNumber: { tenantId, vehicleNumber: 'V-002' } },
      update: {},
      create: {
        id: 'vehicle-002',
        tenantId,
        vehicleNumber: 'V-002',
        licensePlate: '品川 500 い 5678',
        make: 'ホンダ',
        model: 'フィット',
        year: 2021,
        color: 'シルバー',
        ownershipType: 'leased',
        leaseCompany: 'オリックス自動車',
        leaseStartDate: new Date('2021-06-01'),
        leaseEndDate: new Date('2026-05-31'),
        leaseMonthlyCost: 35000,
        leaseContact: '佐藤担当',
        leasePhone: '03-9999-8888',
        assignedUserId: 'user-002',
        assignedUserName: '鈴木花子',
        assignedDate: new Date('2021-06-15'),
        inspectionDate: new Date('2024-06-01'),
        insuranceDate: new Date('2025-06-01'),
        currentTireType: 'summer',
        status: 'active',
        mileageTracking: true,
        currentMileage: 35000,
        notes: '通勤用',
      },
    }),
    prisma.vehicles.upsert({
      where: { tenantId_vehicleNumber: { tenantId, vehicleNumber: 'V-003' } },
      update: {},
      create: {
        id: 'vehicle-003',
        tenantId,
        vehicleNumber: 'V-003',
        licensePlate: '練馬 100 う 9012',
        make: '日産',
        model: 'リーフ',
        year: 2023,
        color: 'ブルー',
        ownershipType: 'owned',
        purchaseDate: new Date('2023-01-15'),
        purchaseCost: 4500000,
        inspectionDate: new Date('2026-01-15'),
        insuranceDate: new Date('2025-01-15'),
        currentTireType: 'summer',
        status: 'active',
        mileageTracking: true,
        currentMileage: 12000,
        notes: '電気自動車・エコカー',
      },
    }),
  ]);

  console.log(`Created ${vehicles.length} vehicles`);

  // 車両IDを取得（upsertで返されたIDを使用）
  const vehicleIds = vehicles.map(v => v.id);
  console.log('Vehicle IDs:', vehicleIds);

  // 月間走行距離データ
  const mileages = await Promise.all([
    prisma.monthly_mileages.upsert({
      where: { vehicleId_month: { vehicleId: vehicleIds[0], month: '2024-10' } },
      update: {},
      create: {
        tenantId,
        vehicleId: vehicleIds[0],
        month: '2024-10',
        distance: 1500,
        recordedBy: 'user-001',
        recordedByName: '山田太郎',
      },
    }),
    prisma.monthly_mileages.upsert({
      where: { vehicleId_month: { vehicleId: vehicleIds[0], month: '2024-09' } },
      update: {},
      create: {
        tenantId,
        vehicleId: vehicleIds[0],
        month: '2024-09',
        distance: 1200,
        recordedBy: 'user-001',
        recordedByName: '山田太郎',
      },
    }),
    prisma.monthly_mileages.upsert({
      where: { vehicleId_month: { vehicleId: vehicleIds[1], month: '2024-10' } },
      update: {},
      create: {
        tenantId,
        vehicleId: vehicleIds[1],
        month: '2024-10',
        distance: 800,
        recordedBy: 'user-002',
        recordedByName: '鈴木花子',
      },
    }),
  ]);

  console.log(`Created ${mileages.length} monthly mileages`);

  // vendor IDs を取得
  const vendorIds = vendors.map(v => v.id);
  console.log('Vendor IDs:', vendorIds);

  // メンテナンス記録データ
  const maintenanceRecords = await Promise.all([
    prisma.maintenance_records.create({
      data: {
        tenantId,
        vehicleId: vehicleIds[0],
        type: 'oil_change',
        date: new Date('2024-09-15'),
        mileage: 23000,
        cost: 8500,
        vendorId: vendorIds[0],
        description: 'エンジンオイル・フィルター交換',
        nextDueDate: new Date('2025-03-15'),
        nextDueMileage: 28000,
        performedBy: 'user-admin',
        performedByName: '管理者',
        notes: '問題なく完了',
      },
    }),
    prisma.maintenance_records.create({
      data: {
        tenantId,
        vehicleId: vehicleIds[0],
        type: 'tire_change',
        date: new Date('2024-11-01'),
        mileage: 24500,
        cost: 45000,
        vendorId: vendorIds[1],
        description: 'サマータイヤ → ウィンタータイヤ交換',
        tireType: 'winter',
        performedBy: 'user-admin',
        performedByName: '管理者',
        notes: 'スタッドレスタイヤ装着',
      },
    }),
    prisma.maintenance_records.create({
      data: {
        tenantId,
        vehicleId: vehicleIds[1],
        type: 'inspection',
        date: new Date('2024-06-01'),
        mileage: 30000,
        cost: 15000,
        vendorId: vendorIds[0],
        description: '12ヶ月点検',
        nextDueDate: new Date('2025-06-01'),
        performedBy: 'user-admin',
        performedByName: '管理者',
        notes: 'ブレーキパッド残量50%',
      },
    }),
    prisma.maintenance_records.create({
      data: {
        tenantId,
        vehicleId: vehicleIds[2],
        type: 'other',
        date: new Date('2024-08-20'),
        mileage: 10000,
        cost: 5000,
        description: 'ワイパーブレード交換',
        performedBy: 'user-admin',
        performedByName: '管理者',
      },
    }),
  ]);

  console.log(`Created ${maintenanceRecords.length} maintenance records`);

  // PC資産データ
  const pcAssets = await Promise.all([
    prisma.pc_assets.upsert({
      where: { tenantId_assetNumber: { tenantId, assetNumber: 'PC-001' } },
      update: {},
      create: {
        tenantId,
        assetNumber: 'PC-001',
        manufacturer: 'Apple',
        model: 'MacBook Pro 14インチ',
        serialNumber: 'C02XL1234567',
        cpu: 'Apple M3 Pro',
        memory: '18GB',
        storage: '512GB SSD',
        os: 'macOS Sonoma',
        ownershipType: 'owned',
        purchaseDate: new Date('2023-11-01'),
        purchaseCost: 298000,
        assignedUserId: 'user-001',
        assignedUserName: '山田太郎',
        assignedDate: new Date('2023-11-05'),
        warrantyExpiration: new Date('2026-10-31'),
        status: 'active',
        notes: '開発用',
      },
    }),
    prisma.pc_assets.upsert({
      where: { tenantId_assetNumber: { tenantId, assetNumber: 'PC-002' } },
      update: {},
      create: {
        tenantId,
        assetNumber: 'PC-002',
        manufacturer: 'Dell',
        model: 'XPS 15',
        serialNumber: 'DELL123456789',
        cpu: 'Intel Core i7-13700H',
        memory: '32GB',
        storage: '1TB SSD',
        os: 'Windows 11 Pro',
        ownershipType: 'leased',
        leaseCompany: 'オリックス・レンテック',
        leaseStartDate: new Date('2023-04-01'),
        leaseEndDate: new Date('2026-03-31'),
        leaseMonthlyCost: 8500,
        assignedUserId: 'user-002',
        assignedUserName: '鈴木花子',
        assignedDate: new Date('2023-04-10'),
        status: 'active',
        notes: '営業・プレゼン用',
      },
    }),
    prisma.pc_assets.upsert({
      where: { tenantId_assetNumber: { tenantId, assetNumber: 'PC-003' } },
      update: {},
      create: {
        tenantId,
        assetNumber: 'PC-003',
        manufacturer: 'Lenovo',
        model: 'ThinkPad X1 Carbon',
        serialNumber: 'LENOVO987654321',
        cpu: 'Intel Core i5-1345U',
        memory: '16GB',
        storage: '256GB SSD',
        os: 'Windows 11 Pro',
        ownershipType: 'owned',
        purchaseDate: new Date('2024-01-15'),
        purchaseCost: 189000,
        warrantyExpiration: new Date('2027-01-14'),
        status: 'active',
        notes: '予備機',
      },
    }),
  ]);

  console.log(`Created ${pcAssets.length} PC assets`);

  // PC Asset IDs を取得
  const pcAssetIds = pcAssets.map(pc => pc.id);
  console.log('PC Asset IDs:', pcAssetIds);

  // ソフトウェアライセンスデータ
  const licenses = await Promise.all([
    prisma.software_licenses.create({
      data: {
        tenantId,
        pcAssetId: pcAssetIds[0],
        softwareName: 'Microsoft 365 Business',
        licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
        expirationDate: new Date('2025-10-31'),
        monthlyCost: 1500,
      },
    }),
    prisma.software_licenses.create({
      data: {
        tenantId,
        pcAssetId: pcAssetIds[0],
        softwareName: 'Adobe Creative Cloud',
        expirationDate: new Date('2025-06-30'),
        monthlyCost: 6480,
      },
    }),
    prisma.software_licenses.create({
      data: {
        tenantId,
        pcAssetId: pcAssetIds[1],
        softwareName: 'Microsoft 365 Business',
        licenseKey: 'YYYYY-YYYYY-YYYYY-YYYYY-YYYYY',
        expirationDate: new Date('2025-10-31'),
        monthlyCost: 1500,
      },
    }),
    prisma.software_licenses.create({
      data: {
        tenantId,
        pcAssetId: pcAssetIds[1],
        softwareName: 'Salesforce',
        expirationDate: new Date('2025-03-31'),
        monthlyCost: 3000,
      },
    }),
  ]);

  console.log(`Created ${licenses.length} software licenses`);

  console.log('Assets data seeding completed!');
}

seedAssets()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
