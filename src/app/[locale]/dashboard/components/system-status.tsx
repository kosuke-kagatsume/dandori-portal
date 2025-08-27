'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Wifi,
  WifiOff,
  ShieldCheck,
  Users,
  BarChart3,
  FileText
} from 'lucide-react';
import { useCachedData } from '@/lib/cache-service';

interface SystemStatusProps {
  permissions: {
    canViewAll: boolean;
    canViewTeam: boolean;
    canApprove: boolean;
    canManageSystem: boolean;
  };
  t: (key: string) => string;
}

const SystemStatus = memo(({ permissions, t }: SystemStatusProps) => {
  // キャッシュされたシステムステータス
  const { data: systemStatus, loading } = useCachedData(
    'dashboard-system-status',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        database: { status: 'connected', label: 'データベース' },
        api: { status: 'connected', label: '外部API' },
        mail: { status: 'maintenance', label: 'メール配信' },
        lastUpdate: '2024年1月15日 14:30',
      };
    },
    { ttl: 30 * 1000 } // 30秒キャッシュ
  );

  if (permissions.canManageSystem) {
    return (
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            システム管理
          </CardTitle>
          <CardDescription>
            管理者専用機能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              ユーザー管理
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ShieldCheck className="h-4 w-4 mr-2" />
              セキュリティ設定
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              システム分析
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              監査ログ
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-green-500" />
          {t('systemConnection')}
        </CardTitle>
        <CardDescription>
          システム接続状態
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : systemStatus && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{systemStatus.database.label}</span>
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  接続中
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{systemStatus.api.label}</span>
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  接続中
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{systemStatus.mail.label}</span>
                <Badge variant="secondary">
                  <WifiOff className="h-3 w-3 mr-1" />
                  メンテナンス中
                </Badge>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                最終更新: {systemStatus.lastUpdate}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

SystemStatus.displayName = 'SystemStatus';

export default SystemStatus;