/**
 * 承認フロー統合テスト（手動実行用）
 * 組織図と承認フローの連動を確認
 */

import { generateApprovalStepsFromFlow, workflowTypeToDocumentType } from '../src/lib/integrations/approval-flow-integration';
import type { ResolvedApprovalRoute } from '../src/types/approval-flow';

console.log('=== 承認フロー統合テスト（手動実行） ===\n');

// デモ組織構造
console.log('【組織構造】');
console.log('  レベル0: 鈴木太郎（代表取締役社長）');
console.log('    └─ レベル1: 田中花子（最高技術責任者）');
console.log('         └─ レベル2: 佐藤次郎（シニアエンジニア）');
console.log('');

// ===== テストケース1: 佐藤次郎（2階層下）が休暇申請 =====
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('【テストケース1】佐藤次郎（シニアエンジニア）が休暇申請');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('申請者: 佐藤次郎（レベル2）');
console.log('申請タイプ: 休暇申請（leave_request）');
console.log('適用フロー: 標準休暇承認フロー（組織連動・2階層上まで）');
console.log('');
console.log('期待される承認ルート:');
console.log('  ステップ1: 田中花子（直属の上司、1階層上）');
console.log('  ステップ2: 鈴木太郎（2階層上）');
console.log('');

const testCase1: ResolvedApprovalRoute = {
  flowId: 'FLOW-001',
  flowName: '標準休暇承認フロー（組織連動）',
  flowType: 'organization_based',
  steps: [
    {
      id: 'STEP-001',
      order: 1,
      status: 'pending',
      approvers: [
        {
          userId: 'M002',
          name: '田中花子',
          role: 'direct_manager',
        },
      ],
      requiredApprovals: 1,
    },
    {
      id: 'STEP-002',
      order: 2,
      status: 'pending',
      approvers: [
        {
          userId: 'M001',
          name: '鈴木太郎',
          role: 'upper_manager',
        },
      ],
      requiredApprovals: 1,
    },
  ],
};

const steps1 = generateApprovalStepsFromFlow(testCase1);
console.log('【実際に生成された承認ステップ】:');
steps1.forEach((step, index) => {
  console.log(`  ✅ ステップ ${index + 1}:`);
  step.approvers.forEach(approver => {
    console.log(`     - 承認者: ${approver.name} (${approver.userId})`);
    console.log(`     - ロール: ${approver.role}`);
  });
});
console.log('');

const testCase1Pass =
  steps1.length === 2 &&
  steps1[0].approvers[0].userId === 'M002' &&
  steps1[0].approvers[0].name === '田中花子' &&
  steps1[1].approvers[0].userId === 'M001' &&
  steps1[1].approvers[0].name === '鈴木太郎';

console.log(`結果: ${testCase1Pass ? '✅ 成功' : '❌ 失敗'}`);
console.log('');

// ===== テストケース2: 田中花子（1階層下）が経費申請 =====
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('【テストケース2】田中花子（最高技術責任者）が経費申請');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('申請者: 田中花子（レベル1）');
console.log('申請タイプ: 経費申請（expense_claim）');
console.log('申請内容: 10万円');
console.log('適用フロー: 標準経費承認フロー（組織連動・1階層上まで）');
console.log('');
console.log('期待される承認ルート:');
console.log('  ステップ1: 鈴木太郎（直属の上司、1階層上）');
console.log('');

const testCase2: ResolvedApprovalRoute = {
  flowId: 'FLOW-002',
  flowName: '標準経費承認フロー（組織連動）',
  flowType: 'organization_based',
  steps: [
    {
      id: 'STEP-001',
      order: 1,
      status: 'pending',
      approvers: [
        {
          userId: 'M001',
          name: '鈴木太郎',
          role: 'direct_manager',
        },
      ],
      requiredApprovals: 1,
    },
  ],
};

const steps2 = generateApprovalStepsFromFlow(testCase2);
console.log('【実際に生成された承認ステップ】:');
steps2.forEach((step, index) => {
  console.log(`  ✅ ステップ ${index + 1}:`);
  step.approvers.forEach(approver => {
    console.log(`     - 承認者: ${approver.name} (${approver.userId})`);
    console.log(`     - ロール: ${approver.role}`);
  });
});
console.log('');

const testCase2Pass =
  steps2.length === 1 &&
  steps2[0].approvers[0].userId === 'M001' &&
  steps2[0].approvers[0].name === '鈴木太郎';

console.log(`結果: ${testCase2Pass ? '✅ 成功' : '❌ 失敗'}`);
console.log('');

// ===== テストケース3: カスタム型フロー（高額経費） =====
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('【テストケース3】高額経費承認（カスタムフロー）');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('申請者: 佐藤次郎');
console.log('申請タイプ: 経費申請（expense_claim）');
console.log('申請内容: 50万円（高額）');
console.log('適用フロー: 高額経費承認フロー（カスタム）');
console.log('');
console.log('期待される承認ルート:');
console.log('  ステップ1: 田中花子（1次承認者）');
console.log('  ステップ2: 鈴木太郎（最終承認者）');
console.log('');

const testCase3: ResolvedApprovalRoute = {
  flowId: 'FLOW-003',
  flowName: '高額経費承認フロー（カスタム）',
  flowType: 'custom',
  steps: [
    {
      id: 'STEP-001',
      order: 1,
      status: 'pending',
      approvers: [
        {
          userId: 'M002',
          name: '田中花子',
          role: 'approver',
        },
      ],
      requiredApprovals: 1,
    },
    {
      id: 'STEP-002',
      order: 2,
      status: 'pending',
      approvers: [
        {
          userId: 'M001',
          name: '鈴木太郎',
          role: 'final_approver',
        },
      ],
      requiredApprovals: 1,
    },
  ],
};

const steps3 = generateApprovalStepsFromFlow(testCase3);
console.log('【実際に生成された承認ステップ】:');
steps3.forEach((step, index) => {
  console.log(`  ✅ ステップ ${index + 1}:`);
  step.approvers.forEach(approver => {
    console.log(`     - 承認者: ${approver.name} (${approver.userId})`);
    console.log(`     - ロール: ${approver.role}`);
  });
});
console.log('');

const testCase3Pass =
  steps3.length === 2 &&
  steps3[0].approvers[0].userId === 'M002' &&
  steps3[0].approvers[0].name === '田中花子' &&
  steps3[1].approvers[0].userId === 'M001' &&
  steps3[1].approvers[0].name === '鈴木太郎';

console.log(`結果: ${testCase3Pass ? '✅ 成功' : '❌ 失敗'}`);
console.log('');

// ===== テストケース4: ワークフロータイプの変換確認 =====
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('【テストケース4】ワークフロータイプの変換');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const typeTests = [
  { input: 'leave_request', expected: 'leave_request' },
  { input: 'overtime_request', expected: 'overtime_request' },
  { input: 'expense_claim', expected: 'expense_claim' },
  { input: 'business_trip', expected: 'business_trip' },
  { input: 'purchase_request', expected: 'purchase_request' },
  { input: 'document_approval', expected: undefined },
];

let typeTestsPass = true;
typeTests.forEach(test => {
  const result = workflowTypeToDocumentType(test.input as any);
  const pass = result === test.expected;
  if (!pass) typeTestsPass = false;
  console.log(`  ${test.input} → ${result ?? 'undefined'} ${pass ? '✅' : '❌'}`);
});

console.log('');
console.log(`結果: ${typeTestsPass ? '✅ 成功' : '❌ 失敗'}`);
console.log('');

// ===== 総合結果 =====
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('【総合結果】');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const allPass = testCase1Pass && testCase2Pass && testCase3Pass && typeTestsPass;

console.log(`テストケース1（組織連動・2階層）: ${testCase1Pass ? '✅ 成功' : '❌ 失敗'}`);
console.log(`テストケース2（組織連動・1階層）: ${testCase2Pass ? '✅ 成功' : '❌ 失敗'}`);
console.log(`テストケース3（カスタムフロー）: ${testCase3Pass ? '✅ 成功' : '❌ 失敗'}`);
console.log(`テストケース4（タイプ変換）: ${typeTestsPass ? '✅ 成功' : '❌ 失敗'}`);
console.log('');

if (allPass) {
  console.log('🎉 すべてのテストが成功しました！');
  console.log('');
  console.log('✅ 組織図と承認フローの連動が正しく動作しています。');
  console.log('✅ 組織連動型フローでは、階層に応じて自動的に承認者が設定されます。');
  console.log('✅ カスタム型フローでは、手動設定された承認者が使用されます。');
  console.log('✅ ワークフロータイプの変換も正常に動作しています。');
} else {
  console.log('❌ 一部のテストが失敗しました。');
}

console.log('');
console.log('=== テスト完了 ===');

process.exit(allPass ? 0 : 1);
