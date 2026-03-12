'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Plus, Trash2, Shield } from 'lucide-react';

type HealthInsuranceType = 'kyokai' | 'kumiai' | 'kokuho';

interface InsuranceRate {
  id: string;
  effectiveMonth: string; // YYYY/MM
  healthEmployeeRate: number;
  healthEmployerRate: number;
  nursingEmployeeRate: number;
  nursingEmployerRate: number;
}

interface HealthInsurance {
  type: HealthInsuranceType;
  jurisdiction: string; // 管轄（都道府県）
  officeNumber: string; // 事業所整理記号
  unionName: string; // 組合名（組合の場合）
  rates: InsuranceRate[];
}

interface PensionInsurance {
  jurisdiction: string; // 管轄（年金事務所）
  officeNumber: string; // 事業所番号
  officeCode: string; // 事務所整理記号（2桁-4桁）
}

interface PensionFund {
  fundName: string;
  fundNumber: string;
  fundOfficeNumber: string;
  rates: { id: string; effectiveMonth: string; salaryEmployee: number; salaryEmployer: number; bonusEmployee: number; bonusEmployer: number }[];
}

const HEALTH_TYPE_LABELS: Record<HealthInsuranceType, string> = {
  kyokai: '協会管掌事業所',
  kumiai: '組合管掌事業所',
  kokuho: '国民健康保険組合',
};

const defaultHealthInsurance: HealthInsurance = {
  type: 'kyokai',
  jurisdiction: '',
  officeNumber: '',
  unionName: '',
  rates: [],
};

const defaultPension: PensionInsurance = {
  jurisdiction: '',
  officeNumber: '',
  officeCode: '',
};

const defaultPensionFund: PensionFund = {
  fundName: '',
  fundNumber: '',
  fundOfficeNumber: '',
  rates: [],
};

export function SocialInsurancePanel() {
  const [health, setHealth] = useState<HealthInsurance>(defaultHealthInsurance);
  const [pension, setPension] = useState<PensionInsurance>(defaultPension);
  const [pensionFund, setPensionFund] = useState<PensionFund>(defaultPensionFund);

  // 健康保険ダイアログ
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [healthForm, setHealthForm] = useState(defaultHealthInsurance);

  // 厚生年金ダイアログ
  const [pensionDialogOpen, setPensionDialogOpen] = useState(false);
  const [pensionForm, setPensionForm] = useState(defaultPension);

  // 厚生年金基金ダイアログ
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [fundForm, setFundForm] = useState(defaultPensionFund);

  // 保険料率追加ダイアログ
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rateForm, setRateForm] = useState({
    effectiveMonth: '',
    healthEmployeeRate: 0,
    healthEmployerRate: 0,
    nursingEmployeeRate: 0,
    nursingEmployerRate: 0,
  });

  const openHealthDialog = () => {
    setHealthForm({ ...health });
    setHealthDialogOpen(true);
  };

  const saveHealth = () => {
    setHealth({ ...healthForm });
    setHealthDialogOpen(false);
  };

  const openPensionDialog = () => {
    setPensionForm({ ...pension });
    setPensionDialogOpen(true);
  };

  const savePension = () => {
    setPension({ ...pensionForm });
    setPensionDialogOpen(false);
  };

  const openFundDialog = () => {
    setFundForm({ ...pensionFund });
    setFundDialogOpen(true);
  };

  const saveFund = () => {
    setPensionFund({ ...fundForm });
    setFundDialogOpen(false);
  };

  const addRate = () => {
    if (!rateForm.effectiveMonth) return;
    setHealth(prev => ({
      ...prev,
      rates: [...prev.rates, { id: crypto.randomUUID(), ...rateForm }],
    }));
    setRateDialogOpen(false);
    setRateForm({ effectiveMonth: '', healthEmployeeRate: 0, healthEmployerRate: 0, nursingEmployeeRate: 0, nursingEmployerRate: 0 });
  };

  const removeRate = (id: string) => {
    setHealth(prev => ({
      ...prev,
      rates: prev.rates.filter(r => r.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* 健康保険 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <div>
                <CardTitle className="text-base">健康保険</CardTitle>
                <CardDescription>健康保険の種類と保険料率を設定します</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openHealthDialog}>
                <Edit className="w-4 h-4 mr-2" />編集
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!health.type ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              健康保険情報がありません。編集ボタンから設定してください。
            </p>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-[180px]">健康保険の種類</TableCell>
                    <TableCell>{HEALTH_TYPE_LABELS[health.type]}</TableCell>
                  </TableRow>
                  {health.type === 'kumiai' && (
                    <TableRow>
                      <TableCell className="font-medium">組合名</TableCell>
                      <TableCell>{health.unionName || '-'}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">管轄</TableCell>
                    <TableCell>{health.jurisdiction || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">事業所整理記号</TableCell>
                    <TableCell>{health.officeNumber || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {health.type !== 'kokuho' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">保険料率</p>
                    <Button variant="outline" size="sm" onClick={() => setRateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />保険料率を追加
                    </Button>
                  </div>
                  {health.rates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">保険料率が設定されていません</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>適用開始月</TableHead>
                          <TableHead className="text-center" colSpan={2}>被保険者負担</TableHead>
                          <TableHead className="text-center" colSpan={2}>事業主負担</TableHead>
                          <TableHead className="w-[50px]" />
                        </TableRow>
                        <TableRow>
                          <TableHead />
                          <TableHead className="text-center text-xs">健康保険</TableHead>
                          <TableHead className="text-center text-xs">介護保険</TableHead>
                          <TableHead className="text-center text-xs">健康保険</TableHead>
                          <TableHead className="text-center text-xs">介護保険</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {health.rates.sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth)).map(r => (
                          <TableRow key={r.id}>
                            <TableCell>{r.effectiveMonth}</TableCell>
                            <TableCell className="text-center">{r.healthEmployeeRate}</TableCell>
                            <TableCell className="text-center">{r.nursingEmployeeRate}</TableCell>
                            <TableCell className="text-center">{r.healthEmployerRate}</TableCell>
                            <TableCell className="text-center">{r.nursingEmployerRate}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeRate(r.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <p className="text-xs text-muted-foreground">※ /1,000 単位</p>
                </div>
              )}
              {health.type === 'kokuho' && (
                <p className="text-sm text-muted-foreground">
                  国民健康保険組合の場合、従業員情報画面で従業員ごとに固定の金額を入力できます。
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 厚生年金保険 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">厚生年金保険</CardTitle>
              <CardDescription>厚生年金保険の事業所情報を設定します</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={openPensionDialog}>
              <Edit className="w-4 h-4 mr-2" />編集
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-[180px]">管轄</TableCell>
                <TableCell>{pension.jurisdiction || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">事業所番号</TableCell>
                <TableCell>{pension.officeNumber || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">事務所整理記号</TableCell>
                <TableCell>{pension.officeCode || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 厚生年金基金 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">厚生年金基金</CardTitle>
              <CardDescription>厚生年金基金の設定を行います</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={openFundDialog}>
              <Edit className="w-4 h-4 mr-2" />編集
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!pensionFund.fundName ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              厚生年金基金情報がありません。<br />編集ボタンから厚生年金基金情報を登録してください。
            </p>
          ) : (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-[180px]">基金名</TableCell>
                  <TableCell>{pensionFund.fundName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">基金番号</TableCell>
                  <TableCell>{pensionFund.fundNumber || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">基金の事業所番号</TableCell>
                  <TableCell>{pensionFund.fundOfficeNumber || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 健康保険編集ダイアログ */}
      <Dialog open={healthDialogOpen} onOpenChange={setHealthDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>健康保険</DialogTitle>
            <DialogDescription>健康保険の種類と事業所情報を設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>健康保険の種類</Label>
              <Select value={healthForm.type} onValueChange={(v: HealthInsuranceType) => setHealthForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kyokai">協会管掌事業所</SelectItem>
                  <SelectItem value="kumiai">組合管掌事業所</SelectItem>
                  <SelectItem value="kokuho">国民健康保険組合</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {healthForm.type === 'kumiai' && (
              <div className="space-y-2">
                <Label>組合名</Label>
                <Input value={healthForm.unionName} onChange={e => setHealthForm(f => ({ ...f, unionName: e.target.value }))} />
              </div>
            )}
            <div className="space-y-2">
              <Label>管轄</Label>
              <Input value={healthForm.jurisdiction} onChange={e => setHealthForm(f => ({ ...f, jurisdiction: e.target.value }))} placeholder="東京都" />
            </div>
            <div className="space-y-2">
              <Label>事業所整理記号</Label>
              <Input value={healthForm.officeNumber} onChange={e => setHealthForm(f => ({ ...f, officeNumber: e.target.value }))} placeholder="12345678" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHealthDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveHealth}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 保険料率追加ダイアログ */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>保険料率の追加</DialogTitle>
            <DialogDescription>適用開始月と料率（/1,000）を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>適用開始月</Label>
              <Input type="month" value={rateForm.effectiveMonth} onChange={e => setRateForm(f => ({ ...f, effectiveMonth: e.target.value }))} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>/1,000</TableHead>
                  <TableHead className="text-center">被保険者負担</TableHead>
                  <TableHead className="text-center">事業主負担</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">健康保険</TableCell>
                  <TableCell><Input type="number" step={0.01} value={rateForm.healthEmployeeRate} onChange={e => setRateForm(f => ({ ...f, healthEmployeeRate: parseFloat(e.target.value) || 0 }))} className="h-8" /></TableCell>
                  <TableCell><Input type="number" step={0.01} value={rateForm.healthEmployerRate} onChange={e => setRateForm(f => ({ ...f, healthEmployerRate: parseFloat(e.target.value) || 0 }))} className="h-8" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">介護保険</TableCell>
                  <TableCell><Input type="number" step={0.01} value={rateForm.nursingEmployeeRate} onChange={e => setRateForm(f => ({ ...f, nursingEmployeeRate: parseFloat(e.target.value) || 0 }))} className="h-8" /></TableCell>
                  <TableCell><Input type="number" step={0.01} value={rateForm.nursingEmployerRate} onChange={e => setRateForm(f => ({ ...f, nursingEmployerRate: parseFloat(e.target.value) || 0 }))} className="h-8" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>キャンセル</Button>
            <Button onClick={addRate} disabled={!rateForm.effectiveMonth}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 厚生年金編集ダイアログ */}
      <Dialog open={pensionDialogOpen} onOpenChange={setPensionDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>厚生年金保険</DialogTitle>
            <DialogDescription>厚生年金保険の事業所情報を設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>管轄</Label>
                <Input value={pensionForm.jurisdiction} onChange={e => setPensionForm(f => ({ ...f, jurisdiction: e.target.value }))} placeholder="田町" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">年金事務所</Label>
                <p className="text-xs text-muted-foreground mt-1">管轄の年金事務所</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>事業所番号</Label>
              <Input value={pensionForm.officeNumber} onChange={e => setPensionForm(f => ({ ...f, officeNumber: e.target.value }))} placeholder="12345" />
            </div>
            <div className="space-y-2">
              <Label>事務所整理記号</Label>
              <Input value={pensionForm.officeCode} onChange={e => setPensionForm(f => ({ ...f, officeCode: e.target.value }))} placeholder="12-1234" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPensionDialogOpen(false)}>キャンセル</Button>
            <Button onClick={savePension}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 厚生年金基金編集ダイアログ */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>厚生年金基金</DialogTitle>
            <DialogDescription>厚生年金基金の情報を設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>基金名</Label>
              <Input value={fundForm.fundName} onChange={e => setFundForm(f => ({ ...f, fundName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>基金番号</Label>
              <Input value={fundForm.fundNumber} onChange={e => setFundForm(f => ({ ...f, fundNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>基金の事業所番号</Label>
              <Input value={fundForm.fundOfficeNumber} onChange={e => setFundForm(f => ({ ...f, fundOfficeNumber: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveFund}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
