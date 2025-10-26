'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { GitBranch, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function WorkflowTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}
