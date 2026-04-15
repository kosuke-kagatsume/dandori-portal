'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, Loader2, Upload, Trash2, Mail, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { MynumberDocumentViewer } from './mynumber-document-viewer';
import { MynumberAuditHistory } from './mynumber-audit-history';

interface MynumberRecord {
  id: string;
  hasNumber: boolean;
  maskedNumber: string | null;
  status: string;
  purpose: string | null;
  memo: string | null;
  hasNumberDoc: boolean;
  hasIdentityDoc: boolean;
  requestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MynumberSectionProps {
  userId: string;
  canManage: boolean;
  canRead: boolean;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: '未依頼', variant: 'outline' },
  requested: { label: '依頼中', variant: 'secondary' },
  approved: { label: '承認済み', variant: 'default' },
};

export function MynumberSection({ userId, canManage, canRead }: MynumberSectionProps) {
  const [record, setRecord] = useState<MynumberRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [revealedNumber, setRevealedNumber] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  // Dialogs
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [myNumberInput, setMyNumberInput] = useState('');
  const [purposeInput, setPurposeInput] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDocDialog, setDeleteDocDialog] = useState<{ open: boolean; docType: 'number' | 'identity' }>({ open: false, docType: 'number' });

  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [viewingDocType, setViewingDocType] = useState<'number' | 'identity'>('number');

  const [uploading, setUploading] = useState(false);
  const numberDocRef = useRef<HTMLInputElement>(null);
  const identityDocRef = useRef<HTMLInputElement>(null);

  const [permissionDenied, setPermissionDenied] = useState(false);

  const fetchRecord = useCallback(async () => {
    if (!canRead) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/users/${userId}/mynumber`);
      if (res.status === 403) {
        setPermissionDenied(true);
        return;
      }
      const json = await res.json();
      if (json.success) setRecord(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [userId, canRead]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  // マイナンバー表示/非表示
  const handleRevealToggle = async (checked: boolean) => {
    if (checked && !revealedNumber) {
      setRevealing(true);
      try {
        const res = await fetch(`/api/users/${userId}/mynumber/reveal`, { method: 'POST' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setRevealedNumber(json.data.myNumber);
        setRevealed(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '表示に失敗しました');
      } finally {
        setRevealing(false);
      }
    } else {
      setRevealed(checked);
      if (!checked) setRevealedNumber(null);
    }
  };

  // マイナンバー登録・更新
  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (myNumberInput) body.myNumber = myNumberInput;
      if (purposeInput !== (record?.purpose || '')) body.purpose = purposeInput;
      if (memoInput !== (record?.memo || '')) body.memo = memoInput;

      const res = await fetch(`/api/users/${userId}/mynumber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('マイナンバーを保存しました');
      setRegisterDialogOpen(false);
      setMyNumberInput('');
      setRevealed(false);
      setRevealedNumber(null);
      await fetchRecord();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // マイナンバー削除
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/mynumber`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('マイナンバーを削除しました');
      setDeleteDialogOpen(false);
      setRevealed(false);
      setRevealedNumber(null);
      await fetchRecord();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '削除に失敗しました');
    }
  };

  // 書類アップロード
  const handleDocUpload = async (file: File, docType: 'number' | 'identity') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const res = await fetch(`/api/users/${userId}/mynumber/document`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`${docType === 'number' ? '番号確認書類' : '身元確認書類'}をアップロードしました`);
      await fetchRecord();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  // 書類削除
  const handleDocDelete = async () => {
    try {
      const params = new URLSearchParams({ docType: deleteDocDialog.docType });
      const res = await fetch(`/api/users/${userId}/mynumber/document?${params}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('書類を削除しました');
      setDeleteDocDialog({ open: false, docType: 'number' });
      await fetchRecord();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '削除に失敗しました');
    }
  };

  // 提供依頼
  const handleRequest = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/mynumber/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('提供依頼を送信しました');
      await fetchRecord();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '提供依頼に失敗しました');
    }
  };

  if (!canRead || permissionDenied) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle className="text-base">マイナンバー</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>マイナンバーの閲覧には個別権限が必要です。管理者に権限付与を依頼してください。</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusLabels[record?.status || 'pending'] || statusLabels.pending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">マイナンバー</CardTitle>
                <CardDescription>個人番号（暗号化保存・アクセスログ記録）</CardDescription>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setMyNumberInput('');
                  setPurposeInput(record?.purpose || '');
                  setMemoInput(record?.memo || '');
                  setRegisterDialogOpen(true);
                }}>
                  {record?.hasNumber ? '変更' : '登録'}
                </Button>
                {record?.hasNumber && (
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {/* マイナンバー */}
              <TableRow>
                <TableCell className="font-medium w-40">マイナンバー</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">
                      {record?.hasNumber
                        ? (revealed && revealedNumber ? revealedNumber : '************')
                        : '未登録'}
                    </span>
                    {record?.hasNumber && (
                      <div className="flex items-center gap-1.5">
                        {revealing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Checkbox
                            id="reveal-mynumber"
                            checked={revealed}
                            onCheckedChange={(checked) => handleRevealToggle(!!checked)}
                          />
                        )}
                        <label htmlFor="reveal-mynumber" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />表示
                        </label>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {/* 番号確認書類 */}
              <TableRow>
                <TableCell className="font-medium">番号確認書類</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {record?.hasNumberDoc ? (
                      <>
                        <Button
                          variant="link" size="sm" className="p-0 h-auto"
                          onClick={() => { setViewingDocType('number'); setDocViewerOpen(true); }}
                        >
                          番号確認書類を確認
                        </Button>
                        {canManage && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteDocDialog({ open: true, docType: 'number' })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : canManage ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => numberDocRef.current?.click()} disabled={uploading}>
                          {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                          ファイルを選択
                        </Button>
                        <input ref={numberDocRef} type="file" accept="image/jpeg,image/png" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, 'number'); e.target.value = ''; }} />
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">未登録</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {/* 身元確認書類 */}
              <TableRow>
                <TableCell className="font-medium">身元確認書類</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {record?.hasIdentityDoc ? (
                      <>
                        <Button
                          variant="link" size="sm" className="p-0 h-auto"
                          onClick={() => { setViewingDocType('identity'); setDocViewerOpen(true); }}
                        >
                          身元確認書類を確認
                        </Button>
                        {canManage && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteDocDialog({ open: true, docType: 'identity' })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : canManage ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => identityDocRef.current?.click()} disabled={uploading}>
                          {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                          ファイルを選択
                        </Button>
                        <input ref={identityDocRef} type="file" accept="image/jpeg,image/png" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, 'identity'); e.target.value = ''; }} />
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">未登録</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {/* 利用目的 */}
              <TableRow>
                <TableCell className="font-medium">利用目的</TableCell>
                <TableCell className="text-sm">{record?.purpose || '-'}</TableCell>
              </TableRow>

              {/* 提供ステータス */}
              <TableRow>
                <TableCell className="font-medium">提供ステータス</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    {canManage && (
                      <Button variant="outline" size="sm" onClick={handleRequest}>
                        <Mail className="mr-1 h-4 w-4" />提供依頼
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {/* メモ */}
              <TableRow>
                <TableCell className="font-medium">メモ</TableCell>
                <TableCell className="text-sm">{record?.memo || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 操作履歴 */}
      <MynumberAuditHistory userId={userId} />

      {/* 書類閲覧モーダル */}
      <MynumberDocumentViewer
        open={docViewerOpen}
        onOpenChange={setDocViewerOpen}
        userId={userId}
        docType={viewingDocType}
      />

      {/* マイナンバー登録/更新ダイアログ */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>マイナンバーの{record?.hasNumber ? '変更' : '登録'}</DialogTitle>
            <DialogDescription>12桁の個人番号を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">マイナンバー *</label>
              <Input
                type="text" maxLength={12}
                value={myNumberInput}
                onChange={(e) => setMyNumberInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456789012"
                className="font-mono mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">半角数字12桁</p>
            </div>
            <div>
              <label className="text-sm font-medium">利用目的</label>
              <Textarea
                value={purposeInput}
                onChange={(e) => setPurposeInput(e.target.value)}
                placeholder="社会保険・税務手続き等"
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">メモ</label>
              <Textarea
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || myNumberInput.length !== 12}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* マイナンバー削除確認 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>マイナンバーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は監査ログに記録されます。削除後も履歴は確認できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 書類削除確認 */}
      <AlertDialog open={deleteDocDialog.open} onOpenChange={(open) => setDeleteDocDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDocDialog.docType === 'number' ? '番号確認書類' : '身元確認書類'}を削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              この操作は監査ログに記録されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDocDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
