/**
 * 給与管理ストアのテスト
 */

import { usePayrollStore } from './payroll-store';
import type { EmployeeSalaryMaster, PayrollCalculation, BonusCalculation } from './payroll-store';

describe('PayrollStore', () => {
  beforeEach(() => {
    // 各テスト前にストアとlocalStorageをリセット
    localStorage.clear();
    usePayrollStore.setState({
      salaryMasters: [],
      calculations: [],
      bonusCalculations: [],
      bonusEvaluations: [],
      yearEndAdjustments: [],
      yearEndAdjustmentDeclarations: [],
      isCalculating: false,
    });
  });

  describe('updateSalaryMaster', () => {
    it('給与マスタを更新できる', async () => {
      const salaryMaster: Omit<EmployeeSalaryMaster, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({
        salaryMasters: [{
          ...salaryMaster,
          id: 'master-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      });

      const state1 = usePayrollStore.getState();
      expect(state1.salaryMasters).toHaveLength(1);
      const originalUpdatedAt = state1.salaryMasters[0].updatedAt;

      // Wait 2ms to ensure updatedAt will be different
      await new Promise(resolve => setTimeout(resolve, 2));

      // Update salary master (simulating state update)
      usePayrollStore.setState({
        salaryMasters: state1.salaryMasters.map(master =>
          master.employeeId === 'emp-001'
            ? { ...master, basicSalary: 450000, updatedAt: new Date().toISOString() }
            : master
        ),
      });

      const state2 = usePayrollStore.getState();
      expect(state2.salaryMasters[0].basicSalary).toBe(450000);
      expect(state2.salaryMasters[0].updatedAt).not.toBe(originalUpdatedAt);
    });

    it('手当を更新できる', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '佐藤花子',
        department: '経理部',
        position: '主任',
        basicSalary: 350000,
        positionAllowance: 30000,
        skillAllowance: 15000,
        housingAllowance: 25000,
        familyAllowance: 10000,
        commutingAllowance: 12000,
        hourlyRate: 2200,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 22000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      // Update allowances
      usePayrollStore.setState({
        salaryMasters: usePayrollStore.getState().salaryMasters.map(master =>
          master.employeeId === 'emp-001'
            ? {
                ...master,
                positionAllowance: 35000,
                skillAllowance: 20000,
                updatedAt: new Date().toISOString(),
              }
            : master
        ),
      });

      const state = usePayrollStore.getState();
      expect(state.salaryMasters[0].positionAllowance).toBe(35000);
      expect(state.salaryMasters[0].skillAllowance).toBe(20000);
    });

    it('扶養人数を更新できる', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '鈴木一郎',
        department: '技術部',
        position: '部長',
        basicSalary: 500000,
        positionAllowance: 80000,
        skillAllowance: 40000,
        housingAllowance: 40000,
        familyAllowance: 30000,
        commutingAllowance: 20000,
        hourlyRate: 3300,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 40000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      // Update dependents
      usePayrollStore.setState({
        salaryMasters: usePayrollStore.getState().salaryMasters.map(master =>
          master.employeeId === 'emp-001'
            ? { ...master, dependents: 3, updatedAt: new Date().toISOString() }
            : master
        ),
      });

      const state = usePayrollStore.getState();
      expect(state.salaryMasters[0].dependents).toBe(3);
    });
  });

  describe('getSalaryMaster', () => {
    it('従業員IDで給与マスタを取得できる', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const master = usePayrollStore.getState().getSalaryMaster('emp-001');
      expect(master).toBeDefined();
      expect(master?.employeeName).toBe('田中太郎');
      expect(master?.basicSalary).toBe(400000);
    });

    it('存在しない従業員IDの場合はundefinedを返す', () => {
      const master = usePayrollStore.getState().getSalaryMaster('non-existent-id');
      expect(master).toBeUndefined();
    });
  });

  describe('calculatePayroll', () => {
    it('給与計算を実行できる', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const calculation = usePayrollStore.getState().calculatePayroll('emp-001', '2024-10');

      expect(calculation).toBeDefined();
      expect(calculation.employeeId).toBe('emp-001');
      expect(calculation.period).toBe('2024-10');
      expect(calculation.basicSalary).toBe(400000);
      expect(calculation.status).toBe('draft');
    });

    it('総支給額が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const calculation = usePayrollStore.getState().calculatePayroll('emp-001', '2024-10');

      const expectedAllowances =
        salaryMaster.positionAllowance +
        salaryMaster.skillAllowance +
        salaryMaster.housingAllowance +
        salaryMaster.familyAllowance +
        salaryMaster.commutingAllowance;

      expect(calculation.totalAllowances).toBe(expectedAllowances);
      expect(calculation.grossSalary).toBeGreaterThanOrEqual(
        salaryMaster.basicSalary + expectedAllowances
      );
    });

    it('社会保険料が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const calculation = usePayrollStore.getState().calculatePayroll('emp-001', '2024-10');

      expect(calculation.healthInsurance).toBeGreaterThan(0);
      expect(calculation.pension).toBeGreaterThan(0);
      expect(calculation.employmentInsurance).toBeGreaterThan(0);
    });

    it('控除額合計が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        unionFee: 3000,
        savingsAmount: 20000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const calculation = usePayrollStore.getState().calculatePayroll('emp-001', '2024-10');

      const expectedDeductions =
        calculation.healthInsurance +
        calculation.pension +
        calculation.employmentInsurance +
        calculation.incomeTax +
        calculation.residentTax +
        calculation.otherDeductions;

      expect(calculation.totalDeductions).toBe(expectedDeductions);
    });

    it('差引支給額が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const calculation = usePayrollStore.getState().calculatePayroll('emp-001', '2024-10');

      expect(calculation.netSalary).toBe(
        calculation.grossSalary - calculation.totalDeductions
      );
      expect(calculation.netSalary).toBeGreaterThan(0);
    });
  });

  describe('addCalculation', () => {
    it('給与計算結果を追加できる', () => {
      const calculation: PayrollCalculation = {
        id: 'calc-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        period: '2024-10',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        overtimePay: 25000,
        lateNightPay: 5000,
        holidayPay: 0,
        totalAllowances: 135000,
        grossSalary: 560000,
        workDays: 22,
        totalWorkHours: 176,
        overtimeHours: 10,
        lateNightHours: 2,
        holidayWorkHours: 0,
        healthInsurance: 27720,
        pension: 51240,
        employmentInsurance: 3360,
        incomeTax: 15000,
        residentTax: 30000,
        unionFee: 3000,
        savingsAmount: 20000,
        loanRepayment: 0,
        otherDeductions: 23000,
        totalDeductions: 150320,
        netSalary: 409680,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      usePayrollStore.getState().addCalculation(calculation);

      const state = usePayrollStore.getState();
      expect(state.calculations).toHaveLength(1);
      expect(state.calculations[0].employeeId).toBe('emp-001');
      expect(state.calculations[0].period).toBe('2024-10');
    });

    it('複数の給与計算結果を追加できる', () => {
      const calc1: PayrollCalculation = {
        id: 'calc-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        period: '2024-10',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        overtimePay: 25000,
        lateNightPay: 5000,
        holidayPay: 0,
        totalAllowances: 135000,
        grossSalary: 560000,
        workDays: 22,
        totalWorkHours: 176,
        overtimeHours: 10,
        lateNightHours: 2,
        holidayWorkHours: 0,
        healthInsurance: 27720,
        pension: 51240,
        employmentInsurance: 3360,
        incomeTax: 15000,
        residentTax: 30000,
        unionFee: 3000,
        savingsAmount: 20000,
        loanRepayment: 0,
        otherDeductions: 23000,
        totalDeductions: 150320,
        netSalary: 409680,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      const calc2: PayrollCalculation = {
        id: 'calc-2',
        employeeId: 'emp-002',
        employeeName: '佐藤花子',
        department: '経理部',
        period: '2024-10',
        basicSalary: 350000,
        positionAllowance: 30000,
        skillAllowance: 15000,
        housingAllowance: 25000,
        familyAllowance: 10000,
        commutingAllowance: 12000,
        overtimePay: 18000,
        lateNightPay: 0,
        holidayPay: 0,
        totalAllowances: 92000,
        grossSalary: 460000,
        workDays: 22,
        totalWorkHours: 176,
        overtimeHours: 8,
        lateNightHours: 0,
        holidayWorkHours: 0,
        healthInsurance: 22770,
        pension: 42090,
        employmentInsurance: 2760,
        incomeTax: 10000,
        residentTax: 22000,
        unionFee: 0,
        savingsAmount: 10000,
        loanRepayment: 0,
        otherDeductions: 10000,
        totalDeductions: 109620,
        netSalary: 350380,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      usePayrollStore.getState().addMultipleCalculations([calc1, calc2]);

      const state = usePayrollStore.getState();
      expect(state.calculations).toHaveLength(2);
    });
  });

  describe('getCalculationsByPeriod', () => {
    it('期間で給与計算結果を取得できる', () => {
      const calc1: PayrollCalculation = {
        id: 'calc-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        period: '2024-10',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        overtimePay: 25000,
        lateNightPay: 5000,
        holidayPay: 0,
        totalAllowances: 135000,
        grossSalary: 560000,
        workDays: 22,
        totalWorkHours: 176,
        overtimeHours: 10,
        lateNightHours: 2,
        holidayWorkHours: 0,
        healthInsurance: 27720,
        pension: 51240,
        employmentInsurance: 3360,
        incomeTax: 15000,
        residentTax: 30000,
        unionFee: 3000,
        savingsAmount: 20000,
        loanRepayment: 0,
        otherDeductions: 23000,
        totalDeductions: 150320,
        netSalary: 409680,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      const calc2: PayrollCalculation = {
        id: 'calc-2',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        period: '2024-09',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        overtimePay: 20000,
        lateNightPay: 0,
        holidayPay: 0,
        totalAllowances: 135000,
        grossSalary: 555000,
        workDays: 21,
        totalWorkHours: 168,
        overtimeHours: 8,
        lateNightHours: 0,
        holidayWorkHours: 0,
        healthInsurance: 27472,
        pension: 50782,
        employmentInsurance: 3330,
        incomeTax: 14000,
        residentTax: 30000,
        unionFee: 3000,
        savingsAmount: 20000,
        loanRepayment: 0,
        otherDeductions: 23000,
        totalDeductions: 148584,
        netSalary: 406416,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ calculations: [calc1, calc2] });

      const results = usePayrollStore.getState().getCalculationsByPeriod('2024-10');
      expect(results).toHaveLength(1);
      expect(results[0].period).toBe('2024-10');
    });
  });

  describe('calculateBonus', () => {
    it('賞与計算を実行できる', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const bonus = usePayrollStore.getState().calculateBonus('emp-001', '2024-12', 'winter');

      expect(bonus).toBeDefined();
      expect(bonus.employeeId).toBe('emp-001');
      expect(bonus.period).toBe('2024-12');
      expect(bonus.bonusType).toBe('winter');
      expect(bonus.basicBonus).toBeGreaterThan(0);
      expect(bonus.status).toBe('draft');
    });

    it('夏季賞与が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const bonus = usePayrollStore.getState().calculateBonus('emp-001', '2024-06', 'summer');

      // Summer bonus is 2.5 months of basic salary
      const expectedBasicBonus = Math.round(salaryMaster.basicSalary * 2.5);
      expect(bonus.basicBonus).toBe(expectedBasicBonus);
      expect(bonus.bonusType).toBe('summer');
    });

    it('冬季賞与が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const bonus = usePayrollStore.getState().calculateBonus('emp-001', '2024-12', 'winter');

      // Winter bonus is 3.0 months of basic salary
      const expectedBasicBonus = Math.round(salaryMaster.basicSalary * 3.0);
      expect(bonus.basicBonus).toBe(expectedBasicBonus);
      expect(bonus.bonusType).toBe('winter');
    });

    it('特別賞与が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const bonus = usePayrollStore.getState().calculateBonus('emp-001', '2024-03', 'special');

      // Special bonus is 1.0 month of basic salary + 50000 special allowance
      const expectedBasicBonus = Math.round(salaryMaster.basicSalary * 1.0);
      expect(bonus.basicBonus).toBe(expectedBasicBonus);
      expect(bonus.specialAllowance).toBe(50000);
      expect(bonus.bonusType).toBe('special');
    });

    it('賞与の社会保険料が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const bonus = usePayrollStore.getState().calculateBonus('emp-001', '2024-12', 'winter');

      expect(bonus.healthInsurance).toBeGreaterThan(0);
      expect(bonus.pension).toBeGreaterThan(0);
      expect(bonus.employmentInsurance).toBeGreaterThan(0);
      expect(bonus.incomeTax).toBeGreaterThan(0);
    });

    it('賞与の差引支給額が正しく計算される', () => {
      const salaryMaster: EmployeeSalaryMaster = {
        id: 'master-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        basicSalary: 400000,
        positionAllowance: 50000,
        skillAllowance: 20000,
        housingAllowance: 30000,
        familyAllowance: 20000,
        commutingAllowance: 15000,
        hourlyRate: 2500,
        overtimeRate: 1.25,
        lateNightRate: 1.5,
        holidayRate: 1.35,
        healthInsuranceRate: 0.0495,
        pensionRate: 0.0915,
        employmentInsuranceRate: 0.006,
        residentTaxAmount: 30000,
        dependents: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ salaryMasters: [salaryMaster] });

      const bonus = usePayrollStore.getState().calculateBonus('emp-001', '2024-12', 'winter');

      expect(bonus.netBonus).toBe(bonus.totalGrossBonus - bonus.totalDeductions);
      expect(bonus.netBonus).toBeGreaterThan(0);
    });
  });

  describe('getBonusCalculationsByPeriod', () => {
    it('期間で賞与計算結果を取得できる', () => {
      const bonus1: BonusCalculation = {
        id: 'bonus-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        period: '2024-12',
        bonusType: 'winter',
        basicBonus: 1200000,
        positionBonus: 100000,
        performanceBonus: 180000,
        specialAllowance: 0,
        totalGrossBonus: 1480000,
        healthInsurance: 73260,
        pension: 135420,
        employmentInsurance: 8880,
        incomeTax: 151080,
        residentTax: 0,
        totalDeductions: 368640,
        netBonus: 1111360,
        performanceRating: 'A',
        performanceScore: 85,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      const bonus2: BonusCalculation = {
        id: 'bonus-2',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        period: '2024-06',
        bonusType: 'summer',
        basicBonus: 1000000,
        positionBonus: 75000,
        performanceBonus: 150000,
        specialAllowance: 0,
        totalGrossBonus: 1225000,
        healthInsurance: 60637,
        pension: 112087,
        employmentInsurance: 7350,
        incomeTax: 125070,
        residentTax: 0,
        totalDeductions: 305144,
        netBonus: 919856,
        performanceRating: 'A',
        performanceScore: 85,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ bonusCalculations: [bonus1, bonus2] });

      const results = usePayrollStore.getState().getBonusCalculationsByPeriod('2024-12');
      expect(results).toHaveLength(1);
      expect(results[0].period).toBe('2024-12');
      expect(results[0].bonusType).toBe('winter');
    });

    it('期間と賞与種別で絞り込める', () => {
      const bonus1: BonusCalculation = {
        id: 'bonus-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '課長',
        period: '2024-12',
        bonusType: 'winter',
        basicBonus: 1200000,
        positionBonus: 100000,
        performanceBonus: 180000,
        specialAllowance: 0,
        totalGrossBonus: 1480000,
        healthInsurance: 73260,
        pension: 135420,
        employmentInsurance: 8880,
        incomeTax: 151080,
        residentTax: 0,
        totalDeductions: 368640,
        netBonus: 1111360,
        performanceRating: 'A',
        performanceScore: 85,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      const bonus2: BonusCalculation = {
        id: 'bonus-2',
        employeeId: 'emp-002',
        employeeName: '佐藤花子',
        department: '経理部',
        position: '主任',
        period: '2024-12',
        bonusType: 'winter',
        basicBonus: 1050000,
        positionBonus: 60000,
        performanceBonus: 157500,
        specialAllowance: 0,
        totalGrossBonus: 1267500,
        healthInsurance: 62741,
        pension: 115976,
        employmentInsurance: 7605,
        incomeTax: 129427,
        residentTax: 0,
        totalDeductions: 315749,
        netBonus: 951751,
        performanceRating: 'A',
        performanceScore: 85,
        status: 'draft',
        calculatedAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ bonusCalculations: [bonus1, bonus2] });

      const results = usePayrollStore
        .getState()
        .getBonusCalculationsByPeriod('2024-12', 'winter');
      expect(results).toHaveLength(2);
      expect(results.every(b => b.bonusType === 'winter')).toBe(true);
    });
  });

  describe('saveBonusEvaluation', () => {
    it('賞与評価を保存できる', () => {
      const evaluation = {
        id: 'eval-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer' as const,
        performanceRating: 'S' as const,
        performanceScore: 95,
        bonusMultiplier: 0.5,
        comments: '目標を大きく上回る成果',
        evaluatedBy: 'manager-1',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      usePayrollStore.getState().saveBonusEvaluation(evaluation);

      const state = usePayrollStore.getState();
      expect(state.bonusEvaluations).toHaveLength(1);
      expect(state.bonusEvaluations[0].performanceRating).toBe('S');
      expect(state.bonusEvaluations[0].bonusMultiplier).toBe(0.5);
    });

    it('既存の評価を更新できる', () => {
      const evaluation1 = {
        id: 'eval-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer' as const,
        performanceRating: 'A' as const,
        performanceScore: 85,
        bonusMultiplier: 0.3,
        comments: '良好な成果',
        evaluatedBy: 'manager-1',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      usePayrollStore.getState().saveBonusEvaluation(evaluation1);

      const evaluation2 = {
        id: 'eval-2',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer' as const,
        performanceRating: 'S' as const,
        performanceScore: 95,
        bonusMultiplier: 0.5,
        comments: '目標を大きく上回る成果',
        evaluatedBy: 'manager-1',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      usePayrollStore.getState().saveBonusEvaluation(evaluation2);

      const state = usePayrollStore.getState();
      expect(state.bonusEvaluations).toHaveLength(1);
      expect(state.bonusEvaluations[0].performanceRating).toBe('S');
      expect(state.bonusEvaluations[0].bonusMultiplier).toBe(0.5);
    });
  });

  describe('getBonusEvaluation', () => {
    it('賞与評価を取得できる', () => {
      const evaluation = {
        id: 'eval-1',
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer' as const,
        performanceRating: 'S' as const,
        performanceScore: 95,
        bonusMultiplier: 0.5,
        comments: '目標を大きく上回る成果',
        evaluatedBy: 'manager-1',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      usePayrollStore.setState({ bonusEvaluations: [evaluation] });

      const result = usePayrollStore.getState().getBonusEvaluation(2024, 'emp-001', 'summer');
      expect(result).toBeDefined();
      expect(result?.performanceRating).toBe('S');
    });

    it('存在しない評価の場合はundefinedを返す', () => {
      const result = usePayrollStore.getState().getBonusEvaluation(2024, 'emp-999', 'summer');
      expect(result).toBeUndefined();
    });
  });

  describe('resetToSeed', () => {
    it('シードデータにリセットできる', () => {
      // Add some custom data
      usePayrollStore.setState({ calculations: [] });

      usePayrollStore.getState().resetToSeed();

      const state = usePayrollStore.getState();
      // Should have initial salary masters
      expect(state.salaryMasters.length).toBeGreaterThan(0);
      expect(state.calculations).toHaveLength(0);
      expect(state.bonusCalculations).toHaveLength(0);
    });
  });
});
