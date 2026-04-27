'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import type { InstitutionOption } from '@/types/health';

interface OptionsTabProps {
  institutionId: string;
}

export function InstitutionOptionsTab({ institutionId }: OptionsTabProps) {
  const { fetchOptions, addOption, updateOption, deleteOption } = useHealthMasterStore();

  const [options, setOptions] = useState<InstitutionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', code: '', price: '', description: '', companyPaid: false });

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchOptions(institutionId);
      setOptions(data);
    } catch (error) {
      toast.error((error as Error).message || 'オプション検査の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [institutionId, fetchOptions]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleAdd = async () => {
    if (!newForm.name || !newForm.price) {
      toast.error('名前と料金は必須です');
      return;
    }
    try {
      await addOption(institutionId, {
        name: newForm.name,
        code: newForm.code || undefined,
        price: parseInt(newForm.price),
        description: newForm.description || undefined,
        companyPaid: newForm.companyPaid,
      });
      toast.success('オプション検査を追加しました');
      setNewForm({ name: '', code: '', price: '', description: '', companyPaid: false });
      setAddingNew(false);
      await loadOptions();
    } catch (error) {
      toast.error((error as Error).message || 'オプション検査の追加に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOption(id);
      toast.success('削除しました');
      await loadOptions();
    } catch (error) {
      toast.error((error as Error).message || '削除に失敗しました');
    }
  };

  const handleToggleActive = async (item: InstitutionOption) => {
    try {
      await updateOption(item.id, { isActive: !item.isActive });
      await loadOptions();
    } catch (error) {
      toast.error((error as Error).message || '更新に失敗しました');
    }
  };

  const handleToggleCompanyPaid = async (item: InstitutionOption) => {
    try {
      await updateOption(item.id, { companyPaid: !item.companyPaid });
      await loadOptions();
    } catch (error) {
      toast.error((error as Error).message || '更新に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">オプション検査</h4>
        <Button variant="outline" size="sm" onClick={() => setAddingNew(true)} disabled={addingNew}>
          <Plus className="mr-1 h-3 w-3" />
          追加
        </Button>
      </div>

      {options.length === 0 && !addingNew ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          オプション検査が設定されていません
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead>コード</TableHead>
              <TableHead className="text-right">料金</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="w-[80px]">会社負担</TableHead>
              <TableHead className="w-[80px]">有効</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.code || '-'}</TableCell>
                <TableCell className="text-right">¥{item.price.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.description || '-'}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.companyPaid}
                    onCheckedChange={() => handleToggleCompanyPaid(item)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={() => handleToggleActive(item)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {addingNew && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">名前 *</Label>
              <Input
                placeholder="腫瘍マーカー"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">料金 *</Label>
              <Input
                type="number"
                placeholder="3000"
                value={newForm.price}
                onChange={(e) => setNewForm({ ...newForm, price: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">コード</Label>
              <Input
                placeholder="tumor_marker"
                value={newForm.code}
                onChange={(e) => setNewForm({ ...newForm, code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">説明</Label>
              <Input
                placeholder="説明"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={newForm.companyPaid}
              onCheckedChange={(checked) => setNewForm({ ...newForm, companyPaid: checked })}
            />
            <Label className="text-xs">会社負担</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddingNew(false)}>キャンセル</Button>
            <Button size="sm" onClick={handleAdd}>追加</Button>
          </div>
        </div>
      )}
    </div>
  );
}
