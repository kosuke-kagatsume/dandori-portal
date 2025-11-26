'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GitBranch, AlertTriangle, CheckCircle, MessageSquare, Plus, Edit2, Copy, Trash2, CheckCircle2, Building2 } from 'lucide-react';
import { useApprovalFlowStore } from '@/lib/store/approval-flow-store';
import type { DocumentType } from '@/types/approval-flow';
import type { SettingsTabProps } from '../types';
import { CreateApprovalFlowDialog } from '../components/create-approval-flow-dialog';
import { EditApprovalFlowDialog } from '../components/edit-approval-flow-dialog';

/**
 * ドキュメントタイプの日本語名
 */
const documentTypeLabels: Record<DocumentType, string> = {
  leave_request: '休暇申請',
  overtime_request: '残業申請',
  expense_claim: '経費申請',
  business_trip: '出張申請',
  purchase_request: '購買申請',
};

export function WorkflowTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  const {
    flows,
    initialized,
    getFlowsByDocumentType,
    getStats,
    deleteFlow,
    duplicateFlow,
    initializeDemoData,
  } = useApprovalFlowStore();

  const [activeDocumentType, setActiveDocumentType] = useState<DocumentType>('leave_request');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    if (!initialized) {
      initializeDemoData();
    }
  }, [initialized, initializeDemoData]);

  const stats = getStats();
  const currentFlows = getFlowsByDocumentType(activeDocumentType);

  const handleDelete = async (id: string) => {
    if (confirm('このフローを削除しますか？この操作は取り消せません。')) {
      await deleteFlow(id);
    }
  };

  const handleDuplicate = async (id: string) => {
    await duplicateFlow(id);
  };

  const handleEdit = (id: string) => {
    setEditingFlowId(id);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">一般設定</TabsTrigger>
          <TabsTrigger value="approval-flows">承認フロー管理</TabsTrigger>
        </TabsList>

        {/* 一般設定タブ */}
        <TabsContent value="general" className="space-y-6">
      {/* 承認期限設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            <CardTitle>承認期限設定</CardTitle>
          </div>
          <CardDescription>ワークフローの承認期限を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultApprovalDeadlineDays">デフォルト承認期限（日数） *</Label>
            <Input
              id="defaultApprovalDeadlineDays"
              type="number"
              min="1"
              max="30"
              value={settings.workflow.defaultApprovalDeadlineDays}
              onChange={(e) => updateSettings({
                workflow: { ...settings.workflow, defaultApprovalDeadlineDays: parseInt(e.target.value) }
              })}
            />
            <p className="text-sm text-muted-foreground">
              承認者が承認するまでの標準期限（日数）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* エスカレーション設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle>エスカレーション設定</CardTitle>
          </div>
          <CardDescription>承認遅延時の自動エスカレーション設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自動エスカレーションを有効にする</Label>
              <p className="text-sm text-muted-foreground">
                期限超過時に上位承認者へ自動的にエスカレーション
              </p>
            </div>
            <Switch
              checked={settings.workflow.enableAutoEscalation}
              onCheckedChange={(checked) => updateSettings({
                workflow: { ...settings.workflow, enableAutoEscalation: checked }
              })}
            />
          </div>

          {settings.workflow.enableAutoEscalation && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="escalationReminderDays">エスカレーション前のリマインダー（日数） *</Label>
                <Input
                  id="escalationReminderDays"
                  type="number"
                  min="0"
                  max="10"
                  value={settings.workflow.escalationReminderDays}
                  onChange={(e) => updateSettings({
                    workflow: { ...settings.workflow, escalationReminderDays: parseInt(e.target.value) }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  期限の何日前にリマインダーを送信するか
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 自動承認設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <CardTitle>自動承認設定</CardTitle>
          </div>
          <CardDescription>一定条件下での自動承認を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自動承認を有効にする</Label>
              <p className="text-sm text-muted-foreground">
                一定金額以下の申請を自動承認する
              </p>
            </div>
            <Switch
              checked={settings.workflow.enableAutoApproval}
              onCheckedChange={(checked) => updateSettings({
                workflow: { ...settings.workflow, enableAutoApproval: checked }
              })}
            />
          </div>

          {settings.workflow.enableAutoApproval && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="autoApprovalThreshold">自動承認金額上限（円） *</Label>
                <Input
                  id="autoApprovalThreshold"
                  type="number"
                  min="0"
                  max="1000000"
                  value={settings.workflow.autoApprovalThreshold}
                  onChange={(e) => updateSettings({
                    workflow: { ...settings.workflow, autoApprovalThreshold: parseInt(e.target.value) }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  この金額以下の申請は自動的に承認されます
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 承認ルール設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <CardTitle>承認ルール設定</CardTitle>
          </div>
          <CardDescription>承認時のルールを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>却下時のコメントを必須にする</Label>
              <p className="text-sm text-muted-foreground">
                申請を却下する際にコメントの入力を必須にする
              </p>
            </div>
            <Switch
              checked={settings.workflow.requireCommentOnReject}
              onCheckedChange={(checked) => updateSettings({
                workflow: { ...settings.workflow, requireCommentOnReject: checked }
              })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>並行承認を許可する</Label>
              <p className="text-sm text-muted-foreground">
                複数の承認者が同時に承認できるようにする
              </p>
            </div>
            <Switch
              checked={settings.workflow.allowParallelApproval}
              onCheckedChange={(checked) => updateSettings({
                workflow: { ...settings.workflow, allowParallelApproval: checked }
              })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>代理承認を有効にする</Label>
              <p className="text-sm text-muted-foreground">
                承認者が不在時に代理承認者が承認できるようにする
              </p>
            </div>
            <Switch
              checked={settings.workflow.enableProxyApproval}
              onCheckedChange={(checked) => updateSettings({
                workflow: { ...settings.workflow, enableProxyApproval: checked }
              })}
            />
          </div>
        </CardContent>
      </Card>

          {/* 保存ボタン */}
          <div className="flex justify-end">
            <Button onClick={saveSettings} size="lg">
              ワークフロー設定を保存
            </Button>
          </div>
        </TabsContent>

        {/* 承認フロー管理タブ */}
        <TabsContent value="approval-flows" className="space-y-6">
          {/* 説明 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                <CardTitle>承認フロー管理</CardTitle>
              </div>
              <CardDescription>
                申請タイプごとに承認ルートを設定します。組織図に基づく自動ルート決定、または手動でステップを設定できます。
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 統計カード */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">全フロー数</span>
                  <span className="text-3xl font-bold">{stats.totalFlows}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">組織連動型</span>
                  <span className="text-3xl font-bold text-blue-600">{stats.organizationFlows}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">カスタム型</span>
                  <span className="text-3xl font-bold text-purple-600">{stats.customFlows}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">有効フロー</span>
                  <span className="text-3xl font-bold text-green-600">{stats.activeFlows}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* タブ切り替え */}
          <Tabs defaultValue="leave_request" className="space-y-4 w-full" onValueChange={(value) => setActiveDocumentType(value as DocumentType)}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              {(Object.keys(documentTypeLabels) as DocumentType[]).map((type) => (
                <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                  <span className="hidden sm:inline">{documentTypeLabels[type]}</span>
                  <span className="sm:hidden">{documentTypeLabels[type].replace('申請', '')}</span>
                  <Badge variant="secondary" className="ml-1">
                    {stats.flowsByDocumentType[type]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {(Object.keys(documentTypeLabels) as DocumentType[]).map((type) => (
              <TabsContent key={type} value={type} className="space-y-4">
                {/* 新規フロー作成ボタン */}
                <div className="flex justify-end">
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    新規フロー作成
                  </Button>
                </div>

                {/* フロー一覧 */}
                {currentFlows.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {documentTypeLabels[type]}の承認フローがありません
                      </p>
                      <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        最初のフローを作成
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {currentFlows.map((flow) => (
                      <Card key={flow.id} className={!flow.isActive ? 'opacity-60' : ''}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{flow.name}</CardTitle>
                                {flow.isDefault && (
                                  <Badge variant="default">デフォルト</Badge>
                                )}
                                {!flow.isActive && (
                                  <Badge variant="secondary">無効</Badge>
                                )}
                                {flow.type === 'organization' ? (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    組織連動
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <GitBranch className="w-3 h-3" />
                                    カスタム
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>{flow.description}</CardDescription>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(flow.id)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDuplicate(flow.id)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(flow.id)}
                                disabled={flow.isDefault}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="space-y-4">
                            {/* フロー詳細 */}
                            {flow.type === 'organization' && (
                              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                  組織連動型設定
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  承認階層レベル: {flow.organizationLevels}階層上まで
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  申請者の所属組織から自動的に承認ルートを決定します
                                </p>
                              </div>
                            )}

                            {flow.type === 'custom' && flow.steps && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium mb-2">承認ステップ ({flow.steps.length}ステップ)</p>
                                <div className="flex flex-wrap gap-2">
                                  {flow.steps.map((step) => (
                                    <Badge key={step.id} variant="outline" className="flex items-center gap-1">
                                      <span className="text-xs">{step.stepNumber}.</span>
                                      {step.name}
                                      <span className="text-xs text-muted-foreground">
                                        ({step.timeoutHours}h)
                                      </span>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 条件 */}
                            {flow.conditions && flow.conditions.length > 0 && (
                              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                                  適用条件
                                </p>
                                <ul className="space-y-1">
                                  {flow.conditions.map((condition) => (
                                    <li key={condition.id} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {condition.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* メタ情報 */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                              <span>優先度: {flow.priority || 1}</span>
                              <span>更新: {new Date(flow.updatedAt).toLocaleDateString('ja-JP')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* フロー作成モーダル */}
      <CreateApprovalFlowDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        documentType={activeDocumentType}
      />

      {/* フロー編集モーダル */}
      <EditApprovalFlowDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        flowId={editingFlowId}
      />
    </div>
  );
}
