'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useCachedData } from '@/lib/cache-service';

interface ActivityFeedProps {
  permissions: {
    canViewAll: boolean;
    canViewTeam: boolean;
    canApprove: boolean;
    canManageSystem: boolean;
  };
  t: (key: string) => string;
}

const ActivityFeed = memo(({ permissions, t }: ActivityFeedProps) => {
  // キャッシュされたアクティビティデータ
  const { data: recentActivity, loading } = useCachedData(
    'dashboard-activity',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
      return [
        { id: 1, user: '田中太郎', action: '有給申請を提出', time: '5分前' },
        { id: 2, user: '佐藤花子', action: '勤怠記録を修正', time: '15分前' },
        { id: 3, user: '山田次郎', action: '経費申請を承認', time: '30分前' },
        { id: 4, user: '鈴木一郎', action: '出勤記録', time: '1時間前' },
      ];
    },
    { ttl: 60 * 1000 } // 1分キャッシュ
  );

  const filteredActivity = recentActivity?.filter((activity, index) => {
    if (permissions.canViewAll) return true;
    if (permissions.canViewTeam) return index < 3;
    return index === 0;
  }) || [];

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('recentActivity')}
        </CardTitle>
        <CardDescription>
          {permissions.canViewAll ? '全社の活動' : permissions.canViewTeam ? 'チームの活動' : '自分の活動'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-5 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              すべての活動を表示
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
});

ActivityFeed.displayName = 'ActivityFeed';

export default ActivityFeed;