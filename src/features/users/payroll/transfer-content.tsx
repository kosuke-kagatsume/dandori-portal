'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard, Edit, Plus, Trash2, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type BankAccount, accountTypeLabels } from '@/lib/payroll/payroll-types';

interface Props {
  userId: string;
  canEdit: boolean;
}

export function TransferContent({ userId, canEdit }: Props) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [deleteBankId, setDeleteBankId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '', branchName: '', accountType: 'ordinary',
    accountNumber: '', accountHolder: '', isPrimary: false, transferAmount: '',
  });

  const fetchBankAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/bank-accounts`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setBankAccounts(data.data);
      }
    } catch { /* */ }
  }, [userId]);

  useEffect(() => { fetchBankAccounts(); }, [fetchBankAccounts]);

  const openAddBank = () => {
    setEditingBank(null);
    setBankForm({ bankName: '', branchName: '', accountType: 'ordinary', accountNumber: '', accountHolder: '', isPrimary: bankAccounts.length === 0, transferAmount: '' });
    setBankDialogOpen(true);
  };

  const openEditBank = (account: BankAccount) => {
    setEditingBank(account);
    setBankForm({
      bankName: account.bankName, branchName: account.branchName,
      accountType: account.accountType, accountNumber: account.accountNumber,
      accountHolder: account.accountHolder, isPrimary: account.isPrimary,
      transferAmount: account.transferAmount != null ? String(account.transferAmount) : '',
    });
    setBankDialogOpen(true);
  };

  const saveBank = async () => {
    if (!bankForm.bankName || !bankForm.branchName || !bankForm.accountNumber || !bankForm.accountHolder) {
      toast.error('必須項目を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...bankForm, transferAmount: bankForm.transferAmount ? parseInt(bankForm.transferAmount) : null };
      const url = editingBank ? `/api/users/${userId}/bank-accounts/${editingBank.id}` : `/api/users/${userId}/bank-accounts`;
      const method = editingBank ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success(editingBank ? '口座情報を更新しました' : '口座を追加しました');
      setBankDialogOpen(false);
      await fetchBankAccounts();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBank = async () => {
    if (!deleteBankId) return;
    try {
      const res = await fetch(`/api/users/${userId}/bank-accounts/${deleteBankId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('口座を削除しました');
      setDeleteBankId(null);
      await fetchBankAccounts();
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">振込口座</CardTitle>
                <CardDescription>給与の振込先口座（メイン口座 + サブ口座）</CardDescription>
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={openAddBank}>
                <Plus className="mr-1 h-4 w-4" />追加
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">振込口座の登録はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区分</TableHead>
                  <TableHead>銀行名</TableHead>
                  <TableHead>支店名</TableHead>
                  <TableHead>口座種別</TableHead>
                  <TableHead>口座番号</TableHead>
                  <TableHead>名義人</TableHead>
                  <TableHead className="text-right">振込額</TableHead>
                  {canEdit && <TableHead className="w-[80px]">操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.sort((a, b) => a.sortOrder - b.sortOrder).map(account => (
                  <TableRow key={account.id} className={canEdit ? 'cursor-pointer' : ''} onClick={() => canEdit && openEditBank(account)}>
                    <TableCell>
                      <Badge variant={account.isPrimary ? 'default' : 'secondary'}>
                        {account.isPrimary ? 'メイン' : 'サブ'}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.bankName}</TableCell>
                    <TableCell>{account.branchName}</TableCell>
                    <TableCell>{accountTypeLabels[account.accountType] || account.accountType}</TableCell>
                    <TableCell>{account.accountNumber}</TableCell>
                    <TableCell>{account.accountHolder}</TableCell>
                    <TableCell className="text-right">
                      {account.isPrimary ? '残額全額' : (account.transferAmount != null ? `¥${account.transferAmount.toLocaleString()}` : '残額全額')}
                    </TableCell>
                    {canEdit && (
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditBank(account)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteBankId(account.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {bankAccounts.length > 1 && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                サブ口座に定額が設定されている場合、残額がメイン口座に振り込まれます。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 口座追加・編集ダイアログ */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBank ? '口座情報の編集' : '振込口座の追加'}</DialogTitle>
            <DialogDescription>振込先口座の情報を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>銀行名 *</Label>
                <Input value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>支店名 *</Label>
                <Input value={bankForm.branchName} onChange={e => setBankForm(f => ({ ...f, branchName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>口座種別</Label>
                <Select value={bankForm.accountType} onValueChange={v => setBankForm(f => ({ ...f, accountType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinary">普通</SelectItem>
                    <SelectItem value="current">当座</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>口座番号 *</Label>
                <Input value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>口座名義 *</Label>
              <Input value={bankForm.accountHolder} onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={bankForm.isPrimary} onCheckedChange={v => setBankForm(f => ({ ...f, isPrimary: v }))} />
                <Label>メイン口座</Label>
              </div>
              {!bankForm.isPrimary && (
                <div className="space-y-1">
                  <Label>振込額</Label>
                  <Input type="number" value={bankForm.transferAmount} onChange={e => setBankForm(f => ({ ...f, transferAmount: e.target.value }))} placeholder="空欄で残額全額" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveBank} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {editingBank ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 口座削除確認 */}
      <AlertDialog open={!!deleteBankId} onOpenChange={() => setDeleteBankId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>口座の削除</AlertDialogTitle>
            <AlertDialogDescription>この口座情報を削除しますか？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBank}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
