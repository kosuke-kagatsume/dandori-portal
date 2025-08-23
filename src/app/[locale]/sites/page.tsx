'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, MapPin, Building2, Calendar, Clock, Users, AlertCircle, CheckCircle2, Construction } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface Site {
  id: string
  siteCode: string
  siteName: string
  customerId: string
  customerName: string
  projectType: 'new_installation' | 'replacement' | 'repair' | 'maintenance' | 'removal'
  equipmentType: string[]
  address: string
  postalCode: string
  buildingType: 'office' | 'retail' | 'residential' | 'factory' | 'hospital' | 'school' | 'other'
  floor?: string
  accessInfo?: string
  parkingInfo?: string
  keyLocation?: string
  contactPerson: string
  contactPhone: string
  scheduledDate?: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  estimatedDuration?: number // hours
  assignedWorkers?: string[]
  requiredSkills?: string[]
  requiredEquipment?: string[]
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'pending'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  specialNotes?: string
  safetyNotes?: string
  completionDate?: string
  photos?: string[]
  createdDate: string
  updatedDate: string
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | Site['status']>('all')
  const [formData, setFormData] = useState<Partial<Site>>({
    projectType: 'new_installation',
    buildingType: 'office',
    status: 'scheduled',
    priority: 'medium',
    equipmentType: [],
    requiredSkills: [],
    requiredEquipment: [],
    assignedWorkers: []
  })

  // Mock data
  useEffect(() => {
    setSites([
      {
        id: '1',
        siteCode: 'SITE001',
        siteName: '渋谷オフィスビル5F',
        customerId: 'CUST001',
        customerName: '田中商事株式会社',
        projectType: 'new_installation',
        equipmentType: ['業務用エアコン', '換気システム'],
        address: '東京都渋谷区神宮前1-2-3',
        postalCode: '150-0001',
        buildingType: 'office',
        floor: '5F',
        accessInfo: 'エレベーターあり。搬入は裏口から。',
        parkingInfo: '建物裏に作業車2台分駐車可能',
        keyLocation: '1F管理室',
        contactPerson: '田中一郎',
        contactPhone: '080-1234-5678',
        scheduledDate: '2024-01-20',
        scheduledStartTime: '09:00',
        scheduledEndTime: '17:00',
        estimatedDuration: 8,
        assignedWorkers: ['山田太郎', '佐藤次郎'],
        requiredSkills: ['エアコン設置', '電気工事'],
        requiredEquipment: ['脚立', 'ドリル', '配管工具'],
        status: 'scheduled',
        priority: 'high',
        specialNotes: '土曜日作業。騒音に注意。',
        safetyNotes: '高所作業あり。安全帯必須。',
        createdDate: '2024-01-10',
        updatedDate: '2024-01-15'
      },
      {
        id: '2',
        siteCode: 'SITE002',
        siteName: '新宿マンション203号室',
        customerId: 'CUST002',
        customerName: '山田工務店',
        projectType: 'repair',
        equipmentType: ['家庭用エアコン'],
        address: '東京都新宿区新宿2-3-4',
        postalCode: '160-0022',
        buildingType: 'residential',
        floor: '2F',
        accessInfo: 'オートロックあり。事前連絡必要。',
        parkingInfo: 'コインパーキング利用',
        contactPerson: '山田太郎',
        contactPhone: '090-8765-4321',
        scheduledDate: '2024-01-18',
        scheduledStartTime: '13:00',
        scheduledEndTime: '15:00',
        estimatedDuration: 2,
        assignedWorkers: ['鈴木三郎'],
        requiredSkills: ['エアコン修理'],
        requiredEquipment: ['工具セット', 'テスター'],
        status: 'in_progress',
        priority: 'medium',
        specialNotes: 'ペット（犬）あり',
        createdDate: '2024-01-08',
        updatedDate: '2024-01-18'
      }
    ])
  }, [])

  const projectTypes = [
    { value: 'new_installation', label: '新規設置' },
    { value: 'replacement', label: '交換' },
    { value: 'repair', label: '修理' },
    { value: 'maintenance', label: 'メンテナンス' },
    { value: 'removal', label: '撤去' }
  ]

  const buildingTypes = [
    { value: 'office', label: 'オフィス' },
    { value: 'retail', label: '店舗' },
    { value: 'residential', label: '住宅' },
    { value: 'factory', label: '工場' },
    { value: 'hospital', label: '病院' },
    { value: 'school', label: '学校' },
    { value: 'other', label: 'その他' }
  ]

  const equipmentTypes = [
    '業務用エアコン',
    '家庭用エアコン',
    '換気システム',
    '冷凍機',
    '冷却塔',
    '配管設備',
    'その他'
  ]

  const requiredSkillsList = [
    'エアコン設置',
    'エアコン修理',
    '電気工事',
    '配管工事',
    '冷媒取扱',
    '高所作業',
    'クレーン操作'
  ]

  const requiredEquipmentList = [
    '脚立',
    '高所作業車',
    'ドリル',
    '配管工具',
    'テスター',
    '真空ポンプ',
    '冷媒回収機',
    'トルクレンチ',
    '安全帯'
  ]

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.siteCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || site.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleAddSite = () => {
    const newSite: Site = {
      id: Date.now().toString(),
      siteCode: formData.siteCode || `SITE${Date.now().toString().slice(-3)}`,
      siteName: formData.siteName || '',
      customerId: formData.customerId || '',
      customerName: formData.customerName || '',
      projectType: formData.projectType || 'new_installation',
      equipmentType: formData.equipmentType || [],
      address: formData.address || '',
      postalCode: formData.postalCode || '',
      buildingType: formData.buildingType || 'office',
      floor: formData.floor,
      accessInfo: formData.accessInfo,
      parkingInfo: formData.parkingInfo,
      keyLocation: formData.keyLocation,
      contactPerson: formData.contactPerson || '',
      contactPhone: formData.contactPhone || '',
      scheduledDate: formData.scheduledDate,
      scheduledStartTime: formData.scheduledStartTime,
      scheduledEndTime: formData.scheduledEndTime,
      estimatedDuration: formData.estimatedDuration,
      assignedWorkers: formData.assignedWorkers,
      requiredSkills: formData.requiredSkills,
      requiredEquipment: formData.requiredEquipment,
      status: formData.status || 'scheduled',
      priority: formData.priority || 'medium',
      specialNotes: formData.specialNotes,
      safetyNotes: formData.safetyNotes,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    }
    setSites([...sites, newSite])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditSite = () => {
    if (selectedSite) {
      setSites(sites.map(s => 
        s.id === selectedSite.id ? { 
          ...selectedSite, 
          ...formData,
          updatedDate: new Date().toISOString().split('T')[0]
        } : s
      ))
      setIsEditDialogOpen(false)
      setSelectedSite(null)
      resetForm()
    }
  }

  const handleDeleteSite = (id: string) => {
    if (confirm('この現場情報を削除しますか？')) {
      setSites(sites.filter(s => s.id !== id))
    }
  }

  const openEditDialog = (site: Site) => {
    setSelectedSite(site)
    setFormData(site)
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      projectType: 'new_installation',
      buildingType: 'office',
      status: 'scheduled',
      priority: 'medium',
      equipmentType: [],
      requiredSkills: [],
      requiredEquipment: [],
      assignedWorkers: []
    })
  }

  const getStatusBadge = (status: Site['status']) => {
    const statusMap = {
      scheduled: { label: '予定', variant: 'secondary' as const, icon: Calendar },
      in_progress: { label: '作業中', variant: 'default' as const, icon: Construction },
      completed: { label: '完了', variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-500' },
      cancelled: { label: 'キャンセル', variant: 'destructive' as const, icon: AlertCircle },
      pending: { label: '保留', variant: 'outline' as const, icon: Clock }
    }
    return statusMap[status]
  }

  const getPriorityBadge = (priority: Site['priority']) => {
    const priorityMap = {
      low: { label: '低', color: 'text-gray-600 bg-gray-100' },
      medium: { label: '中', color: 'text-blue-600 bg-blue-100' },
      high: { label: '高', color: 'text-orange-600 bg-orange-100' },
      urgent: { label: '緊急', color: 'text-red-600 bg-red-100' }
    }
    return priorityMap[priority]
  }

  const getProjectTypeBadge = (type: Site['projectType']) => {
    const typeMap = {
      new_installation: { label: '新規設置', color: 'bg-blue-500' },
      replacement: { label: '交換', color: 'bg-purple-500' },
      repair: { label: '修理', color: 'bg-yellow-500' },
      maintenance: { label: 'メンテナンス', color: 'bg-green-500' },
      removal: { label: '撤去', color: 'bg-gray-500' }
    }
    return typeMap[type]
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">現場管理</h1>
          <p className="text-muted-foreground">工事現場の情報登録・スケジュール管理</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              現場を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規現場登録</DialogTitle>
              <DialogDescription>
                新しい現場の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <SiteForm 
              formData={formData}
              setFormData={setFormData}
              projectTypes={projectTypes}
              buildingTypes={buildingTypes}
              equipmentTypes={equipmentTypes}
              requiredSkillsList={requiredSkillsList}
              requiredEquipmentList={requiredEquipmentList}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddSite}>登録</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">本日の現場</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites.filter(s => s.scheduledDate === new Date().toISOString().split('T')[0]).length}
            </div>
            <p className="text-xs text-muted-foreground">件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">今週の予定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites.filter(s => s.status === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">作業中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites.filter(s => s.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">緊急案件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {sites.filter(s => s.priority === 'urgent').length}
            </div>
            <p className="text-xs text-muted-foreground">要対応</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">今月完了</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sites.filter(s => s.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">件</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          全て
        </Button>
        <Button
          variant={filterStatus === 'scheduled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('scheduled')}
        >
          予定
        </Button>
        <Button
          variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('in_progress')}
        >
          作業中
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
        >
          完了
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>現場一覧</CardTitle>
          <CardDescription>
            登録されている現場: {sites.length}件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="現場名、現場コード、顧客名、住所で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>現場コード</TableHead>
                  <TableHead>現場名</TableHead>
                  <TableHead>顧客</TableHead>
                  <TableHead>作業内容</TableHead>
                  <TableHead>予定日時</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>優先度</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-mono">{site.siteCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{site.siteName}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {site.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{site.customerName}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getProjectTypeBadge(site.projectType).color}`}>
                        {getProjectTypeBadge(site.projectType).label}
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.scheduledDate && (
                        <div className="space-y-1">
                          <div className="text-sm">{site.scheduledDate}</div>
                          <div className="text-xs text-muted-foreground">
                            {site.scheduledStartTime} - {site.scheduledEndTime}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="text-sm">
                          {site.assignedWorkers?.length || 0}名
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(site.priority).color}`}>
                        {getPriorityBadge(site.priority).label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadge(site.status).variant}
                        className={getStatusBadge(site.status).className}
                      >
                        {getStatusBadge(site.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(site)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSite(site.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>現場情報編集</DialogTitle>
            <DialogDescription>
              現場の情報を更新してください
            </DialogDescription>
          </DialogHeader>
          <SiteForm 
            formData={formData}
            setFormData={setFormData}
            projectTypes={projectTypes}
            buildingTypes={buildingTypes}
            equipmentTypes={equipmentTypes}
            requiredSkillsList={requiredSkillsList}
            requiredEquipmentList={requiredEquipmentList}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditSite}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Site Form Component
function SiteForm({ 
  formData, 
  setFormData, 
  projectTypes,
  buildingTypes,
  equipmentTypes,
  requiredSkillsList,
  requiredEquipmentList
}: {
  formData: Partial<Site>
  setFormData: (data: Partial<Site>) => void
  projectTypes: { value: string; label: string }[]
  buildingTypes: { value: string; label: string }[]
  equipmentTypes: string[]
  requiredSkillsList: string[]
  requiredEquipmentList: string[]
}) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic">基本情報</TabsTrigger>
        <TabsTrigger value="location">場所情報</TabsTrigger>
        <TabsTrigger value="schedule">スケジュール</TabsTrigger>
        <TabsTrigger value="requirements">必要リソース</TabsTrigger>
        <TabsTrigger value="notes">注意事項</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="siteCode">現場コード</Label>
            <Input
              id="siteCode"
              value={formData.siteCode || ''}
              onChange={(e) => setFormData({ ...formData, siteCode: e.target.value })}
              placeholder="SITE001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">状態</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Site['status']) => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="状態を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">予定</SelectItem>
                <SelectItem value="in_progress">作業中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
                <SelectItem value="pending">保留</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteName">現場名</Label>
          <Input
            id="siteName"
            value={formData.siteName || ''}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
            placeholder="渋谷オフィスビル5F"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">顧客名</Label>
            <Input
              id="customerName"
              value={formData.customerName || ''}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="田中商事株式会社"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerCode">顧客コード</Label>
            <Input
              id="customerCode"
              value={formData.customerId || ''}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              placeholder="CUST001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectType">作業種別</Label>
            <Select
              value={formData.projectType}
              onValueChange={(value: Site['projectType']) => 
                setFormData({ ...formData, projectType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="作業種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">優先度</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: Site['priority']) => 
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="優先度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="urgent">緊急</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>設備種別</Label>
          <div className="grid grid-cols-2 gap-2">
            {equipmentTypes.map((equipment) => (
              <div key={equipment} className="flex items-center space-x-2">
                <Checkbox
                  id={`equipment-${equipment}`}
                  checked={formData.equipmentType?.includes(equipment)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ 
                        ...formData, 
                        equipmentType: [...(formData.equipmentType || []), equipment] 
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        equipmentType: formData.equipmentType?.filter(e => e !== equipment) || [] 
                      })
                    }
                  }}
                />
                <Label htmlFor={`equipment-${equipment}`} className="text-sm font-normal">
                  {equipment}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="location" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">郵便番号</Label>
            <Input
              id="postalCode"
              value={formData.postalCode || ''}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="150-0001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buildingType">建物種別</Label>
            <Select
              value={formData.buildingType}
              onValueChange={(value: Site['buildingType']) => 
                setFormData({ ...formData, buildingType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="建物種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {buildingTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">住所</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="東京都渋谷区神宮前1-2-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="floor">階数</Label>
            <Input
              id="floor"
              value={formData.floor || ''}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              placeholder="5F"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyLocation">鍵の場所</Label>
            <Input
              id="keyLocation"
              value={formData.keyLocation || ''}
              onChange={(e) => setFormData({ ...formData, keyLocation: e.target.value })}
              placeholder="1F管理室"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessInfo">アクセス情報</Label>
          <Textarea
            id="accessInfo"
            value={formData.accessInfo || ''}
            onChange={(e) => setFormData({ ...formData, accessInfo: e.target.value })}
            placeholder="エレベーターあり。搬入は裏口から。"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parkingInfo">駐車場情報</Label>
          <Textarea
            id="parkingInfo"
            value={formData.parkingInfo || ''}
            onChange={(e) => setFormData({ ...formData, parkingInfo: e.target.value })}
            placeholder="建物裏に作業車2台分駐車可能"
            rows={2}
          />
        </div>
      </TabsContent>

      <TabsContent value="schedule" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">作業予定日</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={formData.scheduledDate || ''}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">予定作業時間（時間）</Label>
            <Input
              id="estimatedDuration"
              type="number"
              value={formData.estimatedDuration || ''}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
              placeholder="8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledStartTime">開始時刻</Label>
            <Input
              id="scheduledStartTime"
              type="time"
              value={formData.scheduledStartTime || ''}
              onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledEndTime">終了時刻</Label>
            <Input
              id="scheduledEndTime"
              type="time"
              value={formData.scheduledEndTime || ''}
              onChange={(e) => setFormData({ ...formData, scheduledEndTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPerson">現場担当者</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson || ''}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="田中一郎"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">連絡先電話番号</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone || ''}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="080-1234-5678"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="requirements" className="space-y-4">
        <div className="space-y-2">
          <Label>必要スキル</Label>
          <div className="grid grid-cols-2 gap-2">
            {requiredSkillsList.map((skill) => (
              <div key={skill} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill}`}
                  checked={formData.requiredSkills?.includes(skill)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ 
                        ...formData, 
                        requiredSkills: [...(formData.requiredSkills || []), skill] 
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        requiredSkills: formData.requiredSkills?.filter(s => s !== skill) || [] 
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
          <Label>必要機材</Label>
          <div className="grid grid-cols-2 gap-2">
            {requiredEquipmentList.map((equipment) => (
              <div key={equipment} className="flex items-center space-x-2">
                <Checkbox
                  id={`req-equipment-${equipment}`}
                  checked={formData.requiredEquipment?.includes(equipment)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ 
                        ...formData, 
                        requiredEquipment: [...(formData.requiredEquipment || []), equipment] 
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        requiredEquipment: formData.requiredEquipment?.filter(e => e !== equipment) || [] 
                      })
                    }
                  }}
                />
                <Label htmlFor={`req-equipment-${equipment}`} className="text-sm font-normal">
                  {equipment}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedWorkers">担当作業員（カンマ区切り）</Label>
          <Input
            id="assignedWorkers"
            value={formData.assignedWorkers?.join(', ') || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              assignedWorkers: e.target.value.split(',').map(w => w.trim()).filter(w => w) 
            })}
            placeholder="山田太郎, 佐藤次郎"
          />
        </div>
      </TabsContent>

      <TabsContent value="notes" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="specialNotes">特記事項</Label>
          <Textarea
            id="specialNotes"
            value={formData.specialNotes || ''}
            onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
            placeholder="作業に関する特別な注意事項を入力..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="safetyNotes">安全注意事項</Label>
          <Textarea
            id="safetyNotes"
            value={formData.safetyNotes || ''}
            onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
            placeholder="安全に関する注意事項を入力..."
            rows={3}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}