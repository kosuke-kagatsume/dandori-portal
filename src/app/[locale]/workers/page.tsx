'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

interface Worker {
  id: string
  name: string
  furigana: string
  employeeCode: string
  email: string
  phone: string
  role: string
  department: string
  skills: string[]
  certifications: string[]
  status: 'active' | 'inactive' | 'on_leave'
  hireDate: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  bloodType: string
  notes: string
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [formData, setFormData] = useState<Partial<Worker>>({
    skills: [],
    certifications: [],
    status: 'active'
  })

  // Mock data
  useEffect(() => {
    setWorkers([
      {
        id: '1',
        name: '山田太郎',
        furigana: 'ヤマダタロウ',
        employeeCode: 'EMP001',
        email: 'yamada@example.com',
        phone: '080-1234-5678',
        role: 'エアコン技術者',
        department: '施工部',
        skills: ['エアコン設置', '修理', '電気工事'],
        certifications: ['第二種電気工事士', '冷媒取扱技術者'],
        status: 'active',
        hireDate: '2020-04-01',
        address: '東京都渋谷区〇〇1-2-3',
        emergencyContact: '山田花子',
        emergencyPhone: '090-1234-5678',
        bloodType: 'A型',
        notes: '優秀な技術者。リーダー候補。'
      },
      {
        id: '2',
        name: '佐藤次郎',
        furigana: 'サトウジロウ',
        employeeCode: 'EMP002',
        email: 'sato@example.com',
        phone: '080-2345-6789',
        role: '電気工事士',
        department: '施工部',
        skills: ['電気工事', '配線', '保守'],
        certifications: ['第一種電気工事士'],
        status: 'active',
        hireDate: '2019-10-01',
        address: '東京都新宿区〇〇2-3-4',
        emergencyContact: '佐藤美咲',
        emergencyPhone: '090-2345-6789',
        bloodType: 'B型',
        notes: '経験豊富。大型案件対応可。'
      },
    ])
  }, [])

  const availableSkills = [
    'エアコン設置', '修理', '電気工事', '配管', '水道工事', 
    'ガス工事', 'メンテナンス', '点検', '清掃', '解体'
  ]

  const availableCertifications = [
    '第一種電気工事士', '第二種電気工事士', '冷媒取扱技術者',
    '高所作業車運転', 'ガス溶接', 'アーク溶接', '管工事施工管理技士'
  ]

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddWorker = () => {
    const newWorker: Worker = {
      id: Date.now().toString(),
      name: formData.name || '',
      furigana: formData.furigana || '',
      employeeCode: formData.employeeCode || '',
      email: formData.email || '',
      phone: formData.phone || '',
      role: formData.role || '',
      department: formData.department || '',
      skills: formData.skills || [],
      certifications: formData.certifications || [],
      status: formData.status || 'active',
      hireDate: formData.hireDate || '',
      address: formData.address || '',
      emergencyContact: formData.emergencyContact || '',
      emergencyPhone: formData.emergencyPhone || '',
      bloodType: formData.bloodType || '',
      notes: formData.notes || '',
    }
    setWorkers([...workers, newWorker])
    setIsAddDialogOpen(false)
    setFormData({ skills: [], certifications: [], status: 'active' })
  }

  const handleEditWorker = () => {
    if (selectedWorker) {
      setWorkers(workers.map(w => 
        w.id === selectedWorker.id ? { ...selectedWorker, ...formData } : w
      ))
      setIsEditDialogOpen(false)
      setSelectedWorker(null)
      setFormData({ skills: [], certifications: [], status: 'active' })
    }
  }

  const handleDeleteWorker = (id: string) => {
    if (confirm('この職人情報を削除しますか？')) {
      setWorkers(workers.filter(w => w.id !== id))
    }
  }

  const openEditDialog = (worker: Worker) => {
    setSelectedWorker(worker)
    setFormData(worker)
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: Worker['status']) => {
    const statusMap = {
      active: { label: '稼働中', variant: 'default' as const },
      inactive: { label: '非稼働', variant: 'secondary' as const },
      on_leave: { label: '休職中', variant: 'destructive' as const },
    }
    return statusMap[status]
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">職人管理</h1>
          <p className="text-muted-foreground">職人情報の登録・編集・管理</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              職人を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規職人登録</DialogTitle>
              <DialogDescription>
                新しい職人の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <WorkerForm 
              formData={formData}
              setFormData={setFormData}
              availableSkills={availableSkills}
              availableCertifications={availableCertifications}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddWorker}>登録</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>職人一覧</CardTitle>
          <CardDescription>
            登録されている職人: {workers.length}名
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="名前、社員番号、メール、役職で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>社員番号</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>役職</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>スキル</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-mono">{worker.employeeCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-sm text-muted-foreground">{worker.furigana}</div>
                      </div>
                    </TableCell>
                    <TableCell>{worker.role}</TableCell>
                    <TableCell>{worker.department}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-1" />
                          {worker.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1" />
                          {worker.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {worker.skills.slice(0, 2).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {worker.skills.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{worker.skills.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(worker.status).variant}>
                        {getStatusBadge(worker.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(worker)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteWorker(worker.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>職人情報編集</DialogTitle>
            <DialogDescription>
              職人の情報を更新してください
            </DialogDescription>
          </DialogHeader>
          <WorkerForm 
            formData={formData}
            setFormData={setFormData}
            availableSkills={availableSkills}
            availableCertifications={availableCertifications}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditWorker}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Worker Form Component
function WorkerForm({ 
  formData, 
  setFormData, 
  availableSkills, 
  availableCertifications 
}: {
  formData: Partial<Worker>
  setFormData: (data: Partial<Worker>) => void
  availableSkills: string[]
  availableCertifications: string[]
}) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">基本情報</TabsTrigger>
        <TabsTrigger value="contact">連絡先</TabsTrigger>
        <TabsTrigger value="skills">スキル・資格</TabsTrigger>
        <TabsTrigger value="other">その他</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeCode">社員番号</Label>
            <Input
              id="employeeCode"
              value={formData.employeeCode || ''}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              placeholder="EMP001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">状態</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Worker['status']) => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="状態を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">稼働中</SelectItem>
                <SelectItem value="inactive">非稼働</SelectItem>
                <SelectItem value="on_leave">休職中</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">氏名</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="山田太郎"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="furigana">フリガナ</Label>
            <Input
              id="furigana"
              value={formData.furigana || ''}
              onChange={(e) => setFormData({ ...formData, furigana: e.target.value })}
              placeholder="ヤマダタロウ"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">役職</Label>
            <Input
              id="role"
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="エアコン技術者"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">部署</Label>
            <Input
              id="department"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="施工部"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hireDate">入社日</Label>
            <Input
              id="hireDate"
              type="date"
              value={formData.hireDate || ''}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodType">血液型</Label>
            <Select
              value={formData.bloodType}
              onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="血液型を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A型">A型</SelectItem>
                <SelectItem value="B型">B型</SelectItem>
                <SelectItem value="O型">O型</SelectItem>
                <SelectItem value="AB型">AB型</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="contact" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="yamada@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="080-1234-5678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">住所</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="東京都渋谷区〇〇1-2-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">緊急連絡先（氏名）</Label>
            <Input
              id="emergencyContact"
              value={formData.emergencyContact || ''}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="山田花子"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">緊急連絡先（電話）</Label>
            <Input
              id="emergencyPhone"
              value={formData.emergencyPhone || ''}
              onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              placeholder="090-1234-5678"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="skills" className="space-y-4">
        <div className="space-y-2">
          <Label>スキル</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableSkills.map((skill) => (
              <div key={skill} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill}`}
                  checked={formData.skills?.includes(skill)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ 
                        ...formData, 
                        skills: [...(formData.skills || []), skill] 
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        skills: formData.skills?.filter(s => s !== skill) || [] 
                      })
                    }
                  }}
                />
                <Label htmlFor={`skill-${skill}`} className="text-sm font-normal">
                  {skill}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>保有資格</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableCertifications.map((cert) => (
              <div key={cert} className="flex items-center space-x-2">
                <Checkbox
                  id={`cert-${cert}`}
                  checked={formData.certifications?.includes(cert)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ 
                        ...formData, 
                        certifications: [...(formData.certifications || []), cert] 
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        certifications: formData.certifications?.filter(c => c !== cert) || [] 
                      })
                    }
                  }}
                />
                <Label htmlFor={`cert-${cert}`} className="text-sm font-normal">
                  {cert}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="other" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">備考</Label>
          <textarea
            id="notes"
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="特記事項があれば入力してください..."
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}