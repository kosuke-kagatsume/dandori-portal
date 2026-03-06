import { prisma } from '@/lib/prisma';

/**
 * positionId / departmentId を検証し、対応する名前を返す
 * 存在しない or 非アクティブなら例外をスロー
 */
export async function resolvePositionAndDepartment(
  tenantId: string,
  positionId?: string,
  departmentId?: string,
): Promise<{ position?: string; department?: string }> {
  const result: { position?: string; department?: string } = {};

  if (positionId) {
    const pos = await prisma.positions.findFirst({
      where: { id: positionId, tenantId, isActive: true },
      select: { name: true },
    });
    if (!pos) {
      throw new ValidationError('指定された役職が見つかりません');
    }
    result.position = pos.name;
  }

  if (departmentId) {
    const dept = await prisma.departments.findFirst({
      where: { id: departmentId, tenantId, isActive: true },
      select: { name: true },
    });
    if (!dept) {
      throw new ValidationError('指定された部署が見つかりません');
    }
    result.department = dept.name;
  }

  return result;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * department / position の文字列名から departmentId / positionId を逆引き
 * CSVインポート等でIDが未指定の場合に利用
 */
export async function resolveIdsFromNames(
  tenantId: string,
  departmentName?: string,
  positionName?: string,
): Promise<{ departmentId?: string; positionId?: string }> {
  const result: { departmentId?: string; positionId?: string } = {};

  if (departmentName) {
    const dept = await prisma.departments.findFirst({
      where: { tenantId, name: departmentName, isActive: true },
      select: { id: true },
    });
    if (dept) result.departmentId = dept.id;
  }

  if (positionName) {
    const pos = await prisma.positions.findFirst({
      where: { tenantId, name: positionName, isActive: true },
      select: { id: true },
    });
    if (pos) result.positionId = pos.id;
  }

  return result;
}
