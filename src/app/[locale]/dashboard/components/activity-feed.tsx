'use client';

import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Activity } from 'lucide-react';
import { useCachedData } from '@/lib/cache-service';
import { StaggerContainer, StaggerItem } from '@/components/motion/page-transition';
import { motion } from 'framer-motion';

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
  const [showAllActivities, setShowAllActivities] = useState(false);

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

  // 全ての活動（モーダル用）
  const allActivities = [
    { id: 1, user: '田中太郎', action: '有給申請を提出', time: '5分前' },
    { id: 2, user: '佐藤花子', action: '勤怠記録を修正', time: '15分前' },
    { id: 3, user: '山田次郎', action: '経費申請を承認', time: '30分前' },
    { id: 4, user: '鈴木一郎', action: '出勤記録', time: '1時間前' },
    { id: 5, user: '高橋美咲', action: '退勤記録', time: '2時間前' },
    { id: 6, user: '伊藤健太', action: '休暇申請を承認', time: '3時間前' },
    { id: 7, user: '渡辺由美', action: '勤怠報告書を提出', time: '4時間前' },
    { id: 8, user: '中村雅人', action: 'プロフィールを更新', time: '5時間前' },
    { id: 9, user: '小林優子', action: '給与明細を確認', time: '6時間前' },
    { id: 10, user: '加藤大輔', action: '有給申請を提出', time: '7時間前' },
    { id: 11, user: '吉田春奈', action: '出勤記録', time: '8時間前' },
    { id: 12, user: '山口隆', action: '経費申請を提出', time: '9時間前' },
  ];

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
            <StaggerContainer>
              <div className="space-y-3">
                {filteredActivity.map((activity) => (
                  <StaggerItem key={activity.id}>
                    <motion.div
                      className="flex items-center justify-between"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.time}
                      </Badge>
                    </motion.div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => setShowAllActivities(true)}
            >
              すべての活動を表示
            </Button>
          </>
        )}
      </CardContent>

      {/* 全ての活動を表示するモーダル */}
      <Dialog open={showAllActivities} onOpenChange={setShowAllActivities}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>すべての活動</DialogTitle>
            <DialogDescription>
              {permissions.canViewAll ? '全社の活動履歴' : permissions.canViewTeam ? 'チームの活動履歴' : '自分の活動履歴'}
            </DialogDescription>
          </DialogHeader>
          <StaggerContainer>
            <div className="space-y-3 mt-4">
              {allActivities
                .filter((activity, index) => {
                  if (permissions.canViewAll) return true;
                  if (permissions.canViewTeam) return index < 8;
                  return index < 4;
                })
                .map((activity) => (
                  <StaggerItem key={activity.id}>
                    <motion.div
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      whileHover={{ scale: 1.01, x: 4 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{activity.user}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.time}
                      </Badge>
                    </motion.div>
                  </StaggerItem>
                ))}
            </div>
          </StaggerContainer>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

ActivityFeed.displayName = 'ActivityFeed';

export default ActivityFeed;