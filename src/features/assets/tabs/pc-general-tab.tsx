'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Download, Laptop, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { type PCAssetFromAPI } from '@/hooks/use-pc-assets-api';
import { type GeneralAssetFromAPI } from '@/hooks/use-general-assets-api';
import {
  formatDate, calculateDaysRemaining,
  getStatusBadge, getOwnershipBadge, getCategoryLabel,
} from '@/lib/assets/formatters';

interface Props {
  pcAssets: PCAssetFromAPI[];
  generalAssets: GeneralAssetFromAPI[];
  mounted: boolean;
  onDeletePC: (id: string, assetNumber: string) => void;
  onDeleteGeneralAsset: (id: string, name: string) => void;
  onAddPC: () => void;
  onAddGeneralAsset: () => void;
}

export function PCGeneralTab({
  pcAssets, generalAssets, mounted,
  onDeletePC, onDeleteGeneralAsset, onAddPC, onAddGeneralAsset,
}: Props) {
  const handleExportPCsCSV = () => {
    const headers = ['資産番号', 'メーカー', '型番', 'シリアル番号', 'CPU', 'メモリ', 'ストレージ', 'OS', '所有形態', 'ステータス', '保証期限'];
    const rows = pcAssets.map(p => [
      p.assetNumber, p.manufacturer, p.model, p.serialNumber || '',
      p.cpu || '', p.memory || '', p.storage || '', p.os || '',
      p.ownershipType, p.status, p.warrantyExpiration || '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pc_assets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`CSV出力完了: ${pcAssets.length}件`);
  };

  return (
    <div className="space-y-4">
      {/* PC一覧 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                PC一覧
              </CardTitle>
              <CardDescription>登録されている全PCの管理（{pcAssets.length}台）</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPCsCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV出力
              </Button>
              <Button onClick={onAddPC}>
                <Plus className="mr-2 h-4 w-4" />
                PCを登録
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資産番号</TableHead>
                <TableHead>メーカー・型番</TableHead>
                <TableHead>スペック</TableHead>
                <TableHead>割当先</TableHead>
                <TableHead>所有形態</TableHead>
                <TableHead>保証期限</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pcAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    PCが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                pcAssets.map((pc) => (
                  <TableRow key={pc.id}>
                    <TableCell className="font-medium">{pc.assetNumber}</TableCell>
                    <TableCell>
                      {pc.manufacturer} {pc.model}
                      <div className="text-xs text-muted-foreground">S/N: {pc.serialNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{pc.cpu}</div>
                      <div className="text-xs text-muted-foreground">{pc.memory} / {pc.storage}</div>
                    </TableCell>
                    <TableCell>
                      {pc.assignedUserName ? (
                        <div>
                          {pc.assignedUserName}
                          {pc.assignedDate && (
                            <div className="text-xs text-muted-foreground">{formatDate(pc.assignedDate)}～</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">未割当</span>
                      )}
                    </TableCell>
                    <TableCell>{getOwnershipBadge(pc.ownershipType)}</TableCell>
                    <TableCell>
                      {pc.warrantyExpiration ? (
                        <>
                          <div className="text-sm">{formatDate(pc.warrantyExpiration)}</div>
                          {mounted && (
                            <div className="text-xs text-muted-foreground">
                              {calculateDaysRemaining(pc.warrantyExpiration)}日後
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(pc.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onDeletePC(pc.id, pc.assetNumber)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* その他資産一覧 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                その他資産一覧
              </CardTitle>
              <CardDescription>モニター、プリンター、スマートフォンなど（{generalAssets.length}件）</CardDescription>
            </div>
            <Button onClick={onAddGeneralAsset}>
              <Plus className="mr-2 h-4 w-4" />
              備品を登録
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資産番号</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>名称・型番</TableHead>
                <TableHead>割当先</TableHead>
                <TableHead>所有形態</TableHead>
                <TableHead>保証期限</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generalAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    その他資産が見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                generalAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(asset.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      {asset.name}
                      {asset.manufacturer && asset.model && (
                        <div className="text-xs text-muted-foreground">
                          {asset.manufacturer} {asset.model}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {asset.assignedUserName ? (
                        <div>
                          {asset.assignedUserName}
                          {asset.assignedDate && (
                            <div className="text-xs text-muted-foreground">{formatDate(asset.assignedDate)}～</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">未割当</span>
                      )}
                    </TableCell>
                    <TableCell>{getOwnershipBadge(asset.ownershipType)}</TableCell>
                    <TableCell>
                      {asset.warrantyExpiration ? (
                        <>
                          <div className="text-sm">{formatDate(asset.warrantyExpiration)}</div>
                          {mounted && (
                            <div className="text-xs text-muted-foreground">
                              {calculateDaysRemaining(asset.warrantyExpiration)}日後
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onDeleteGeneralAsset(asset.id, asset.name)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
