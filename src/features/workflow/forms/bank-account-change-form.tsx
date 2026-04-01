'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormComponentProps } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BankAccountChangeForm({ form, onFlowUpdate }: FormComponentProps) {
  const [consent, setConsent] = useState(false);

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
            ・銀行コード・支店コードは4桁・3桁の数字です
            <br />
            ・口座名義は必ず全角カナで入力してください
          </p>
        </div>

        {/* 銀行情報 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">
              銀行名
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="bankName"
              placeholder="例：三菱UFJ銀行"
              {...form.register('bankName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankCode">
              銀行コード
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="bankCode"
              placeholder="0005"
              maxLength={4}
              {...form.register('bankCode')}
            />
            <p className="text-xs text-muted-foreground">4桁の数字</p>
          </div>
        </div>

        {/* 支店情報 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branchName">
              支店名
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="branchName"
              placeholder="例：新宿支店"
              {...form.register('branchName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchCode">
              支店コード
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="branchCode"
              placeholder="123"
              maxLength={3}
              {...form.register('branchCode')}
            />
            <p className="text-xs text-muted-foreground">3桁の数字</p>
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
