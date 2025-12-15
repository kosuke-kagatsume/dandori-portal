import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

/**
 * バッチAPI: 資産管理に必要な全データを一括取得
 *
 * 従来: 7つのAPIを直列実行 → 合計3-5秒
 * 改善: 1つのAPIで並列取得 → 1-2秒
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    // 全データを並列取得
    const [
      vehicles,
      pcAssets,
      generalAssets,
      vendors,
      maintenanceRecords,
      repairRecords,
    ] = await Promise.all([
      // 車両一覧（必要なフィールドのみ）
      prisma.vehicles.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          vehicleNumber: true,
          licensePlate: true,
          make: true,
          model: true,
          year: true,
          color: true,
          ownershipType: true,
          status: true,
          assignedUserId: true,
          assignedUserName: true,
          assignedDate: true,
          inspectionDate: true,
          maintenanceDate: true,
          insuranceDate: true,
          tireChangeDate: true,
          currentTireType: true,
          leaseCompany: true,
          leaseMonthlyCost: true,
          leaseStartDate: true,
          leaseEndDate: true,
          leaseContact: true,
          leasePhone: true,
          purchaseCost: true,
          purchaseDate: true,
          mileageTracking: true,
          currentMileage: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { vehicleNumber: 'asc' },
      }),

      // PC資産一覧
      prisma.pc_assets.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          assetNumber: true,
          manufacturer: true,
          model: true,
          serialNumber: true,
          cpu: true,
          memory: true,
          storage: true,
          os: true,
          ownershipType: true,
          status: true,
          assignedUserId: true,
          assignedUserName: true,
          assignedDate: true,
          purchaseCost: true,
          purchaseDate: true,
          warrantyExpiration: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { assetNumber: 'asc' },
      }),

      // 汎用資産一覧
      prisma.general_assets.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          assetNumber: true,
          category: true,
          name: true,
          manufacturer: true,
          model: true,
          serialNumber: true,
          ownershipType: true,
          status: true,
          assignedUserId: true,
          assignedUserName: true,
          assignedDate: true,
          purchaseCost: true,
          purchaseDate: true,
          leaseMonthlyCost: true,
          leaseStartDate: true,
          leaseEndDate: true,
          warrantyExpiration: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { assetNumber: 'asc' },
      }),

      // 業者一覧
      prisma.vendors.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          contactPerson: true,
          phone: true,
          email: true,
          address: true,
          rating: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      }),

      // メンテナンス記録
      prisma.maintenance_records.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          vehicleId: true,
          type: true,
          date: true,
          mileage: true,
          cost: true,
          vendorId: true,
          description: true,
          nextDueDate: true,
          nextDueMileage: true,
          tireType: true,
          performedBy: true,
          performedByName: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          vehicles: {
            select: {
              id: true,
              vehicleNumber: true,
              licensePlate: true,
            },
          },
          vendors: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),

      // 修理記録
      prisma.repair_records.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          pcAssetId: true,
          generalAssetId: true,
          repairType: true,
          date: true,
          cost: true,
          vendorId: true,
          vendorName: true,
          symptom: true,
          description: true,
          status: true,
          completedDate: true,
          performedBy: true,
          performedByName: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          pc_assets: {
            select: {
              id: true,
              assetNumber: true,
              manufacturer: true,
              model: true,
            },
          },
          general_assets: {
            select: {
              id: true,
              assetNumber: true,
              category: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    // 集計情報も計算
    const summary = {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.status === 'active').length,
      totalPCs: pcAssets.length,
      activePCs: pcAssets.filter((p) => p.status === 'active').length,
      totalGeneralAssets: generalAssets.length,
      activeGeneralAssets: generalAssets.filter((a) => a.status === 'active').length,
      totalVendors: vendors.length,
      totalMaintenanceRecords: maintenanceRecords.length,
      totalRepairRecords: repairRecords.length,
    };

    return successResponse(
      {
        vehicles,
        pcAssets,
        generalAssets,
        vendors,
        maintenanceRecords,
        repairRecords,
        summary,
      },
      {
        cacheSeconds: 60, // 1分キャッシュ
      }
    );
  } catch (error) {
    return handleApiError(error, '資産データ一括取得');
  }
}
