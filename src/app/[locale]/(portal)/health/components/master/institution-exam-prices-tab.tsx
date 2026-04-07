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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import type { InstitutionExamPrice } from '@/types/health';

interface ExamPricesTabProps {
  institutionId: string;
}

export function InstitutionExamPricesTab({ institutionId }: ExamPricesTabProps) {
  const {
    checkupTypes,
    fetchExamPrices,
    addExamPrice,
    updateExamPrice,
    deleteExamPrice,
    getActiveCheckupTypes,
    fetchCheckupTypes,
  } = useHealthMasterStore();

  const [prices, setPrices] = useState<InstitutionExamPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ checkupTypeId: '', price: '', notes: '' });

  const activeCheckupTypes = getActiveCheckupTypes();

  const loadPrices = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchExamPrices(institutionId);
    setPrices(data);
    setIsLoading(false);
  }, [institutionId, fetchExamPrices]);

  useEffect(() => {
    loadPrices();
    // 健診種別マスタが未取得なら取得
    if (checkupTypes.length === 0) {
      fetchCheckupTypes();
    }
  }, [loadPrices, checkupTypes.length, fetchCheckupTypes]);

  const handleAdd = async () => {
    if (!newForm.checkupTypeId || !newForm.price) {
      toast.error('検査種別と料金は必須です');
      return;
    }
    await addExamPrice(institutionId, {
      checkupTypeId: newForm.checkupTypeId,
      price: parseInt(newForm.price),
      notes: newForm.notes || undefined,
    });
    toast.success('検査項目料金を追加しました');
    setNewForm({ checkupTypeId: '', price: '', notes: '' });
    setAddingNew(false);
    await loadPrices();
  };

  const handleDelete = async (id: string) => {
    await deleteExamPrice(id);
    toast.success('削除しました');
    await loadPrices();
  };

  const handleToggleActive = async (item: InstitutionExamPrice) => {
    await updateExamPrice(item.id, { isActive: !item.isActive });
    await loadPrices();
  };

  // 既に設定済みの検査種別IDを取得
  const usedTypeIds = prices.map(p => p.checkupTypeId);
  const availableTypes = activeCheckupTypes.filter(t => !usedTypeIds.includes(t.id));

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
        <h4 className="text-sm font-medium">健診種別・料金設定</h4>
        <Button variant="outline" size="sm" onClick={() => setAddingNew(true)} disabled={addingNew}>
          <Plus className="mr-1 h-3 w-3" />
          追加
        </Button>
      </div>

      {prices.length === 0 && !addingNew ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          健診種別が設定されていません
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>健診種別</TableHead>
              <TableHead className="text-right">料金</TableHead>
              <TableHead>備考</TableHead>
              <TableHead className="w-[80px]">有効</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.map((item) => {
              const typeName = checkupTypes.find(t => t.id === item.checkupTypeId)?.name || item.checkupTypeId;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{typeName}</TableCell>
                  <TableCell className="text-right">¥{item.price.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.notes || '-'}</TableCell>
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
              );
            })}
          </TableBody>
        </Table>
      )}

      {addingNew && (
        <div className="border rounded-lg p-4 space-y-3">
          {availableTypes.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground text-center py-2">
                追加可能な健診種別がありません。先に「管理＞健診種別」で種別を登録してください。
              </p>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setAddingNew(false)}>閉じる</Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">検査種別 *</Label>
                  <Select value={newForm.checkupTypeId} onValueChange={(v) => setNewForm({ ...newForm, checkupTypeId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">料金 *</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={newForm.price}
                    onChange={(e) => setNewForm({ ...newForm, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">備考</Label>
                  <Input
                    placeholder="備考"
                    value={newForm.notes}
                    onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddingNew(false)}>キャンセル</Button>
                <Button size="sm" onClick={handleAdd}>追加</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
