/**
 * CompanySettingsStore のテスト
 */

import { useCompanySettingsStore } from './company-settings-store';
import type { CompanyInfo, PayrollSettings, YearEndAdjustmentSettings } from './company-settings-store';

describe('CompanySettingsStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useCompanySettingsStore.getState().resetSettings();
  });

  describe('初期状態', () => {
    it('デフォルトの会社情報が設定されている', () => {
      const { companyInfo } = useCompanySettingsStore.getState();

      expect(companyInfo.name).toBe('サンプル株式会社');
      expect(companyInfo.nameKana).toBe('サンプルカブシキガイシャ');
      expect(companyInfo.postalCode).toBe('100-0001');
      expect(companyInfo.address).toBe('東京都千代田区千代田1-1-1');
      expect(companyInfo.phone).toBe('03-1234-5678');
      expect(companyInfo.email).toBe('info@sample.co.jp');
      expect(companyInfo.representativeName).toBe('山田 太郎');
      expect(companyInfo.representativeTitle).toBe('代表取締役');
      expect(companyInfo.taxOffice).toBe('麹町税務署');
      expect(companyInfo.fiscalYearEnd).toBe('03');
    });

    it('デフォルトの給与設定が設定されている', () => {
      const { payrollSettings } = useCompanySettingsStore.getState();

      expect(payrollSettings.paymentDay).toBe(25);
      expect(payrollSettings.paymentDayType).toBe('current');
      expect(payrollSettings.closingDay).toBe(31);
      expect(payrollSettings.defaultPayType).toBe('monthly');
      expect(payrollSettings.standardWorkHours).toBe(8);
      expect(payrollSettings.standardWorkDays).toBe(20);
      expect(payrollSettings.enableHealthInsurance).toBe(true);
      expect(payrollSettings.enablePensionInsurance).toBe(true);
      expect(payrollSettings.enableEmploymentInsurance).toBe(true);
      expect(payrollSettings.enableIncomeTax).toBe(true);
      expect(payrollSettings.enableResidentTax).toBe(true);
    });

    it('デフォルトの年末調整設定が設定されている', () => {
      const { yearEndAdjustmentSettings } = useCompanySettingsStore.getState();

      expect(yearEndAdjustmentSettings.adjustmentStartMonth).toBe(11);
      expect(yearEndAdjustmentSettings.adjustmentEndMonth).toBe(12);
      expect(yearEndAdjustmentSettings.enableBasicDeduction).toBe(true);
      expect(yearEndAdjustmentSettings.enableSpouseDeduction).toBe(true);
      expect(yearEndAdjustmentSettings.enableDependentDeduction).toBe(true);
      expect(yearEndAdjustmentSettings.enableInsuranceDeduction).toBe(true);
      expect(yearEndAdjustmentSettings.enableSocialInsuranceDeduction).toBe(true);
      expect(yearEndAdjustmentSettings.withholdingSlipFormat).toBe('standard');
      expect(yearEndAdjustmentSettings.includeQRCode).toBe(false);
    });
  });

  describe('updateCompanyInfo', () => {
    it('会社名を更新できる', () => {
      const { updateCompanyInfo } = useCompanySettingsStore.getState();

      updateCompanyInfo({ name: 'テスト株式会社' });

      const { companyInfo } = useCompanySettingsStore.getState();
      expect(companyInfo.name).toBe('テスト株式会社');
      // 他のフィールドは変わらない
      expect(companyInfo.nameKana).toBe('サンプルカブシキガイシャ');
    });

    it('複数のフィールドを同時に更新できる', () => {
      const { updateCompanyInfo } = useCompanySettingsStore.getState();

      updateCompanyInfo({
        name: 'テスト株式会社',
        nameKana: 'テストカブシキガイシャ',
        postalCode: '150-0001',
        address: '東京都渋谷区神宮前1-1-1',
      });

      const { companyInfo } = useCompanySettingsStore.getState();
      expect(companyInfo.name).toBe('テスト株式会社');
      expect(companyInfo.nameKana).toBe('テストカブシキガイシャ');
      expect(companyInfo.postalCode).toBe('150-0001');
      expect(companyInfo.address).toBe('東京都渋谷区神宮前1-1-1');
      // 更新していないフィールドは変わらない
      expect(companyInfo.phone).toBe('03-1234-5678');
    });

    it('代表者情報を更新できる', () => {
      const { updateCompanyInfo } = useCompanySettingsStore.getState();

      updateCompanyInfo({
        representativeName: '田中 花子',
        representativeTitle: '代表取締役社長',
      });

      const { companyInfo } = useCompanySettingsStore.getState();
      expect(companyInfo.representativeName).toBe('田中 花子');
      expect(companyInfo.representativeTitle).toBe('代表取締役社長');
    });

    it('オプションフィールドを設定できる', () => {
      const { updateCompanyInfo } = useCompanySettingsStore.getState();

      updateCompanyInfo({
        fax: '03-9876-5432',
        corporateNumber: '1234567890123',
        taxOfficeCode: '00123',
        foundedDate: '2020-04-01',
      });

      const { companyInfo } = useCompanySettingsStore.getState();
      expect(companyInfo.fax).toBe('03-9876-5432');
      expect(companyInfo.corporateNumber).toBe('1234567890123');
      expect(companyInfo.taxOfficeCode).toBe('00123');
      expect(companyInfo.foundedDate).toBe('2020-04-01');
    });
  });

  describe('updatePayrollSettings', () => {
    it('支給日を更新できる', () => {
      const { updatePayrollSettings } = useCompanySettingsStore.getState();

      updatePayrollSettings({
        paymentDay: 15,
        paymentDayType: 'next',
      });

      const { payrollSettings } = useCompanySettingsStore.getState();
      expect(payrollSettings.paymentDay).toBe(15);
      expect(payrollSettings.paymentDayType).toBe('next');
    });

    it('勤務時間設定を更新できる', () => {
      const { updatePayrollSettings } = useCompanySettingsStore.getState();

      updatePayrollSettings({
        standardWorkHours: 7.5,
        standardWorkDays: 22,
      });

      const { payrollSettings } = useCompanySettingsStore.getState();
      expect(payrollSettings.standardWorkHours).toBe(7.5);
      expect(payrollSettings.standardWorkDays).toBe(22);
      // 他のフィールドは変わらない
      expect(payrollSettings.paymentDay).toBe(25);
    });

    it('控除項目を有効/無効にできる', () => {
      const { updatePayrollSettings } = useCompanySettingsStore.getState();

      updatePayrollSettings({
        enableHealthInsurance: false,
        enableResidentTax: false,
      });

      const { payrollSettings } = useCompanySettingsStore.getState();
      expect(payrollSettings.enableHealthInsurance).toBe(false);
      expect(payrollSettings.enableResidentTax).toBe(false);
      // 他の控除項目は有効のまま
      expect(payrollSettings.enablePensionInsurance).toBe(true);
      expect(payrollSettings.enableEmploymentInsurance).toBe(true);
    });

    it('給与体系を変更できる', () => {
      const { updatePayrollSettings } = useCompanySettingsStore.getState();

      updatePayrollSettings({
        defaultPayType: 'hourly',
      });

      const { payrollSettings } = useCompanySettingsStore.getState();
      expect(payrollSettings.defaultPayType).toBe('hourly');
    });
  });

  describe('updateYearEndAdjustmentSettings', () => {
    it('年末調整期間を更新できる', () => {
      const { updateYearEndAdjustmentSettings } = useCompanySettingsStore.getState();

      updateYearEndAdjustmentSettings({
        adjustmentStartMonth: 10,
        adjustmentEndMonth: 11,
      });

      const { yearEndAdjustmentSettings } = useCompanySettingsStore.getState();
      expect(yearEndAdjustmentSettings.adjustmentStartMonth).toBe(10);
      expect(yearEndAdjustmentSettings.adjustmentEndMonth).toBe(11);
    });

    it('控除項目を有効/無効にできる', () => {
      const { updateYearEndAdjustmentSettings } = useCompanySettingsStore.getState();

      updateYearEndAdjustmentSettings({
        enableBasicDeduction: false,
        enableSpouseDeduction: false,
      });

      const { yearEndAdjustmentSettings } = useCompanySettingsStore.getState();
      expect(yearEndAdjustmentSettings.enableBasicDeduction).toBe(false);
      expect(yearEndAdjustmentSettings.enableSpouseDeduction).toBe(false);
      // 他の控除項目は有効のまま
      expect(yearEndAdjustmentSettings.enableDependentDeduction).toBe(true);
    });

    it('源泉徴収票設定を変更できる', () => {
      const { updateYearEndAdjustmentSettings } = useCompanySettingsStore.getState();

      updateYearEndAdjustmentSettings({
        withholdingSlipFormat: 'detailed',
        includeQRCode: true,
      });

      const { yearEndAdjustmentSettings } = useCompanySettingsStore.getState();
      expect(yearEndAdjustmentSettings.withholdingSlipFormat).toBe('detailed');
      expect(yearEndAdjustmentSettings.includeQRCode).toBe(true);
    });
  });

  describe('resetSettings', () => {
    it('すべての設定をデフォルトに戻せる', () => {
      const {
        updateCompanyInfo,
        updatePayrollSettings,
        updateYearEndAdjustmentSettings,
        resetSettings,
      } = useCompanySettingsStore.getState();

      // 各設定を変更
      updateCompanyInfo({ name: 'テスト株式会社' });
      updatePayrollSettings({ paymentDay: 15 });
      updateYearEndAdjustmentSettings({ includeQRCode: true });

      // 変更されたことを確認
      let state = useCompanySettingsStore.getState();
      expect(state.companyInfo.name).toBe('テスト株式会社');
      expect(state.payrollSettings.paymentDay).toBe(15);
      expect(state.yearEndAdjustmentSettings.includeQRCode).toBe(true);

      // リセット
      resetSettings();

      // デフォルト値に戻ったことを確認
      state = useCompanySettingsStore.getState();
      expect(state.companyInfo.name).toBe('サンプル株式会社');
      expect(state.payrollSettings.paymentDay).toBe(25);
      expect(state.yearEndAdjustmentSettings.includeQRCode).toBe(false);
    });
  });

  describe('複合的なシナリオ', () => {
    it('複数の設定を段階的に変更できる', () => {
      const {
        updateCompanyInfo,
        updatePayrollSettings,
        updateYearEndAdjustmentSettings,
      } = useCompanySettingsStore.getState();

      // ステップ1: 会社情報を変更
      updateCompanyInfo({
        name: 'ABC株式会社',
        address: '大阪府大阪市北区梅田1-1-1',
      });

      let state = useCompanySettingsStore.getState();
      expect(state.companyInfo.name).toBe('ABC株式会社');
      expect(state.companyInfo.address).toBe('大阪府大阪市北区梅田1-1-1');

      // ステップ2: 給与設定を変更
      updatePayrollSettings({
        paymentDay: 10,
        closingDay: 25,
      });

      state = useCompanySettingsStore.getState();
      expect(state.payrollSettings.paymentDay).toBe(10);
      expect(state.payrollSettings.closingDay).toBe(25);

      // ステップ3: 年末調整設定を変更
      updateYearEndAdjustmentSettings({
        withholdingSlipFormat: 'detailed',
      });

      state = useCompanySettingsStore.getState();
      expect(state.yearEndAdjustmentSettings.withholdingSlipFormat).toBe('detailed');

      // すべての変更が保持されていることを確認
      expect(state.companyInfo.name).toBe('ABC株式会社');
      expect(state.payrollSettings.paymentDay).toBe(10);
      expect(state.yearEndAdjustmentSettings.withholdingSlipFormat).toBe('detailed');
    });
  });
});
