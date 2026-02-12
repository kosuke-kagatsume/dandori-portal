'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// 型定義
interface LegalUpdate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  effectiveDate: string;
  relatedLaws: string | null;
  affectedAreas: string[];
  priority: string;
  isPublished: boolean;
  publishedAt: string | null;
  referenceUrl: string | null;
  createdAt: string;
  _count?: {
    tenant_legal_statuses: number;
  };
}

// カテゴリー定義
const CATEGORIES = [
  { value: 'tax', label: '税務' },
  { value: 'labor', label: '労務' },
  { value: 'social_insurance', label: '社会保険' },
  { value: 'payroll', label: '給与計算' },
  { value: 'attendance', label: '勤怠管理' },
  { value: 'safety', label: '安全衛生' },
  { value: 'other', label: 'その他' },
];

const PRIORITIES = [
  { value: 'high', label: '高', color: 'destructive' },
  { value: 'medium', label: '中', color: 'secondary' },
  { value: 'low', label: '低', color: 'outline' },
];

// 影響範囲のオプション
const AFFECTED_AREAS = [
  '人事管理',
  '雇用管理',
  '給与計算',
  '勤怠管理',
  '社会保険',
  '税務申告',
  '就業規則',
  '安全衛生',
];

export function LegalUpdatesManagementTab() {
  const [legalUpdates, setLegalUpdates] = useState<LegalUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLegalUpdate, setSelectedLegalUpdate] = useState<LegalUpdate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'labor',
    effectiveDate: '',
    relatedLaws: '',
    affectedAreas: [] as string[],
    priority: 'medium',
    isPublished: false,
    referenceUrl: '',
  });

  // フィルター状態
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');

  // データ取得
  const fetchLegalUpdates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (publishedFilter !== 'all') params.append('isPublished', publishedFilter);

      const response = await fetch(`/api/dw-admin/legal-updates?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLegalUpdates(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching legal updates:', error);
      toast.error('法令情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, publishedFilter]);

  useEffect(() => {
    fetchLegalUpdates();
  }, [fetchLegalUpdates]);

  // フォームリセット
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'labor',
      effectiveDate: '',
      relatedLaws: '',
      affectedAreas: [],
      priority: 'medium',
      isPublished: false,
      referenceUrl: '',
    });
    setEditingId(null);
  };

  // ダイアログを開く（新規作成）
  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // ダイアログを開く（編集）
  const handleOpenEdit = (legalUpdate: LegalUpdate) => {
    setFormData({
      title: legalUpdate.title,
      description: legalUpdate.description || '',
      category: legalUpdate.category,
      effectiveDate: legalUpdate.effectiveDate.split('T')[0],
      relatedLaws: legalUpdate.relatedLaws || '',
      affectedAreas: legalUpdate.affectedAreas || [],
      priority: legalUpdate.priority,
      isPublished: legalUpdate.isPublished,
      referenceUrl: legalUpdate.referenceUrl || '',
    });
    setEditingId(legalUpdate.id);
    setIsDialogOpen(true);
  };

  // 詳細ダイアログを開く
  const handleOpenDetail = (legalUpdate: LegalUpdate) => {
    setSelectedLegalUpdate(legalUpdate);
    setIsDetailDialogOpen(true);
  };

  // 保存処理
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }
    if (!formData.effectiveDate) {
      toast.error('施行日を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId
        ? `/api/dw-admin/legal-updates/${editingId}`
        : '/api/dw-admin/legal-updates';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingId ? '法令情報を更新しました' : '法令情報を作成しました');
        setIsDialogOpen(false);
        resetForm();
        fetchLegalUpdates();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving legal update:', error);
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    if (!confirm('この法令情報を削除しますか？')) return;

    try {
      const response = await fetch(`/api/dw-admin/legal-updates/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('法令情報を削除しました');
        fetchLegalUpdates();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting legal update:', error);
      toast.error('削除に失敗しました');
    }
  };

  // 影響範囲の切り替え
  const toggleAffectedArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      affectedAreas: prev.affectedAreas.includes(area)
        ? prev.affectedAreas.filter((a) => a !== area)
        : [...prev.affectedAreas, area],
    }));
  };

  // カテゴリーラベル取得
  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  // 優先度バッジ取得
  const getPriorityBadge = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    return (
      <Badge variant={p?.color as 'destructive' | 'secondary' | 'outline'}>
        {p?.label || priority}
      </Badge>
    );
  };

  // 統計計算
  const stats = {
    total: legalUpdates.length,
    published: legalUpdates.filter((l) => l.isPublished).length,
    draft: legalUpdates.filter((l) => !l.isPublished).length,
    highPriority: legalUpdates.filter((l) => l.priority === 'high').length,
  };

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">総件数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">公開済み</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">下書き</p>
              <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">重要度高</p>
              <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* フィルターとアクション */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>法令・制度更新一覧</CardTitle>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </CardHeader>
        <CardContent>
          {/* フィルター */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label>カテゴリ:</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>公開状態:</Label>
              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="true">公開済み</SelectItem>
                  <SelectItem value="false">下書き</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* テーブル */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : legalUpdates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              法令情報がありません
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>施行日</TableHead>
                    <TableHead>優先度</TableHead>
                    <TableHead>公開状態</TableHead>
                    <TableHead>対応状況</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {legalUpdates.map((legalUpdate) => (
                    <TableRow key={legalUpdate.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {legalUpdate.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(legalUpdate.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(legalUpdate.effectiveDate).toLocaleDateString('ja-JP')}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(legalUpdate.priority)}</TableCell>
                      <TableCell>
                        {legalUpdate.isPublished ? (
                          <Badge className="bg-green-100 text-green-800">公開中</Badge>
                        ) : (
                          <Badge variant="secondary">下書き</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {legalUpdate._count?.tenant_legal_statuses || 0}社対応中
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(legalUpdate)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(legalUpdate)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(legalUpdate.id)}
                            disabled={legalUpdate.isPublished && (legalUpdate._count?.tenant_legal_statuses || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 作成・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '法令情報を編集' : '法令情報を作成'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例: 障害者法定雇用率のさらなる引き上げ（2.7%）"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">施行日 *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="法改正の詳細説明..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relatedLaws">関連法令</Label>
              <Input
                id="relatedLaws"
                value={formData.relatedLaws}
                onChange={(e) => setFormData({ ...formData, relatedLaws: e.target.value })}
                placeholder="例: 障害者の雇用の促進等に関する法律"
              />
            </div>

            <div className="space-y-2">
              <Label>影響範囲</Label>
              <div className="flex flex-wrap gap-2">
                {AFFECTED_AREAS.map((area) => (
                  <Badge
                    key={area}
                    variant={formData.affectedAreas.includes(area) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAffectedArea(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">優先度</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceUrl">参考URL</Label>
                <Input
                  id="referenceUrl"
                  type="url"
                  value={formData.referenceUrl}
                  onChange={(e) => setFormData({ ...formData, referenceUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">公開する（全テナントに配信）</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 詳細ダイアログ */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>法令詳細</DialogTitle>
          </DialogHeader>
          {selectedLegalUpdate && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">タイトル</Label>
                <p className="text-lg font-medium">{selectedLegalUpdate.title}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">カテゴリ</Label>
                  <p>
                    <Badge variant="outline">
                      {getCategoryLabel(selectedLegalUpdate.category)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">施行日</Label>
                  <p>{new Date(selectedLegalUpdate.effectiveDate).toLocaleDateString('ja-JP')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">優先度</Label>
                  <p>{getPriorityBadge(selectedLegalUpdate.priority)}</p>
                </div>
              </div>

              {selectedLegalUpdate.description && (
                <div>
                  <Label className="text-muted-foreground">説明</Label>
                  <p className="whitespace-pre-wrap">{selectedLegalUpdate.description}</p>
                </div>
              )}

              {selectedLegalUpdate.relatedLaws && (
                <div>
                  <Label className="text-muted-foreground">関連法令</Label>
                  <p>{selectedLegalUpdate.relatedLaws}</p>
                </div>
              )}

              {selectedLegalUpdate.affectedAreas.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">影響範囲</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLegalUpdate.affectedAreas.map((area) => (
                      <Badge key={area} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLegalUpdate.referenceUrl && (
                <div>
                  <Label className="text-muted-foreground">参考URL</Label>
                  <a
                    href={selectedLegalUpdate.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    {selectedLegalUpdate.referenceUrl}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">公開状態</Label>
                  <p>
                    {selectedLegalUpdate.isPublished ? (
                      <Badge className="bg-green-100 text-green-800">公開中</Badge>
                    ) : (
                      <Badge variant="secondary">下書き</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">テナント対応状況</Label>
                  <p>{selectedLegalUpdate._count?.tenant_legal_statuses || 0}社対応中</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              閉じる
            </Button>
            {selectedLegalUpdate && (
              <Button onClick={() => {
                setIsDetailDialogOpen(false);
                handleOpenEdit(selectedLegalUpdate);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                編集
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
