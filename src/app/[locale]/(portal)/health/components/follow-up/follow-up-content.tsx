'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { HealthCheckup } from '@/types/health';

interface Props {
  checkups: HealthCheckup[];
  filterDepartment: string;
  searchQuery: string;
  filterStatus: string;
  onOpenFollowUp: (userId: string, userName: string) => void;
  onOpenInterview: (userId: string, userName: string) => void;
}

export function FollowUpContent({
  checkups,
  filterDepartment, searchQuery, filterStatus,
  onOpenFollowUp,
}: Props) {
  const reexamTargets = checkups
    .filter(c => c.requiresReexam)
    .filter(c => filterDepartment === 'all' || c.department === filterDepartment)
    .filter(c => c.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => filterStatus === 'all' || c.followUpStatus === filterStatus);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            要再検査者リスト
          </CardTitle>
          <CardDescription>要検査対象者</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reexamTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                該当する再検査対象者はいません
              </p>
            ) : reexamTargets.map((checkup) => (
              <div key={checkup.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{checkup.userName}</p>
                  <p className="text-sm text-muted-foreground">{checkup.department}</p>
                  <div className="flex gap-1 mt-1">
                    {checkup.findings.map((finding, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{finding}</Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onOpenFollowUp(checkup.userId, checkup.userName)}>
                  フォロー記録
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
