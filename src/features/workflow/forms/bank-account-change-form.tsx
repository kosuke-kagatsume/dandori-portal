'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormComponentProps } from '@/lib/workflow/schemas';
import { BankCombobox } from '@/components/bank/bank-combobox';
import { BranchCombobox } from '@/components/bank/branch-combobox';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BankAccountChangeForm({ form, onFlowUpdate }: FormComponentProps) {
  const [consent, setConsent] = useState(false);

  const bankCode = form.watch('bankCode') as string | undefined;
  const bankName = form.watch('bankName') as string | undefined;
  const branchCode = form.watch('branchCode') as string | undefined;
  const branchName = form.watch('branchName') as string | undefined;

  const handleBankChange = (v: { code: string; name: string } | null) => {
    form.setValue('bankCode', v?.code ?? '', { shouldValidate: true, shouldDirty: true });
    form.setValue('bankName', v?.name ?? '', { shouldValidate: true, shouldDirty: true });
    form.setValue('branchCode', '', { shouldValidate: true, shouldDirty: true });
    form.setValue('branchName', '', { shouldValidate: true, shouldDirty: true });
  };

  const handleBranchChange = (v: { code: string; name: string } | null) => {
    form.setValue('branchCode', v?.code ?? '', { shouldValidate: true, shouldDirty: true });
    form.setValue('branchName', v?.name ?? '', { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          給与振込口座変更
        </CardTitle>
        <CardDescription>
          給与振込先の口座情報を変更します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 注意書きブルーボックス */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <strong>ご注意：</strong>
            <br />
            ・普通預金口座のみ登録可能です（当座預金は登録できません）
            <br />
            ・銀行名・支店名は検索して選択してください（銀行コード・支店コードは自動入力されます）
            <br />
            ・口座名義は必ず全角カナで入力してください
          </p>
        </div>

        {/* 銀行情報 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">
              銀行
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <BankCombobox
              id="bankName"
              value={bankCode && bankName ? { code: bankCode, name: bankName } : null}
              onChange={handleBankChange}
              placeholder="銀行名・カナ・コードで検索"
            />
            <p className="text-xs text-muted-foreground">
              {bankCode ? `銀行コード: ${bankCode}` : '銀行名・カナ・4桁コードで検索できます'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchName">
              支店
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <BranchCombobox
              id="branchName"
              bankCode={bankCode || null}
              value={branchCode && branchName ? { code: branchCode, name: branchName } : null}
              onChange={handleBranchChange}
              placeholder="支店名・カナ・コードで検索"
            />
            <p className="text-xs text-muted-foreground">
              {branchCode ? `支店コード: ${branchCode}` : '先に銀行を選択してください'}
            </p>
          </div>
        </div>

        {/* 口座情報 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              口座番号
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="accountNumber"
              placeholder="1234567"
              maxLength={7}
              {...form.register('accountNumber')}
            />
            <p className="text-xs text-muted-foreground">7桁の数字</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountHolderKana">
              口座名義（全角カナ）
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="accountHolderKana"
              placeholder="ヤマダ タロウ"
              {...form.register('accountHolderKana')}
            />
            <p className="text-xs text-muted-foreground">名字と名前の間に全角スペース</p>
          </div>
        </div>

        {/* 変更理由 */}
        <div className="space-y-2">
          <Label htmlFor="changeReason">
            変更理由
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea
            id="changeReason"
            placeholder="口座変更の理由を入力してください"
            {...form.register('changeReason')}
            rows={3}
          />
        </div>

        {/* 同意事項 */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            口座振込に関する同意事項
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 mb-3">
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>給与等の支払いは、指定された口座への振込により行われます</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>口座情報に誤りがあった場合、振込が遅延する場合があります</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>口座情報を変更する場合は、事前に人事部に連絡してください</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>振込手数料は会社が負担します</span>
            </li>
          </ul>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="consent"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <Label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
              上記の同意事項を確認し、同意します
              <span className="text-red-500 ml-1">*</span>
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
