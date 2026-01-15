'use client';

import { useState } from 'react';
import { useAttendanceAlertStore, AlertType, AlertLevel } from '@/lib/store/attendance-alert-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Settings2,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export function AlertMasterPanel() {
  const {
    agreement36Settings,
    updateAlertType,
    updateAgreement36Settings,
    getAlertTypesByCategory,
  } = useAttendanceAlertStore();

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AlertType['category']>('punch');

  // アラートレベルのバッジ
  const getLevelBadge = (level: AlertLevel) => {
    switch (level) {
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            エラー
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700 bg-yellow-50">
            <AlertTriangle className="h-3 w-3" />
            警告
          </Badge>
        );
      case 'none':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            なし
          </Badge>
        );
    }
  };

  // アラートレベル変更
  const handleLevelChange = (alertId: string, level: AlertLevel) => {
    updateAlertType(alertId, { level });
    toast.success('アラートレベルを変更しました');
  };

  // アラート有効/無効切り替え
  const handleToggleActive = (alertId: string, isActive: boolean) => {
    updateAlertType(alertId, { isActive });
    toast.success(isActive ? 'アラートを有効化しました' : 'アラートを無効化しました');
  };

  // カテゴリ別アラート
  const categoryAlerts = getAlertTypesByCategory(activeCategory);

  return (
    <div className="space-y-6">
      {/* 36協定設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">36協定設定</CardTitle>
                <CardDescription>
                  時間外労働の上限設定
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              設定
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">月上限</div>
              <div className="text-xl font-bold">{agreement36Settings.monthlyLimit}時間</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">年上限</div>
              <div className="text-xl font-bold">{agreement36Settings.yearlyLimit}時間</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">特別月上限</div>
              <div className="text-xl font-bold">{agreement36Settings.specialMonthlyLimit}時間</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">警告閾値</div>
              <div className="text-xl font-bold">{agreement36Settings.warningThreshold}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アラート種別一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">アラート種別設定</CardTitle>
          <CardDescription>
            勤怠アラートのレベルと有効/無効を設定します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AlertType['category'])}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="punch" className="flex items-center gap-1 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">打刻</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-1 text-xs sm:text-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">スケジュール</span>
              </TabsTrigger>
              <TabsTrigger value="overtime" className="flex items-center gap-1 text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">残業</span>
              </TabsTrigger>
              <TabsTrigger value="leave" className="flex items-center gap-1 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">休暇</span>
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-1 text-xs sm:text-sm">
                <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">その他</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeCategory} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>コード</TableHead>
                    <TableHead>アラート名</TableHead>
                    <TableHead>レベル</TableHead>
                    <TableHead>有効</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {alert.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{alert.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {alert.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.isEditable ? (
                          <Select
                            value={alert.level}
                            onValueChange={(value) => handleLevelChange(alert.id, value as AlertLevel)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">なし</SelectItem>
                              <SelectItem value="warning">警告</SelectItem>
                              <SelectItem value="error">エラー</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {getLevelBadge(alert.level)}
                            <Badge variant="outline" className="text-xs">
                              固定
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={(checked) => handleToggleActive(alert.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                アラート設定について
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• 「固定」と表示されているアラートはレベル変更できません（法定要件等）</li>
                <li>• 「エラー」レベルのアラートがある場合、勤怠締めができません</li>
                <li>• 36協定超過は「エラー」レベルに設定することを推奨します</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 36協定設定ダイアログ */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              36協定設定
            </DialogTitle>
            <DialogDescription>
              時間外労働の上限時間を設定します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">36協定チェックを有効にする</Label>
              <Switch
                id="enabled"
                checked={agreement36Settings.enabled}
                onCheckedChange={(checked) =>
                  updateAgreement36Settings({ enabled: checked })
                }
              />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">通常上限</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyLimit">月の上限時間</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="monthlyLimit"
                        type="number"
                        value={agreement36Settings.monthlyLimit}
                        onChange={(e) =>
                          updateAgreement36Settings({
                            monthlyLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">時間</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearlyLimit">年の上限時間</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="yearlyLimit"
                        type="number"
                        value={agreement36Settings.yearlyLimit}
                        onChange={(e) =>
                          updateAgreement36Settings({
                            yearlyLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">時間</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">特別条項</CardTitle>
                <CardDescription>
                  臨時的な特別な事情がある場合の上限
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialMonthlyLimit">月の上限時間</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="specialMonthlyLimit"
                        type="number"
                        value={agreement36Settings.specialMonthlyLimit}
                        onChange={(e) =>
                          updateAgreement36Settings({
                            specialMonthlyLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">時間</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialYearlyLimit">年の上限時間</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="specialYearlyLimit"
                        type="number"
                        value={agreement36Settings.specialYearlyLimit}
                        onChange={(e) =>
                          updateAgreement36Settings({
                            specialYearlyLimit: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">時間</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialMonthsLimit">適用可能月数</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="specialMonthsLimit"
                      type="number"
                      value={agreement36Settings.specialMonthsLimit}
                      onChange={(e) =>
                        updateAgreement36Settings({
                          specialMonthsLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">ヶ月/年</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="warningThreshold">警告閾値</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="warningThreshold"
                  type="number"
                  value={agreement36Settings.warningThreshold}
                  onChange={(e) =>
                    updateAgreement36Settings({
                      warningThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%に達したら警告</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
