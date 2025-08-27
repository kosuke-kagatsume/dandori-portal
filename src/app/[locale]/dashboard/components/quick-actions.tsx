'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  Calendar,
  Users,
  AlertCircle,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { roleDisplayNames } from '@/lib/demo-users';

interface QuickActionsProps {
  effectiveDemoUser: any;
  permissions: {
    canViewAll: boolean;
    canViewTeam: boolean;
    canApprove: boolean;
    canManageSystem: boolean;
  };
}

const QuickActions = memo(({ effectiveDemoUser, permissions }: QuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>クイックアクション</CardTitle>
        <CardDescription>
          {effectiveDemoUser ? `${roleDisplayNames[effectiveDemoUser.role]}として実行可能な操作` : 'よく使う操作をすばやく実行できます'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* 全員共通 */}
          <Link href="/ja/attendance">
            <Button className="h-16 w-full flex flex-col space-y-1">
              <Clock className="h-5 w-5" />
              <span className="text-sm">出勤する</span>
            </Button>
          </Link>
          <Link href="/ja/leave">
            <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">有給申請</span>
            </Button>
          </Link>
          
          {/* チーム管理者以上 */}
          {permissions.canViewTeam && (
            <Link href="/ja/members">
              <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                <Users className="h-5 w-5" />
                <span className="text-sm">メンバー確認</span>
              </Button>
            </Link>
          )}
          
          {/* 承認権限 */}
          {permissions.canApprove && (
            <Link href="/ja/approval">
              <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">承認待ち</span>
              </Button>
            </Link>
          )}
          
          {/* 管理者のみ */}
          {permissions.canManageSystem && (
            <>
              <Link href="/ja/users">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-sm">ユーザー管理</span>
                </Button>
              </Link>
              <Link href="/ja/settings">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <Settings className="h-5 w-5" />
                  <span className="text-sm">システム設定</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;