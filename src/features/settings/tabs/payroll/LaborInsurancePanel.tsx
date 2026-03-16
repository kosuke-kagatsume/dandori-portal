'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Edit, HardHat, Building2 } from 'lucide-react';

// 労災保険料率用業種
const WORKERS_COMP_INDUSTRIES = [
  { value: 'other_services', label: 'その他の各種事業', rate: 3.0 },
  { value: 'manufacturing', label: '製造業', rate: 4.5 },
  { value: 'construction', label: '建設事業', rate: 9.5 },
  { value: 'forestry', label: '林業', rate: 60.0 },
  { value: 'fishing', label: '漁業', rate: 18.0 },
  { value: 'mining', label: '鉱業', rate: 26.0 },
  { value: 'electricity', label: '電気・ガス・水道業', rate: 3.0 },
  { value: 'transport', label: '運輸業', rate: 4.0 },
  { value: 'wholesale_retail', label: '卸売業・小売業', rate: 3.0 },
  { value: 'finance_insurance', label: '金融・保険業', rate: 2.5 },
  { value: 'real_estate', label: '不動産業', rate: 3.0 },
  { value: 'it_services', label: '情報処理サービス業', rate: 3.0 },
  { value: 'metal_manufacturing', label: '金属材料品製造業（鋳物業を除く。）', rate: 5.0 },
  { value: 'food_manufacturing', label: '食料品製造業', rate: 6.0 },
];

// 雇用保険料率用業種（デフォルト値）
const EMPLOYMENT_INS_INDUSTRIES = [
  { value: 'general', label: '一般事業所', employeeRate: 6.0, employerRate: 9.5 },
  { value: 'agriculture', label: '農林水産・清酒製造', employeeRate: 7.0, employerRate: 10.5 },
  { value: 'construction', label: '建設事業', employeeRate: 7.0, employerRate: 11.5 },
];

interface WorkersCompInsurance {
  jurisdiction: string;
  laborInsuranceNumber: string;
  businessDescription: string;
  industryType: string;
  meritApplicable: boolean;
  meritRate: number;
}

interface EmploymentInsurance {
  jurisdiction: string;
  officeNumber: string;
  industryType: string;
  customEmployeeRate: number | null;
  customEmployerRate: number | null;
}

interface OfficeOption {
  id: string;
  name: string;
}

const defaultWorkersComp: WorkersCompInsurance = {
  jurisdiction: '',
  laborInsuranceNumber: '',
  businessDescription: '',
  industryType: 'other_services',
  meritApplicable: false,
  meritRate: 0,
};

const defaultEmployment: EmploymentInsurance = {
  jurisdiction: '',
  officeNumber: '',
  industryType: 'general',
  customEmployeeRate: null,
  customEmployerRate: null,
};

export function LaborInsurancePanel() {
  const [workersComp, setWorkersComp] = useState<WorkersCompInsurance>(defaultWorkersComp);
  const [employment, setEmployment] = useState<EmploymentInsurance>(defaultEmployment);

  // 事業所セレクタ
  const [officeOptions, setOfficeOptions] = useState<OfficeOption[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');

  // 労災保険ダイアログ
  const [wcDialogOpen, setWcDialogOpen] = useState(false);
  const [wcForm, setWcForm] = useState<WorkersCompInsurance>(defaultWorkersComp);

  // 雇用保険ダイアログ
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [empForm, setEmpForm] = useState<EmploymentInsurance>(defaultEmployment);

  const fetchOffices = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/payroll/offices');
      const json = await res.json();
      if (json.success && json.data?.offices) {
        setOfficeOptions(json.data.offices.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
      }
    } catch {
      // フォールバック
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const openWcDialog = () => {
    setWcForm({ ...workersComp });
    setWcDialogOpen(true);
  };

  const saveWc = () => {
    setWorkersComp({ ...wcForm });
    setWcDialogOpen(false);
  };

  const openEmpDialog = () => {
    setEmpForm({ ...employment });
    setEmpDialogOpen(true);
  };

  const saveEmp = () => {
    setEmployment({ ...empForm });
    setEmpDialogOpen(false);
  };

  const wcIndustry = WORKERS_COMP_INDUSTRIES.find(i => i.value === workersComp.industryType);
  const empIndustry = EMPLOYMENT_INS_INDUSTRIES.find(i => i.value === employment.industryType);

  // 雇用保険料率: カスタム値があればそちらを使用
  const empEmployeeRate = employment.customEmployeeRate ?? empIndustry?.employeeRate ?? 0;
  const empEmployerRate = employment.customEmployerRate ?? empIndustry?.employerRate ?? 0;

  return (
    <div className="space-y-6">
      {/* 事業所セレクタ */}
      {officeOptions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <div>
                <CardTitle className="text-base">事業所選択</CardTitle>
                <CardDescription>労働保険情報を設定する事業所を選択してください</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="事業所を選択" />
              </SelectTrigger>
              <SelectContent>
                {officeOptions.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* 労災保険 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5" />
              <div>
                <CardTitle className="text-base">労災保険情報</CardTitle>
                <CardDescription>労災保険の管轄・番号・業種を設定します</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openWcDialog}>
              <Edit className="w-4 h-4 mr-2" />編集
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-[200px]">管轄</TableCell>
                <TableCell>{workersComp.jurisdiction || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">労働保険番号</TableCell>
                <TableCell>{workersComp.laborInsuranceNumber || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">具体的な業務又は作業の内容</TableCell>
                <TableCell>{workersComp.businessDescription || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">労災保険業種</TableCell>
                <TableCell>{wcIndustry?.label || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* 労災保険料率 */}
          {wcIndustry && (
            <div className="space-y-2">
              <p className="text-sm font-medium">労災保険料率</p>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-[200px]">/1,000</TableCell>
                    <TableCell>{wcIndustry.label}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">事業主</TableCell>
                    <TableCell>{workersComp.meritApplicable ? workersComp.meritRate : wcIndustry.rate}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 雇用保険 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">雇用保険情報</CardTitle>
              <CardDescription>雇用保険の管轄・番号・業種を設定します</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={openEmpDialog}>
              <Edit className="w-4 h-4 mr-2" />編集
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-[200px]">管轄</TableCell>
                <TableCell>{employment.jurisdiction || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">事業所番号</TableCell>
                <TableCell>{employment.officeNumber || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">雇用保険料率用業種</TableCell>
                <TableCell>{empIndustry?.label || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* 雇用保険料率（編集可能） */}
          <div className="space-y-2">
            <p className="text-sm font-medium">雇用保険料率</p>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-[200px]">/1,000</TableCell>
                  <TableCell>{empIndustry?.label || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">従業員</TableCell>
                  <TableCell>{empEmployeeRate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">事業主</TableCell>
                  <TableCell>{empEmployerRate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">合計</TableCell>
                  <TableCell>{Math.round((empEmployeeRate + empEmployerRate) * 10) / 10}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 労災保険ダイアログ */}
      <Dialog open={wcDialogOpen} onOpenChange={setWcDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>労災保険</DialogTitle>
            <DialogDescription>労災保険の管轄・番号・業種を設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>管轄</Label>
                <Input value={wcForm.jurisdiction} onChange={e => setWcForm(f => ({ ...f, jurisdiction: e.target.value }))} placeholder="新宿" />
              </div>
              <div className="space-y-2">
                <Label>労働基準監督署</Label>
                <p className="text-xs text-muted-foreground mt-2">管轄の労働基準監督署</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>労働保険番号</Label>
              <div className="flex items-center gap-1">
                <Input placeholder="12(2桁)" className="w-16" maxLength={2}
                  value={wcForm.laborInsuranceNumber.split('-')[0] || ''}
                  onChange={e => {
                    const parts = wcForm.laborInsuranceNumber.split('-');
                    parts[0] = e.target.value;
                    setWcForm(f => ({ ...f, laborInsuranceNumber: parts.join('-') }));
                  }}
                />
                <span>-</span>
                <Input placeholder="1(1桁)" className="w-12" maxLength={1}
                  value={wcForm.laborInsuranceNumber.split('-')[1] || ''}
                  onChange={e => {
                    const parts = wcForm.laborInsuranceNumber.split('-');
                    parts[1] = e.target.value;
                    setWcForm(f => ({ ...f, laborInsuranceNumber: parts.join('-') }));
                  }}
                />
                <span>-</span>
                <Input placeholder="12(2桁)" className="w-16" maxLength={2}
                  value={wcForm.laborInsuranceNumber.split('-')[2] || ''}
                  onChange={e => {
                    const parts = wcForm.laborInsuranceNumber.split('-');
                    parts[2] = e.target.value;
                    setWcForm(f => ({ ...f, laborInsuranceNumber: parts.join('-') }));
                  }}
                />
                <span>-</span>
                <Input placeholder="123456(6桁)" className="w-24" maxLength={6}
                  value={wcForm.laborInsuranceNumber.split('-')[3] || ''}
                  onChange={e => {
                    const parts = wcForm.laborInsuranceNumber.split('-');
                    parts[3] = e.target.value;
                    setWcForm(f => ({ ...f, laborInsuranceNumber: parts.join('-') }));
                  }}
                />
                <span>-</span>
                <Input placeholder="123(3桁)" className="w-16" maxLength={3}
                  value={wcForm.laborInsuranceNumber.split('-')[4] || ''}
                  onChange={e => {
                    const parts = wcForm.laborInsuranceNumber.split('-');
                    parts[4] = e.target.value;
                    setWcForm(f => ({ ...f, laborInsuranceNumber: parts.join('-') }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>具体的な業務又は作業の内容</Label>
              <Input value={wcForm.businessDescription} onChange={e => setWcForm(f => ({ ...f, businessDescription: e.target.value }))} placeholder="例）情報処理サービス業" />
            </div>
            <div className="space-y-2">
              <Label>労災保険料率用業種</Label>
              <Select value={wcForm.industryType} onValueChange={v => setWcForm(f => ({ ...f, industryType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORKERS_COMP_INDUSTRIES.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label>メリット制（/1,000）</Label>
              <Switch checked={wcForm.meritApplicable} onCheckedChange={v => setWcForm(f => ({ ...f, meritApplicable: v }))} />
              <span className="text-sm">適用あり</span>
              {wcForm.meritApplicable && (
                <Input type="number" step={0.1} value={wcForm.meritRate} onChange={e => setWcForm(f => ({ ...f, meritRate: parseFloat(e.target.value) || 0 }))} className="w-24" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWcDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveWc}>更新する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 雇用保険ダイアログ */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>雇用保険</DialogTitle>
            <DialogDescription>雇用保険の管轄・事業所番号・業種・料率を設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>管轄</Label>
                <Input value={empForm.jurisdiction} onChange={e => setEmpForm(f => ({ ...f, jurisdiction: e.target.value }))} placeholder="港区" />
              </div>
              <div className="space-y-2">
                <Label>ハローワーク（公共職業安定所）</Label>
                <p className="text-xs text-muted-foreground mt-2">管轄のハローワーク</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>事業所番号</Label>
              <div className="flex items-center gap-1">
                <Input placeholder="1234(4桁)" className="w-20" maxLength={4}
                  value={empForm.officeNumber.split('-')[0] || ''}
                  onChange={e => {
                    const parts = empForm.officeNumber.split('-');
                    parts[0] = e.target.value;
                    setEmpForm(f => ({ ...f, officeNumber: parts.join('-') }));
                  }}
                />
                <span>-</span>
                <Input placeholder="123456(6桁)" className="w-24" maxLength={6}
                  value={empForm.officeNumber.split('-')[1] || ''}
                  onChange={e => {
                    const parts = empForm.officeNumber.split('-');
                    parts[1] = e.target.value;
                    setEmpForm(f => ({ ...f, officeNumber: parts.join('-') }));
                  }}
                />
                <span>-</span>
                <Input placeholder="1(1桁)" className="w-12" maxLength={1}
                  value={empForm.officeNumber.split('-')[2] || ''}
                  onChange={e => {
                    const parts = empForm.officeNumber.split('-');
                    parts[2] = e.target.value;
                    setEmpForm(f => ({ ...f, officeNumber: parts.join('-') }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>雇用保険料率用業種</Label>
              <Select value={empForm.industryType} onValueChange={v => {
                const industry = EMPLOYMENT_INS_INDUSTRIES.find(i => i.value === v);
                setEmpForm(f => ({
                  ...f,
                  industryType: v,
                  customEmployeeRate: industry?.employeeRate ?? f.customEmployeeRate,
                  customEmployerRate: industry?.employerRate ?? f.customEmployerRate,
                }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_INS_INDUSTRIES.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>雇用保険料率（/1,000）</Label>
              <p className="text-xs text-muted-foreground">小数点第1位まで入力可能</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">従業員負担</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={empForm.customEmployeeRate ?? EMPLOYMENT_INS_INDUSTRIES.find(i => i.value === empForm.industryType)?.employeeRate ?? 0}
                    onChange={e => setEmpForm(f => ({ ...f, customEmployeeRate: parseFloat(e.target.value) || 0 }))}
                    className="w-24"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">事業主負担</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={empForm.customEmployerRate ?? EMPLOYMENT_INS_INDUSTRIES.find(i => i.value === empForm.industryType)?.employerRate ?? 0}
                    onChange={e => setEmpForm(f => ({ ...f, customEmployerRate: parseFloat(e.target.value) || 0 }))}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveEmp}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
