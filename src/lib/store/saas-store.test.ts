/**
 * SaaS管理ストアのテスト
 */

import { useSaaSStore } from './saas-store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SaaSService, LicensePlan, LicenseAssignment } from '@/types/saas'; // 型定義参照用

describe('SaaSStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useSaaSStore.setState({
      services: [],
      plans: [],
      assignments: [],
      monthlyCosts: [],
      isLoading: false,
    });
  });

  describe('setLoading', () => {
    it('ローディング状態を設定できる', () => {
      const { setLoading } = useSaaSStore.getState();

      setLoading(true);
      expect(useSaaSStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useSaaSStore.getState().isLoading).toBe(false);
    });
  });

  describe('addService', () => {
    it('新しいSaaSサービスを追加できる', () => {
      const { addService } = useSaaSStore.getState();

      const newService = {
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contactEmail: 'support@slack.com',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      };

      addService(newService);

      const state = useSaaSStore.getState();
      expect(state.services).toHaveLength(1);
      expect(state.services[0].name).toBe('Slack');
      expect(state.services[0]).toHaveProperty('id');
      expect(state.services[0]).toHaveProperty('createdAt');
      expect(state.services[0]).toHaveProperty('updatedAt');
    });

    it('複数のSaaSサービスを追加できる', () => {
      const { addService } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      addService({
        name: 'GitHub',
        category: 'development' as const,
        licenseType: 'user-based' as const,
        vendor: 'GitHub, Inc.',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state = useSaaSStore.getState();
      expect(state.services).toHaveLength(2);
    });
  });

  describe('updateService', () => {
    it('SaaSサービス情報を更新できる', () => {
      const { addService, updateService } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      updateService(serviceId, {
        status: 'inactive',
        notes: 'サービス停止予定',
      });

      const state2 = useSaaSStore.getState();
      expect(state2.services[0].status).toBe('inactive');
      expect(state2.services[0].notes).toBe('サービス停止予定');
    });

    it('存在しないサービスを更新しようとしても他のサービスに影響しない', () => {
      const { addService, updateService } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      updateService('non-existent-id', { status: 'inactive' });

      const state = useSaaSStore.getState();
      expect(state.services[0].status).toBe('active');
    });
  });

  describe('deleteService', () => {
    it('SaaSサービスを削除できる', () => {
      const { addService, deleteService } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      deleteService(serviceId);

      const state2 = useSaaSStore.getState();
      expect(state2.services).toHaveLength(0);
    });

    it('サービス削除時に関連するプランと割り当ても削除される', () => {
      const { addService, addPlan, addAssignment, deleteService } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      deleteService(serviceId);

      const state3 = useSaaSStore.getState();
      expect(state3.services).toHaveLength(0);
      expect(state3.plans).toHaveLength(0);
      expect(state3.assignments).toHaveLength(0);
    });
  });

  describe('getServiceById', () => {
    it('IDでSaaSサービスを取得できる', () => {
      const { addService, getServiceById } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state = useSaaSStore.getState();
      const serviceId = state.services[0].id;

      const service = getServiceById(serviceId);
      expect(service).toBeDefined();
      expect(service?.name).toBe('Slack');
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const { getServiceById } = useSaaSStore.getState();

      const service = getServiceById('non-existent-id');
      expect(service).toBeUndefined();
    });
  });

  describe('getServicesByCategory', () => {
    it('カテゴリでSaaSサービスを絞り込める', () => {
      const { addService, getServicesByCategory } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      addService({
        name: 'GitHub',
        category: 'development' as const,
        licenseType: 'user-based' as const,
        vendor: 'GitHub, Inc.',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const commServices = getServicesByCategory('communication');
      expect(commServices).toHaveLength(1);
      expect(commServices[0].name).toBe('Slack');

      const devServices = getServicesByCategory('development');
      expect(devServices).toHaveLength(1);
      expect(devServices[0].name).toBe('GitHub');
    });
  });

  describe('getServicesByLicenseType', () => {
    it('ライセンスタイプでSaaSサービスを絞り込める', () => {
      const { addService, getServicesByLicenseType } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      addService({
        name: 'Zoom',
        category: 'communication' as const,
        licenseType: 'fixed' as const,
        vendor: 'Zoom Video Communications',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const userBasedServices = getServicesByLicenseType('user-based');
      expect(userBasedServices).toHaveLength(1);
      expect(userBasedServices[0].name).toBe('Slack');

      const fixedServices = getServicesByLicenseType('fixed');
      expect(fixedServices).toHaveLength(1);
      expect(fixedServices[0].name).toBe('Zoom');
    });
  });

  describe('addPlan', () => {
    it('新しいライセンスプランを追加できる', () => {
      const { addService, addPlan } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack Technologies',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      expect(state2.plans).toHaveLength(1);
      expect(state2.plans[0].planName).toBe('Standard');
      expect(state2.plans[0].pricePerUser).toBe(850);
    });

    it('固定価格プランを追加できる', () => {
      const { addService, addPlan } = useSaaSStore.getState();

      addService({
        name: 'Zoom',
        category: 'communication' as const,
        licenseType: 'fixed' as const,
        vendor: 'Zoom',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Business',
        fixedPrice: 20000,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      expect(state2.plans[0].fixedPrice).toBe(20000);
    });
  });

  describe('updatePlan', () => {
    it('ライセンスプラン情報を更新できる', () => {
      const { addService, addPlan, updatePlan } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      updatePlan(planId, {
        pricePerUser: 900,
        isActive: false,
      });

      const state3 = useSaaSStore.getState();
      expect(state3.plans[0].pricePerUser).toBe(900);
      expect(state3.plans[0].isActive).toBe(false);
    });
  });

  describe('deletePlan', () => {
    it('ライセンスプランを削除できる', () => {
      const { addService, addPlan, deletePlan } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      deletePlan(planId);

      const state3 = useSaaSStore.getState();
      expect(state3.plans).toHaveLength(0);
    });

    it('プラン削除時に関連する割り当ても削除される', () => {
      const { addService, addPlan, addAssignment, deletePlan } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      deletePlan(planId);

      const state3 = useSaaSStore.getState();
      expect(state3.plans).toHaveLength(0);
      expect(state3.assignments).toHaveLength(0);
    });
  });

  describe('getPlanById', () => {
    it('IDでライセンスプランを取得できる', () => {
      const { addService, addPlan, getPlanById } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      const plan = getPlanById(planId);
      expect(plan).toBeDefined();
      expect(plan?.planName).toBe('Standard');
    });
  });

  describe('getPlansByServiceId', () => {
    it('サービスIDでライセンスプランを取得できる', () => {
      const { addService, addPlan, getPlansByServiceId } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      addPlan({
        serviceId,
        planName: 'Plus',
        pricePerUser: 1250,
        isActive: false,
      });

      const plans = getPlansByServiceId(serviceId);
      expect(plans).toHaveLength(2);
    });
  });

  describe('getActivePlanByServiceId', () => {
    it('サービスのアクティブなプランを取得できる', () => {
      const { addService, addPlan, getActivePlanByServiceId } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      addPlan({
        serviceId,
        planName: 'Plus',
        pricePerUser: 1250,
        isActive: false,
      });

      const activePlan = getActivePlanByServiceId(serviceId);
      expect(activePlan).toBeDefined();
      expect(activePlan?.planName).toBe('Standard');
      expect(activePlan?.isActive).toBe(true);
    });
  });

  describe('addAssignment', () => {
    it('新しいライセンス割り当てを追加できる', () => {
      const { addService, addPlan, addAssignment } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const state3 = useSaaSStore.getState();
      expect(state3.assignments).toHaveLength(1);
      expect(state3.assignments[0].userName).toBe('テストユーザー');
    });

    it('最終使用日を含むライセンス割り当てを追加できる', () => {
      const { addService, addPlan, addAssignment } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
        lastUsedAt: '2024-10-15T10:00:00Z',
      });

      const state3 = useSaaSStore.getState();
      expect(state3.assignments[0].lastUsedAt).toBe('2024-10-15T10:00:00Z');
    });
  });

  describe('updateAssignment', () => {
    it('ライセンス割り当て情報を更新できる', () => {
      const { addService, addPlan, addAssignment, updateAssignment } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const state3 = useSaaSStore.getState();
      const assignmentId = state3.assignments[0].id;

      updateAssignment(assignmentId, {
        status: 'inactive',
        lastUsedAt: '2024-10-19T10:00:00Z',
      });

      const state4 = useSaaSStore.getState();
      expect(state4.assignments[0].status).toBe('inactive');
      expect(state4.assignments[0].lastUsedAt).toBe('2024-10-19T10:00:00Z');
    });
  });

  describe('deleteAssignment', () => {
    it('ライセンス割り当てを削除できる', () => {
      const { addService, addPlan, addAssignment, deleteAssignment } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const state3 = useSaaSStore.getState();
      const assignmentId = state3.assignments[0].id;

      deleteAssignment(assignmentId);

      const state4 = useSaaSStore.getState();
      expect(state4.assignments).toHaveLength(0);
    });
  });

  describe('getAssignmentById', () => {
    it('IDでライセンス割り当てを取得できる', () => {
      const { addService, addPlan, addAssignment, getAssignmentById } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const state3 = useSaaSStore.getState();
      const assignmentId = state3.assignments[0].id;

      const assignment = getAssignmentById(assignmentId);
      expect(assignment).toBeDefined();
      expect(assignment?.userName).toBe('テストユーザー');
    });
  });

  describe('getAssignmentsByServiceId', () => {
    it('サービスIDでライセンス割り当てを取得できる', () => {
      const { addService, addPlan, addAssignment, getAssignmentsByServiceId } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'ユーザー1',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      addAssignment({
        serviceId,
        planId,
        userId: 'user-2',
        userName: 'ユーザー2',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const assignments = getAssignmentsByServiceId(serviceId);
      expect(assignments).toHaveLength(2);
    });
  });

  describe('getAssignmentsByUserId', () => {
    it('ユーザーIDでライセンス割り当てを取得できる', () => {
      const { addService, addPlan, addAssignment, getAssignmentsByUserId } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      addService({
        name: 'GitHub',
        category: 'development' as const,
        licenseType: 'user-based' as const,
        vendor: 'GitHub',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const slackId = state1.services[0].id;
      const githubId = state1.services[1].id;

      addPlan({
        serviceId: slackId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      addPlan({
        serviceId: githubId,
        planName: 'Team',
        pricePerUser: 450,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();

      addAssignment({
        serviceId: slackId,
        planId: state2.plans[0].id,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      addAssignment({
        serviceId: githubId,
        planId: state2.plans[1].id,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const assignments = getAssignmentsByUserId('user-1');
      expect(assignments).toHaveLength(2);
    });
  });

  describe('getActiveAssignmentsByServiceId', () => {
    it('サービスのアクティブなライセンス割り当てを取得できる', () => {
      const { addService, addPlan, addAssignment, getActiveAssignmentsByServiceId } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'ユーザー1',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      addAssignment({
        serviceId,
        planId,
        userId: 'user-2',
        userName: 'ユーザー2',
        assignedDate: '2024-01-01',
        status: 'inactive',
      });

      const activeAssignments = getActiveAssignmentsByServiceId(serviceId);
      expect(activeAssignments).toHaveLength(1);
      expect(activeAssignments[0].userId).toBe('user-1');
    });
  });

  describe('統計情報', () => {
    beforeEach(() => {
      const { addService, addPlan, addAssignment } = useSaaSStore.getState();

      // Slack
      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const slackId = state1.services[0].id;

      addPlan({
        serviceId: slackId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId: slackId,
        planId,
        userId: 'user-1',
        userName: 'ユーザー1',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      addAssignment({
        serviceId: slackId,
        planId,
        userId: 'user-2',
        userName: 'ユーザー2',
        assignedDate: '2024-01-01',
        status: 'inactive',
      });
    });

    it('getTotalServices: 総サービス数を取得できる', () => {
      const { getTotalServices } = useSaaSStore.getState();
      expect(getTotalServices()).toBe(1);
    });

    it('getTotalLicenses: 総ライセンス数を取得できる', () => {
      const { getTotalLicenses } = useSaaSStore.getState();
      expect(getTotalLicenses()).toBe(2);
    });

    it('getActiveLicenses: アクティブなライセンス数を取得できる', () => {
      const { getActiveLicenses } = useSaaSStore.getState();
      expect(getActiveLicenses()).toBe(1);
    });

    it('getInactiveLicenses: 非アクティブなライセンス数を取得できる', () => {
      const { getInactiveLicenses } = useSaaSStore.getState();
      expect(getInactiveLicenses()).toBe(1);
    });

    it('getTotalMonthlyCost: ユーザーベースの月額コストを計算できる', () => {
      const { getTotalMonthlyCost } = useSaaSStore.getState();
      // 850円 × 1人（アクティブなユーザー）
      expect(getTotalMonthlyCost()).toBe(850);
    });

    it('getTotalMonthlyCost: 固定価格の月額コストを計算できる', () => {
      const { addService, addPlan, getTotalMonthlyCost } = useSaaSStore.getState();

      addService({
        name: 'Zoom',
        category: 'communication' as const,
        licenseType: 'fixed' as const,
        vendor: 'Zoom',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const zoomId = state1.services.find(s => s.name === 'Zoom')!.id;

      addPlan({
        serviceId: zoomId,
        planName: 'Business',
        fixedPrice: 20000,
        isActive: true,
      });

      const total = getTotalMonthlyCost();
      // Slack: 850円 × 1人 + Zoom: 20000円
      expect(total).toBe(850 + 20000);
    });

    it('getUnusedLicensesCost: 30日以上未使用のライセンスコストを計算できる', () => {
      const { addAssignment, updateAssignment, getUnusedLicensesCost } = useSaaSStore.getState();

      const state = useSaaSStore.getState();
      const serviceId = state.services[0].id;
      const planId = state.plans[0].id;
      const user1AssignmentId = state.assignments[0].id;

      // user-1を最近使用したことにする（29日前）
      const twentyNineDaysAgo = new Date();
      twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);
      updateAssignment(user1AssignmentId, {
        lastUsedAt: twentyNineDaysAgo.toISOString(),
      });

      // user-3を35日前に使用したことにする
      const thirtyFiveDaysAgo = new Date();
      thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);

      addAssignment({
        serviceId,
        planId,
        userId: 'user-3',
        userName: 'ユーザー3',
        assignedDate: '2024-01-01',
        status: 'active',
        lastUsedAt: thirtyFiveDaysAgo.toISOString(),
      });

      const unusedCost = getUnusedLicensesCost();
      // user-3のみが30日以上未使用
      expect(unusedCost).toBe(850);
    });
  });

  describe('ユーザー別統計情報', () => {
    it('getUserTotalCost: ユーザーのユーザーベースライセンス総コストを計算できる', () => {
      const { addService, addPlan, addAssignment, getUserTotalCost } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const totalCost = getUserTotalCost('user-1');
      expect(totalCost).toBe(850);
    });

    it('getUserTotalCost: ユーザーの固定価格ライセンスコストを人数で按分できる', () => {
      const { addService, addPlan, addAssignment, getUserTotalCost } = useSaaSStore.getState();

      addService({
        name: 'Zoom',
        category: 'communication' as const,
        licenseType: 'fixed' as const,
        vendor: 'Zoom',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Business',
        fixedPrice: 20000,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      // 2人のユーザーに割り当て
      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'ユーザー1',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      addAssignment({
        serviceId,
        planId,
        userId: 'user-2',
        userName: 'ユーザー2',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const totalCost = getUserTotalCost('user-1');
      // 20000円 ÷ 2人 = 10000円
      expect(totalCost).toBe(10000);
    });

    it('getUserSaaSDetails: ユーザーのSaaS詳細情報を取得できる', () => {
      const { addService, addPlan, addAssignment, getUserSaaSDetails } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const serviceId = state1.services[0].id;

      addPlan({
        serviceId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const planId = state2.plans[0].id;

      addAssignment({
        serviceId,
        planId,
        userId: 'user-1',
        userName: 'テストユーザー',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const details = getUserSaaSDetails('user-1');
      expect(details).toHaveLength(1);
      expect(details[0].service.name).toBe('Slack');
      expect(details[0].plan.planName).toBe('Standard');
      expect(details[0].monthlyCost).toBe(850);
    });

    it('getUsersByTotalCost: 全ユーザーのコスト順リストを取得できる', () => {
      const { addService, addPlan, addAssignment, getUsersByTotalCost } = useSaaSStore.getState();

      addService({
        name: 'Slack',
        category: 'communication' as const,
        licenseType: 'user-based' as const,
        vendor: 'Slack',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      addService({
        name: 'GitHub',
        category: 'development' as const,
        licenseType: 'user-based' as const,
        vendor: 'GitHub',
        contractStart: '2024-01-01',
        contractEnd: '2024-12-31',
        status: 'active' as const,
      });

      const state1 = useSaaSStore.getState();
      const slackId = state1.services[0].id;
      const githubId = state1.services[1].id;

      addPlan({
        serviceId: slackId,
        planName: 'Standard',
        pricePerUser: 850,
        isActive: true,
      });

      addPlan({
        serviceId: githubId,
        planName: 'Team',
        pricePerUser: 450,
        isActive: true,
      });

      const state2 = useSaaSStore.getState();
      const slackPlanId = state2.plans[0].id;
      const githubPlanId = state2.plans[1].id;

      // ユーザー1: Slack + GitHub
      addAssignment({
        serviceId: slackId,
        planId: slackPlanId,
        userId: 'user-1',
        userName: 'ユーザー1',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      addAssignment({
        serviceId: githubId,
        planId: githubPlanId,
        userId: 'user-1',
        userName: 'ユーザー1',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      // ユーザー2: Slack のみ
      addAssignment({
        serviceId: slackId,
        planId: slackPlanId,
        userId: 'user-2',
        userName: 'ユーザー2',
        assignedDate: '2024-01-01',
        status: 'active',
      });

      const users = getUsersByTotalCost();
      expect(users).toHaveLength(2);
      // コスト順にソートされている
      expect(users[0].userId).toBe('user-1');
      expect(users[0].totalCost).toBe(1300); // 850 + 450
      expect(users[0].serviceCount).toBe(2);
      expect(users[1].userId).toBe('user-2');
      expect(users[1].totalCost).toBe(850);
      expect(users[1].serviceCount).toBe(1);
    });
  });
});
