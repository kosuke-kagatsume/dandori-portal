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
import { StaggerContainer, StaggerItem } from '@/components/motion/page-transition';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  permissions: {
    canViewAll: boolean;
    canViewTeam: boolean;
    canApprove: boolean;
    canManageSystem: boolean;
  };
}

const QuickActions = memo(({ permissions }: QuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>クイックアクション</CardTitle>
        <CardDescription>
          よく使う操作をすばやく実行できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StaggerContainer>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* 全員共通 */}
            <StaggerItem>
              <Link href="/ja/attendance">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Button className="h-16 w-full flex flex-col space-y-1">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">出勤する</span>
                  </Button>
                </motion.div>
              </Link>
            </StaggerItem>
            <StaggerItem>
              <Link href="/ja/leave">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">有給申請</span>
                  </Button>
                </motion.div>
              </Link>
            </StaggerItem>

            {/* チーム管理者以上 */}
            {permissions.canViewTeam && (
              <StaggerItem>
                <Link href="/ja/members">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                      <Users className="h-5 w-5" />
                      <span className="text-sm">メンバー確認</span>
                    </Button>
                  </motion.div>
                </Link>
              </StaggerItem>
            )}

            {/* 承認権限 */}
            {permissions.canApprove && (
              <StaggerItem>
                <Link href="/ja/workflow">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">承認待ち</span>
                    </Button>
                  </motion.div>
                </Link>
              </StaggerItem>
            )}

            {/* 管理者のみ */}
            {permissions.canManageSystem && (
              <>
                <StaggerItem>
                  <Link href="/ja/users">
                    <motion.div
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-sm">ユーザー管理</span>
                      </Button>
                    </motion.div>
                  </Link>
                </StaggerItem>
                <StaggerItem>
                  <Link href="/ja/settings">
                    <motion.div
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                        <Settings className="h-5 w-5" />
                        <span className="text-sm">システム設定</span>
                      </Button>
                    </motion.div>
                  </Link>
                </StaggerItem>
              </>
            )}
          </div>
        </StaggerContainer>
      </CardContent>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;