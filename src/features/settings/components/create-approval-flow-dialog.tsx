'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Building2, GitBranch } from 'lucide-react';
import { useApprovalFlowStore } from '@/lib/store/approval-flow-store';
import type {
  DocumentType,
  ApprovalFlowType,
  ApprovalStep,
  ApprovalCondition,
  ConditionOperator,
} from '@/types/approval-flow';
import { toast } from 'sonner';

interface CreateApprovalFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType?: DocumentType;
}

const documentTypeLabels: Record<DocumentType, string> = {
  leave_request: '休暇申請',
  overtime_request: '残業申請',
  expense_claim: '経費申請',
  business_trip: '出張申請',
  purchase_request: '購買申請',
};

const operatorLabels: Record<ConditionOperator, string> = {
  gte: '以上 (>=)',
  lte: '以下 (<=)',
  gt: 'より大きい (>)',
  lt: '未満 (<)',
  eq: '等しい (==)',
  ne: '等しくない (!=)',
};

export function CreateApprovalFlowDialog({
  open,
  onOpenChange,
  documentType: initialDocumentType,
}: CreateApprovalFlowDialogProps) {
  const { createFlow } = useApprovalFlowStore();

  // フォーム状態
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [flowType, setFlowType] = useState<ApprovalFlowType>('organization');
  const [documentType, setDocumentType] = useState<DocumentType>(
    initialDocumentType || 'leave_request'
  );
  const [organizationLevels, setOrganizationLevels] = useState<number>(2);
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState<number>(1);

  // カスタムステップ（カスタム型の場合）
  const [steps, setSteps] = useState<Partial<ApprovalStep>[]>([
    {
      stepNumber: 1,
      name: '',
      mode: 'serial',
      requiredApprovals: 1,
      timeoutHours: 48,
      allowDelegate: true,
      allowSkip: false,
      approvers: [],
    },
  ]);

  // 条件設定
  const [conditions, setConditions] = useState<Partial<ApprovalCondition>[]>([]);

  // ステップ追加
  const addStep = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        name: '',
        mode: 'serial',
        requiredApprovals: 1,
        timeoutHours: 48,
        allowDelegate: true,
        allowSkip: false,
        approvers: [],
      },
    ]);
  };

  // ステップ削除
  const removeStep = (index: number) => {
    if (steps.length <= 1) {
      toast.error('最低1つのステップが必要です');
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    // ステップ番号を再割り当て
    newSteps.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setSteps(newSteps);
  };

  // ステップ更新
  const updateStep = (index: number, field: keyof ApprovalStep, value: string | number | boolean | string[]) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  // 条件追加
  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: 'amount',
        operator: 'gte',
        value: 0,
        description: '',
      },
    ]);
  };

  // 条件削除
  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // 条件更新
  const updateCondition = (index: number, field: keyof ApprovalCondition, value: string | number) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  // フォーム送信
  const handleSubmit = () => {
    // バリデーション
    if (!name.trim()) {
      toast.error('フロー名を入力してください');
      return;
    }

    if (flowType === 'custom') {
      // カスタム型の場合、ステップ名が全て入力されているかチェック
      const hasEmptyStepName = steps.some((step) => !step.name?.trim());
      if (hasEmptyStepName) {
        toast.error('すべてのステップ名を入力してください');
        return;
      }
    }

    // フロー作成
    createFlow({
      name: name.trim(),
      description: description.trim() || undefined,
      type: flowType,
      documentType,
      useOrganizationHierarchy: flowType === 'organization',
      organizationLevels: flowType === 'organization' ? organizationLevels : undefined,
      steps: flowType === 'custom' ? (steps as ApprovalStep[]) : undefined,
      conditions: conditions.length > 0 ? (conditions as ApprovalCondition[]) : undefined,
      isActive,
      isDefault,
      priority,
    });

    toast.success(`承認フロー「${name}」を作成しました`);

    // フォームリセット
    resetForm();
    onOpenChange(false);
  };

  // フォームリセット
  const resetForm = () => {
    setName('');
    setDescription('');
    setFlowType('organization');
    setDocumentType(initialDocumentType || 'leave_request');
    setOrganizationLevels(2);
    setIsDefault(false);
    setIsActive(true);
    setPriority(1);
    setSteps([
      {
        stepNumber: 1,
        name: '',
        mode: 'serial',
        requiredApprovals: 1,
        timeoutHours: 48,
        allowDelegate: true,
        allowSkip: false,
        approvers: [],
      },
    ]);
    setConditions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規承認フロー作成</DialogTitle>
          <DialogDescription>
            申請タイプごとの承認ルートを設定します。組織図に基づく自動ルート、または手動でステップを設定できます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本情報 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">フロー名 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 標準休暇承認フロー"
              />
            </div>

            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="フローの説明を入力してください"
                rows={2}
              />
            </div>

            <div>
              <Label>申請タイプ *</Label>
              <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* フロータイプ選択 */}
          <div className="space-y-4">
            <Label>フロータイプ *</Label>
            <RadioGroup value={flowType} onValueChange={(value) => setFlowType(value as ApprovalFlowType)}>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="organization" id="organization" />
                <Label htmlFor="organization" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">組織連動型</div>
                    <div className="text-sm text-muted-foreground">
                      組織階層に基づいて自動的に承認ルートを決定します
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer flex-1">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-medium">カスタム型</div>
                    <div className="text-sm text-muted-foreground">
                      手動でステップと承認者を設定します
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 組織連動型の設定 */}
          {flowType === 'organization' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-4">
              <div>
                <Label htmlFor="organizationLevels">承認階層レベル</Label>
                <Select
                  value={organizationLevels.toString()}
                  onValueChange={(value) => setOrganizationLevels(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1階層上まで（直属上司のみ）</SelectItem>
                    <SelectItem value="2">2階層上まで（直属上司 → 部長）</SelectItem>
                    <SelectItem value="3">3階層上まで（直属上司 → 部長 → 人事部）</SelectItem>
                    <SelectItem value="4">4階層上まで</SelectItem>
                    <SelectItem value="5">5階層上まで</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  申請者の所属組織から自動的に承認ルートを決定します
                </p>
              </div>
            </div>
          )}

          {/* カスタム型の設定 */}
          {flowType === 'custom' && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Label>承認ステップ</Label>
                <Button onClick={addStep} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  ステップ追加
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">ステップ {step.stepNumber}</Badge>
                      {steps.length > 1 && (
                        <Button
                          onClick={() => removeStep(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>ステップ名 *</Label>
                        <Input
                          value={step.name || ''}
                          onChange={(e) => updateStep(index, 'name', e.target.value)}
                          placeholder="例: 直属上司承認"
                        />
                      </div>

                      <div>
                        <Label>実行モード</Label>
                        <Select
                          value={step.mode}
                          onValueChange={(value) => updateStep(index, 'mode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="serial">順次承認</SelectItem>
                            <SelectItem value="parallel">並列承認</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>タイムアウト（時間）</Label>
                        <Input
                          type="number"
                          value={step.timeoutHours || 48}
                          onChange={(e) => updateStep(index, 'timeoutHours', parseInt(e.target.value))}
                          min={1}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 条件設定 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>適用条件（オプション）</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  特定の条件を満たす場合のみこのフローを適用
                </p>
              </div>
              <Button onClick={addCondition} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                条件追加
              </Button>
            </div>

            {conditions.length > 0 && (
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">条件 {index + 1}</Badge>
                      <Button
                        onClick={() => removeCondition(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>フィールド</Label>
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(index, 'field', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amount">金額</SelectItem>
                            <SelectItem value="days">日数</SelectItem>
                            <SelectItem value="hours">時間</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>演算子</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(operatorLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>値</Label>
                        <Input
                          type="number"
                          value={condition.value || 0}
                          onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value))}
                        />
                      </div>

                      <div className="col-span-3">
                        <Label>説明</Label>
                        <Input
                          value={condition.description || ''}
                          onChange={(e) => updateCondition(index, 'description', e.target.value)}
                          placeholder="例: 10万円以上の経費"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* その他設定 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isDefault">デフォルトフロー</Label>
                <p className="text-xs text-muted-foreground">
                  条件に一致するフローがない場合に使用
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">有効</Label>
                <p className="text-xs text-muted-foreground">
                  無効にすると使用されません
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div>
              <Label htmlFor="priority">優先度</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                数値が大きいほど優先されます（複数該当時）
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
