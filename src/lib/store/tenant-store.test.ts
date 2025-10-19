/**
 * Tenant ストアのテスト
 */

import { useTenantStore } from './tenant-store';
import type { Tenant } from '@/types';

describe('TenantStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useTenantStore.setState({
      currentTenant: null,
      tenants: [],
    });
  });

  describe('setCurrentTenant', () => {
    it('現在のテナントを設定できる', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().setCurrentTenant(tenant);

      expect(useTenantStore.getState().currentTenant).toEqual(tenant);
    });

    it('既存のcurrentTenantを上書きできる', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      useTenantStore.getState().setCurrentTenant(tenant1);
      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-1');

      useTenantStore.getState().setCurrentTenant(tenant2);
      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-2');
    });
  });

  describe('setTenants', () => {
    it('テナント配列を設定できる', () => {
      const tenants: Tenant[] = [
        {
          id: 'tenant-1',
          name: 'テスト株式会社',
          logo: '/logo.png',
          timezone: 'Asia/Tokyo',
          closingDay: '末',
          weekStartDay: 0,
        },
        {
          id: 'tenant-2',
          name: 'サンプル合同会社',
          logo: '/logo2.png',
          timezone: 'Asia/Tokyo',
          closingDay: '20',
          weekStartDay: 1,
        },
      ];

      useTenantStore.getState().setTenants(tenants);

      expect(useTenantStore.getState().tenants).toHaveLength(2);
      expect(useTenantStore.getState().tenants).toEqual(tenants);
    });

    it('currentTenantがnullの場合、最初のテナントを自動的にcurrentTenantに設定する', () => {
      const tenants: Tenant[] = [
        {
          id: 'tenant-1',
          name: 'テスト株式会社',
          logo: '/logo.png',
          timezone: 'Asia/Tokyo',
          closingDay: '末',
          weekStartDay: 0,
        },
        {
          id: 'tenant-2',
          name: 'サンプル合同会社',
          logo: '/logo2.png',
          timezone: 'Asia/Tokyo',
          closingDay: '20',
          weekStartDay: 1,
        },
      ];

      useTenantStore.getState().setTenants(tenants);

      expect(useTenantStore.getState().currentTenant).toEqual(tenants[0]);
    });

    it('currentTenantが既に設定されている場合は上書きしない', () => {
      const existingTenant: Tenant = {
        id: 'tenant-existing',
        name: '既存テナント',
        logo: '/existing.png',
        timezone: 'Asia/Tokyo',
        closingDay: '15',
        weekStartDay: 2,
      };

      useTenantStore.getState().setCurrentTenant(existingTenant);

      const newTenants: Tenant[] = [
        {
          id: 'tenant-1',
          name: 'テスト株式会社',
          logo: '/logo.png',
          timezone: 'Asia/Tokyo',
          closingDay: '末',
          weekStartDay: 0,
        },
        {
          id: 'tenant-2',
          name: 'サンプル合同会社',
          logo: '/logo2.png',
          timezone: 'Asia/Tokyo',
          closingDay: '20',
          weekStartDay: 1,
        },
      ];

      useTenantStore.getState().setTenants(newTenants);

      expect(useTenantStore.getState().currentTenant).toEqual(existingTenant);
      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-existing');
    });

    it('空配列を設定してもcurrentTenantは変更されない', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().setCurrentTenant(tenant);
      useTenantStore.getState().setTenants([]);

      expect(useTenantStore.getState().currentTenant).toEqual(tenant);
      expect(useTenantStore.getState().tenants).toHaveLength(0);
    });
  });

  describe('addTenant', () => {
    it('新しいテナントを配列に追加できる', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().addTenant(tenant);

      expect(useTenantStore.getState().tenants).toHaveLength(1);
      expect(useTenantStore.getState().tenants[0]).toEqual(tenant);
    });

    it('currentTenantがnullの場合、追加したテナントをcurrentTenantに設定する', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().addTenant(tenant);

      expect(useTenantStore.getState().currentTenant).toEqual(tenant);
    });

    it('currentTenantが既に設定されている場合は上書きしない', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      useTenantStore.getState().addTenant(tenant1);
      useTenantStore.getState().addTenant(tenant2);

      expect(useTenantStore.getState().currentTenant).toEqual(tenant1);
      expect(useTenantStore.getState().tenants).toHaveLength(2);
    });

    it('複数のテナントを順次追加できる', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      const tenant3: Tenant = {
        id: 'tenant-3',
        name: 'デモ株式会社',
        logo: '/logo3.png',
        timezone: 'Asia/Tokyo',
        closingDay: '15',
        weekStartDay: 2,
      };

      useTenantStore.getState().addTenant(tenant1);
      useTenantStore.getState().addTenant(tenant2);
      useTenantStore.getState().addTenant(tenant3);

      expect(useTenantStore.getState().tenants).toHaveLength(3);
      const state = useTenantStore.getState();
      const foundTenant1 = state.tenants.find((t) => t.id === 'tenant-1');
      const foundTenant2 = state.tenants.find((t) => t.id === 'tenant-2');
      const foundTenant3 = state.tenants.find((t) => t.id === 'tenant-3');

      expect(foundTenant1).toEqual(tenant1);
      expect(foundTenant2).toEqual(tenant2);
      expect(foundTenant3).toEqual(tenant3);
    });
  });

  describe('updateTenant', () => {
    it('指定したIDのテナントを更新できる', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().addTenant(tenant);

      useTenantStore.getState().updateTenant('tenant-1', {
        name: '更新後の会社名',
        closingDay: '20',
      });

      const state = useTenantStore.getState();
      const updatedTenant = state.tenants.find((t) => t.id === 'tenant-1');

      expect(updatedTenant?.name).toBe('更新後の会社名');
      expect(updatedTenant?.closingDay).toBe('20');
      expect(updatedTenant?.timezone).toBe('Asia/Tokyo'); // 変更されていない項目
    });

    it('currentTenantのIDと一致する場合、currentTenantも更新される', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().addTenant(tenant);

      useTenantStore.getState().updateTenant('tenant-1', {
        name: '更新後の会社名',
        weekStartDay: 1,
      });

      expect(useTenantStore.getState().currentTenant?.name).toBe('更新後の会社名');
      expect(useTenantStore.getState().currentTenant?.weekStartDay).toBe(1);
    });

    it('currentTenantのIDと一致しない場合、currentTenantは更新されない', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      useTenantStore.getState().addTenant(tenant1);
      useTenantStore.getState().addTenant(tenant2);

      // tenant1がcurrentTenantに設定されている状態でtenant2を更新
      useTenantStore.getState().updateTenant('tenant-2', {
        name: '更新後のサンプル会社',
      });

      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-1');
      expect(useTenantStore.getState().currentTenant?.name).toBe('テスト株式会社');

      // tenant2は更新されている
      const state = useTenantStore.getState();
      const updatedTenant2 = state.tenants.find((t) => t.id === 'tenant-2');
      expect(updatedTenant2?.name).toBe('更新後のサンプル会社');
    });

    it('存在しないIDで更新しても何も起こらない', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().addTenant(tenant);

      useTenantStore.getState().updateTenant('non-existent-id', {
        name: '存在しない更新',
      });

      expect(useTenantStore.getState().tenants).toHaveLength(1);
      const state = useTenantStore.getState();
      const foundTenant = state.tenants.find((t) => t.id === 'tenant-1');
      expect(foundTenant?.name).toBe('テスト株式会社'); // 変更されていない
    });
  });

  describe('removeTenant', () => {
    it('指定したIDのテナントを削除できる', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      useTenantStore.getState().addTenant(tenant1);
      useTenantStore.getState().addTenant(tenant2);

      expect(useTenantStore.getState().tenants).toHaveLength(2);

      useTenantStore.getState().removeTenant('tenant-2');

      expect(useTenantStore.getState().tenants).toHaveLength(1);
      const state = useTenantStore.getState();
      const foundTenant = state.tenants.find((t) => t.id === 'tenant-1');
      expect(foundTenant).toEqual(tenant1);
    });

    it('削除したテナントがcurrentTenantの場合、最初の残りテナントをcurrentTenantに設定する', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      useTenantStore.getState().addTenant(tenant1);
      useTenantStore.getState().addTenant(tenant2);

      // tenant1がcurrentTenantに設定されている
      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-1');

      useTenantStore.getState().removeTenant('tenant-1');

      // tenant2が新しいcurrentTenantになる
      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-2');
    });

    it('削除したテナントがcurrentTenantで残りテナントがない場合、currentTenantをnullにする', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().addTenant(tenant);

      expect(useTenantStore.getState().currentTenant).toEqual(tenant);

      useTenantStore.getState().removeTenant('tenant-1');

      expect(useTenantStore.getState().currentTenant).toBeNull();
      expect(useTenantStore.getState().tenants).toHaveLength(0);
    });

    it('削除したテナントがcurrentTenantでない場合、currentTenantは変更されない', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      const tenant3: Tenant = {
        id: 'tenant-3',
        name: 'デモ株式会社',
        logo: '/logo3.png',
        timezone: 'Asia/Tokyo',
        closingDay: '15',
        weekStartDay: 2,
      };

      useTenantStore.getState().addTenant(tenant1);
      useTenantStore.getState().addTenant(tenant2);
      useTenantStore.getState().addTenant(tenant3);

      // tenant1がcurrentTenantに設定されている
      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-1');

      // tenant2を削除
      useTenantStore.getState().removeTenant('tenant-2');

      // currentTenantは変わらず
      expect(useTenantStore.getState().currentTenant?.id).toBe('tenant-1');
      expect(useTenantStore.getState().tenants).toHaveLength(2);
    });

    it('存在しないIDで削除しても何も起こらない', () => {
      const tenant: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      useTenantStore.getState().addTenant(tenant);

      useTenantStore.getState().removeTenant('non-existent-id');

      expect(useTenantStore.getState().tenants).toHaveLength(1);
      expect(useTenantStore.getState().currentTenant).toEqual(tenant);
    });
  });

  describe('複合的な状態変更', () => {
    it('複数の操作を組み合わせて実行できる', () => {
      const tenant1: Tenant = {
        id: 'tenant-1',
        name: 'テスト株式会社',
        logo: '/logo.png',
        timezone: 'Asia/Tokyo',
        closingDay: '末',
        weekStartDay: 0,
      };

      const tenant2: Tenant = {
        id: 'tenant-2',
        name: 'サンプル合同会社',
        logo: '/logo2.png',
        timezone: 'Asia/Tokyo',
        closingDay: '20',
        weekStartDay: 1,
      };

      const tenant3: Tenant = {
        id: 'tenant-3',
        name: 'デモ株式会社',
        logo: '/logo3.png',
        timezone: 'Asia/Tokyo',
        closingDay: '15',
        weekStartDay: 2,
      };

      // 追加
      useTenantStore.getState().addTenant(tenant1);
      useTenantStore.getState().addTenant(tenant2);

      // 更新
      useTenantStore.getState().updateTenant('tenant-1', {
        name: '更新後のテスト株式会社',
      });

      // 追加
      useTenantStore.getState().addTenant(tenant3);

      // 削除
      useTenantStore.getState().removeTenant('tenant-2');

      // currentTenantを変更
      useTenantStore.getState().setCurrentTenant(tenant3);

      const state = useTenantStore.getState();

      expect(state.tenants).toHaveLength(2);
      const foundTenant1 = state.tenants.find((t) => t.id === 'tenant-1');
      const foundTenant3 = state.tenants.find((t) => t.id === 'tenant-3');
      expect(foundTenant1?.name).toBe('更新後のテスト株式会社');
      expect(foundTenant3).toEqual(tenant3);
      expect(state.currentTenant?.id).toBe('tenant-3');
    });
  });
});
