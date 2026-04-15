'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History } from 'lucide-react';

interface AuditLog {
  id: string;
  userName: string | null;
  action: string;
  targetName: string | null;
  description: string;
  createdAt: string;
}

interface MynumberAuditHistoryProps {
  userId?: string;
}

const actionLabels: Record<string, string> = {
  create: '登録',
  update: '更新',
  delete: '削除',
  access: '閲覧',
  export: '出力',
};

export function MynumberAuditHistory({ userId }: MynumberAuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (userId) params.set('userId', userId);
      const res = await fetch(`/api/mynumber/audit-history?${params}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle className="text-base">操作履歴</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">操作履歴はありません</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>対象者</TableHead>
                <TableHead>操作内容</TableHead>
                <TableHead>操作日時</TableHead>
                <TableHead>操作ユーザー</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{log.targetName || '-'}</TableCell>
                  <TableCell className="text-sm">{log.description || actionLabels[log.action] || log.action}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(log.createdAt).toLocaleString('ja-JP', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="text-sm">{log.userName || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
