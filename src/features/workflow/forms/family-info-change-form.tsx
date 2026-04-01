'use client';

import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Users, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { FormComponentProps } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FamilyInfoChangeForm({ form, onFlowUpdate }: FormComponentProps) {
  const [hasSpouse, setHasSpouse] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'familyMembers',
  });

  const addFamilyMember = () => {
    if (fields.length >= 6) {
      toast.error('家族メンバーは最大6名までです');
      return;
    }

    append({
      nameKanji: '',
      nameKana: '',
      relationship: '',
      birthDate: '',
      occupation: '',
      annualIncome: 0,
      liveTogether: true,
      incomeTaxDependent: false,
      healthInsuranceDependent: false,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          家族情報変更
        </CardTitle>
        <CardDescription>
          家族構成や扶養家族の情報を変更します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 配偶者情報セクション */}
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="hasSpouse"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={hasSpouse}
              onChange={(e) => setHasSpouse(e.target.checked)}
            />
            <Label htmlFor="hasSpouse" className="cursor-pointer">
              配偶者がいる
            </Label>
          </div>

          {hasSpouse && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
              <p className="text-sm font-medium text-gray-700">配偶者の詳細情報</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="spouseNameKanji">
                    氏名（漢字）
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseNameKanji"
                    {...form.register('spouse.nameKanji')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spouseNameKana">
                    氏名（カナ）
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseNameKana"
                    placeholder="ヤマダ ハナコ"
                    {...form.register('spouse.nameKana')}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="spouseBirthDate">
                    生年月日
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseBirthDate"
                    type="date"
                    {...form.register('spouse.birthDate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spouseOccupation">
                    職業
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseOccupation"
                    placeholder="会社員"
                    {...form.register('spouse.occupation')}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="spouseAnnualIncome">
                    年間収入（見込み）
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseAnnualIncome"
                    type="number"
                    {...form.register('spouse.annualIncome', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">円</p>
                </div>
                <div className="flex items-start gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="spouseLiveTogether"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...form.register('spouse.liveTogether')}
                  />
                  <Label htmlFor="spouseLiveTogether" className="cursor-pointer">
                    同居している
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">税額控除・扶養</p>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="spouseIncomeTaxDependent"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...form.register('spouse.incomeTaxDependent')}
                  />
                  <div>
                    <Label htmlFor="spouseIncomeTaxDependent" className="cursor-pointer">
                      所得税上の扶養に入れる（年間所得48万円以下）
                    </Label>
                    <p className="text-xs text-muted-foreground">年間所得が48万円以下の場合、所得税の配偶者控除が適用されます</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="spouseHealthInsuranceDependent"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...form.register('spouse.healthInsuranceDependent')}
                  />
                  <div>
                    <Label htmlFor="spouseHealthInsuranceDependent" className="cursor-pointer">
                      健康保険の扶養に入れる（年間所得130万円未満）
                    </Label>
                    <p className="text-xs text-muted-foreground">年間所得が130万円未満の場合、健康保険の扶養に入れます</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* その他の家族メンバー */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">その他の家族</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFamilyMember}
              disabled={fields.length >= 6}
            >
              <Users className="h-4 w-4 mr-2" />
              家族を追加
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                「家族を追加」ボタンをクリックして、家族メンバーを追加してください
                <br />
                （最大6名まで）
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">家族{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.nameKanji`}>
                        氏名（漢字）
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.nameKanji`}
                        {...form.register(`familyMembers.${index}.nameKanji` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.nameKana`}>
                        氏名（カナ）
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.nameKana`}
                        placeholder="ヤマダ イチロウ"
                        {...form.register(`familyMembers.${index}.nameKana` as const)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.relationship`}>
                        続柄
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.relationship`}
                        placeholder="長男、次女など"
                        {...form.register(`familyMembers.${index}.relationship` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.birthDate`}>
                        生年月日
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.birthDate`}
                        type="date"
                        {...form.register(`familyMembers.${index}.birthDate` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.occupation`}>
                        職業
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.occupation`}
                        placeholder="学生、会社員など"
                        {...form.register(`familyMembers.${index}.occupation` as const)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.annualIncome`}>
                        年間収入（見込み）
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.annualIncome`}
                        type="number"
                        {...form.register(`familyMembers.${index}.annualIncome` as const, { valueAsNumber: true })}
                      />
                      <p className="text-xs text-muted-foreground">円</p>
                    </div>
                    <div className="flex items-start gap-2 pt-6">
                      <input
                        type="checkbox"
                        id={`familyMembers.${index}.liveTogether`}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...form.register(`familyMembers.${index}.liveTogether` as const)}
                      />
                      <Label htmlFor={`familyMembers.${index}.liveTogether`} className="cursor-pointer">
                        同居している
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">税額控除・扶養</p>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`familyMembers.${index}.incomeTaxDependent`}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...form.register(`familyMembers.${index}.incomeTaxDependent` as const)}
                      />
                      <Label htmlFor={`familyMembers.${index}.incomeTaxDependent`} className="cursor-pointer">
                        所得税上の扶養に入れる
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`familyMembers.${index}.healthInsuranceDependent`}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...form.register(`familyMembers.${index}.healthInsuranceDependent` as const)}
                      />
                      <Label htmlFor={`familyMembers.${index}.healthInsuranceDependent`} className="cursor-pointer">
                        健康保険の扶養に入れる
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 変更理由 */}
        <div className="space-y-2">
          <Label htmlFor="changeReason">
            変更理由
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea
            id="changeReason"
            placeholder="変更の理由を詳しく入力してください"
            {...form.register('changeReason')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
