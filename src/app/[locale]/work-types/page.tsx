'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Clock, DollarSign, Users, Wrench, AlertCircle } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'

interface WorkType {
  id: string
  code: string
  name: string
  category: 'installation' | 'maintenance' | 'repair' | 'inspection' | 'removal' | 'other'
  description: string
  estimatedDuration: number // 標準作業時間（分）
  requiredWorkers: number // 必要人数
  requiredSkills: string[]
  requiredCertifications: string[]
  requiredTools: string[]
  baseCost: number // 基本料金
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert'
  safetyLevel: 'low' | 'medium' | 'high' | 'very_high'
  isActive: boolean
  standardProcedure?: string
  safetyGuidelines?: string
  qualityCheckpoints?: string[]
  tags?: string[]
}

export default function WorkTypesPage() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | WorkType['category']>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null)
  const [formData, setFormData] = useState<Partial<WorkType>>({
    category: 'installation',
    difficultyLevel: 'medium',
    safetyLevel: 'medium',
    isActive: true,
    requiredWorkers: 2,
    requiredSkills: [],
    requiredCertifications: [],
    requiredTools: [],
    qualityCheckpoints: [],
    tags: []
  })

  // Mock data
  useEffect(() => {
    setWorkTypes([
      {
        id: '1',
        code: 'AC-INST-01',
        name: '家庭用エアコン標準設置',
        category: 'installation',
        description: '家庭用エアコンの標準的な設置作業（配管4mまで）',
        estimatedDuration: 120,
        requiredWorkers: 2,
        requiredSkills: ['エアコン設置', '配管工事', '電気工事'],
        requiredCertifications: ['第二種電気工事士'],
        requiredTools: ['ドリル', '真空ポンプ', 'トルクレンチ', 'フレアツール'],
        baseCost: 15000,
        difficultyLevel: 'medium',
        safetyLevel: 'medium',
        isActive: true,
        standardProcedure: '1. 設置位置確認\n2. 室内機取付\n3. 室外機設置\n4. 配管接続\n5. 真空引き\n6. 試運転',
        safetyGuidelines: '高所作業時は安全帯着用。電気工事は必ずブレーカーを落とす。',
        qualityCheckpoints: ['配管の気密性確認', '排水確認', '冷暖房動作確認', '異音確認'],
        tags: ['家庭用', '標準工事']
      },
      {
        id: '2',
        code: 'AC-MAINT-01',
        name: '業務用エアコン定期メンテナンス',
        category: 'maintenance',
        description: '業務用エアコンの定期清掃・点検作業',
        estimatedDuration: 180,
        requiredWorkers: 2,
        requiredSkills: ['エアコンメンテナンス', '高所作業'],
        requiredCertifications: ['高所作業車運転'],
        requiredTools: ['高圧洗浄機', '点検機器', '清掃用具'],
        baseCost: 25000,
        difficultyLevel: 'medium',
        safetyLevel: 'high',
        isActive: true,
        standardProcedure: '1. 動作確認\n2. フィルター清掃\n3. 熱交換器洗浄\n4. ドレンパン清掃\n5. 電気系統点検\n6. 冷媒量確認',
        safetyGuidelines: '高所作業車使用時は必ず2名体制。薬品使用時は保護具着用。',
        qualityCheckpoints: ['清掃前後の風量測定', '異音・振動確認', '温度差測定'],
        tags: ['業務用', '定期メンテ']
      },
      {
        id: '3',
        code: 'AC-REP-01',
        name: 'エアコン冷媒ガス補充',
        category: 'repair',
        description: 'エアコンの冷媒ガス漏れ修理および補充作業',
        estimatedDuration: 90,
        requiredWorkers: 1,
        requiredSkills: ['冷媒取扱', 'エアコン修理'],
        requiredCertifications: ['冷媒取扱技術者'],
        requiredTools: ['マニホールドゲージ', 'リークディテクター', '冷媒ボンベ'],
        baseCost: 12000,
        difficultyLevel: 'hard',
        safetyLevel: 'high',
        isActive: true,
        standardProcedure: '1. リーク箇所特定\n2. 修理作業\n3. 真空引き\n4. 冷媒充填\n5. 動作確認',
        safetyGuidelines: 'フロンガス取扱注意。換気確保。保護メガネ着用。',
        qualityCheckpoints: ['リーク確認', '適正圧力確認', '過冷却度測定'],
        tags: ['修理', '冷媒']
      }
    ])
  }, [])

  const categories = [
    { value: 'installation', label: '設置工事', icon: Wrench },
    { value: 'maintenance', label: 'メンテナンス', icon: Clock },
    { value: 'repair', label: '修理', icon: AlertCircle },
    { value: 'inspection', label: '点検', icon: Search },
    { value: 'removal', label: '撤去', icon: Trash2 },
    { value: 'other', label: 'その他', icon: Plus }
  ]

  const availableSkills = [
    'エアコン設置', 'エアコン修理', 'エアコンメンテナンス',
    '電気工事', '配管工事', '冷媒取扱', '高所作業',
    'クレーン操作', '溶接', '断熱工事'
  ]

  const availableCertifications = [
    '第一種電気工事士', '第二種電気工事士',
    '冷媒取扱技術者', '高所作業車運転',
    'ガス溶接', 'アーク溶接', '管工事施工管理技士',
    '冷凍機械責任者'
  ]

  const availableTools = [
    'ドリル', '真空ポンプ', 'トルクレンチ', 'フレアツール',
    'マニホールドゲージ', 'リークディテクター', '冷媒回収機',
    '高圧洗浄機', '高所作業車', '脚立', 'テスター', '絶縁抵抗計'
  ]

  const filteredWorkTypes = workTypes.filter(workType => {
    const matchesSearch = 
      workType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workType.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workType.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || workType.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAddWorkType = () => {
    const newWorkType: WorkType = {
      id: Date.now().toString(),
      code: formData.code || `WT-${Date.now().toString().slice(-5)}`,
      name: formData.name || '',
      category: formData.category || 'installation',
      description: formData.description || '',
      estimatedDuration: formData.estimatedDuration || 60,
      requiredWorkers: formData.requiredWorkers || 2,
      requiredSkills: formData.requiredSkills || [],
      requiredCertifications: formData.requiredCertifications || [],
      requiredTools: formData.requiredTools || [],
      baseCost: formData.baseCost || 0,
      difficultyLevel: formData.difficultyLevel || 'medium',
      safetyLevel: formData.safetyLevel || 'medium',
      isActive: formData.isActive ?? true,
      standardProcedure: formData.standardProcedure,
      safetyGuidelines: formData.safetyGuidelines,
      qualityCheckpoints: formData.qualityCheckpoints || [],
      tags: formData.tags || []
    }
    setWorkTypes([...workTypes, newWorkType])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditWorkType = () => {
    if (selectedWorkType) {
      setWorkTypes(workTypes.map(wt => 
        wt.id === selectedWorkType.id ? { ...selectedWorkType, ...formData } : wt
      ))
      setIsEditDialogOpen(false)
      setSelectedWorkType(null)
      resetForm()
    }
  }

  const handleDeleteWorkType = (id: string) => {
    if (confirm('この作業種別を削除しますか？')) {
      setWorkTypes(workTypes.filter(wt => wt.id !== id))
    }
  }

  const openEditDialog = (workType: WorkType) => {
    setSelectedWorkType(workType)
    setFormData(workType)
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      category: 'installation',
      difficultyLevel: 'medium',
      safetyLevel: 'medium',
      isActive: true,
      requiredWorkers: 2,
      requiredSkills: [],
      requiredCertifications: [],
      requiredTools: [],
      qualityCheckpoints: [],
      tags: []
    })
  }

  const getCategoryBadge = (category: WorkType['category']) => {
    const cat = categories.find(c => c.value === category)
    return cat || { label: category, icon: Plus }
  }

  const getDifficultyBadge = (level: WorkType['difficultyLevel']) => {
    const difficultyMap = {
      easy: { label: '簡単', color: 'bg-green-100 text-green-800' },
      medium: { label: '普通', color: 'bg-blue-100 text-blue-800' },
      hard: { label: '難しい', color: 'bg-orange-100 text-orange-800' },
      expert: { label: '専門', color: 'bg-purple-100 text-purple-800' }
    }
    return difficultyMap[level]
  }

  const getSafetyBadge = (level: WorkType['safetyLevel']) => {
    const safetyMap = {
      low: { label: '低', color: 'bg-gray-100 text-gray-800' },
      medium: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: '高', color: 'bg-orange-100 text-orange-800' },
      very_high: { label: '非常に高', color: 'bg-red-100 text-red-800' }
    }
    return safetyMap[level]
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}時間${mins > 0 ? `${mins}分` : ''}` : `${mins}分`
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">作業種別設定</h1>
          <p className="text-muted-foreground">作業種別の定義と標準化</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              作業種別を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規作業種別登録</DialogTitle>
              <DialogDescription>
                新しい作業種別を定義してください
              </DialogDescription>
            </DialogHeader>
            <WorkTypeForm 
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              availableSkills={availableSkills}
              availableCertifications={availableCertifications}
              availableTools={availableTools}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddWorkType}>登録</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">登録種別数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              有効: {workTypes.filter(w => w.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">平均作業時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(
                Math.round(workTypes.reduce((sum, w) => sum + w.estimatedDuration, 0) / workTypes.length)
              )}
            </div>
            <p className="text-xs text-muted-foreground">標準時間</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">平均必要人数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(workTypes.reduce((sum, w) => sum + w.requiredWorkers, 0) / workTypes.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">名</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">高リスク作業</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {workTypes.filter(w => w.safetyLevel === 'high' || w.safetyLevel === 'very_high').length}
            </div>
            <p className="text-xs text-muted-foreground">件</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        <Button
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('all')}
        >
          全て
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.value}
            variant={filterCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat.value as WorkType['category'])}
          >
            <cat.icon className="w-4 h-4 mr-1" />
            {cat.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>作業種別一覧</CardTitle>
          <CardDescription>
            標準化された作業種別の管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="作業名、コード、説明で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コード</TableHead>
                  <TableHead>作業名</TableHead>
                  <TableHead>カテゴリー</TableHead>
                  <TableHead>標準時間</TableHead>
                  <TableHead>必要人数</TableHead>
                  <TableHead>基本料金</TableHead>
                  <TableHead>難易度</TableHead>
                  <TableHead>安全レベル</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkTypes.map((workType) => {
                  const CategoryIcon = getCategoryBadge(workType.category).icon
                  return (
                    <TableRow key={workType.id}>
                      <TableCell className="font-mono">{workType.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workType.name}</div>
                          <div className="text-sm text-muted-foreground">{workType.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="w-4 h-4" />
                          <span>{getCategoryBadge(workType.category).label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(workType.estimatedDuration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {workType.requiredWorkers}名
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ¥{workType.baseCost.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(workType.difficultyLevel).color}`}>
                          {getDifficultyBadge(workType.difficultyLevel).label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSafetyBadge(workType.safetyLevel).color}`}>
                          {getSafetyBadge(workType.safetyLevel).label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={workType.isActive ? 'default' : 'secondary'}>
                          {workType.isActive ? '有効' : '無効'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(workType)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteWorkType(workType.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>作業種別編集</DialogTitle>
            <DialogDescription>
              作業種別の情報を更新してください
            </DialogDescription>
          </DialogHeader>
          <WorkTypeForm 
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            availableSkills={availableSkills}
            availableCertifications={availableCertifications}
            availableTools={availableTools}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditWorkType}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// WorkType Form Component
function WorkTypeForm({ 
  formData, 
  setFormData, 
  categories,
  availableSkills,
  availableCertifications,
  availableTools
}: {
  formData: Partial<WorkType>
  setFormData: (data: Partial<WorkType>) => void
  categories: { value: string; label: string; icon: any }[]
  availableSkills: string[]
  availableCertifications: string[]
  availableTools: string[]
}) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic">基本情報</TabsTrigger>
        <TabsTrigger value="requirements">必要条件</TabsTrigger>
        <TabsTrigger value="procedure">作業手順</TabsTrigger>
        <TabsTrigger value="safety">安全・品質</TabsTrigger>
        <TabsTrigger value="cost">料金設定</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">作業コード</Label>
            <Input
              id="code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="AC-INST-01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isActive">有効状態</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="font-normal">
                {formData.isActive ? '有効' : '無効'}
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">作業名</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="家庭用エアコン標準設置"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="作業の詳細説明を入力..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">カテゴリー</Label>
            <Select
              value={formData.category}
              onValueChange={(value: WorkType['category']) => 
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリーを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">タグ（カンマ区切り）</Label>
            <Input
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
              })}
              placeholder="家庭用, 標準工事"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="requirements" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">標準作業時間（分）</Label>
            <Input
              id="estimatedDuration"
              type="number"
              value={formData.estimatedDuration || ''}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
              placeholder="120"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requiredWorkers">必要人数</Label>
            <Input
              id="requiredWorkers"
              type="number"
              value={formData.requiredWorkers || ''}
              onChange={(e) => setFormData({ ...formData, requiredWorkers: parseInt(e.target.value) })}
              placeholder="2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficultyLevel">難易度</Label>
            <Select
              value={formData.difficultyLevel}
              onValueChange={(value: WorkType['difficultyLevel']) => 
                setFormData({ ...formData, difficultyLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="難易度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">簡単</SelectItem>
                <SelectItem value="medium">普通</SelectItem>
                <SelectItem value="hard">難しい</SelectItem>
                <SelectItem value="expert">専門</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>必要スキル</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableSkills.map((skill) => (
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
          <Label>必要資格</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableCertifications.map((cert) => (
              <div key={cert} className="flex items-center space-x-2">
                <Checkbox
                  id={`cert-${cert}`}
                  checked={formData.requiredCertifications?.includes(cert)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ 
                        ...formData, 
                        requiredCertifications: [...(formData.requiredCertifications || []), cert] 
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        requiredCertifications: formData.requiredCertifications?.filter(c => c !== cert) || [] 
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

        <div className="space-y-2">
          <Label>必要工具・機材</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableTools.map((tool) => (
              <div key={tool} className="flex items-center space-x-2">
                <Checkbox
                  id={`tool-${tool}`}
                  checked={formData.requiredTools?.includes(tool)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ 
                        ...formData, 
                        requiredTools: [...(formData.requiredTools || []), tool] 
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        requiredTools: formData.requiredTools?.filter(t => t !== tool) || [] 
                      })
                    }
                  }}
                />
                <Label htmlFor={`tool-${tool}`} className="text-sm font-normal">
                  {tool}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="procedure" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="standardProcedure">標準作業手順</Label>
          <Textarea
            id="standardProcedure"
            value={formData.standardProcedure || ''}
            onChange={(e) => setFormData({ ...formData, standardProcedure: e.target.value })}
            placeholder="1. 準備作業\n2. 本体設置\n3. 配管接続\n4. 電気工事\n5. 試運転\n6. 清掃・片付け"
            rows={8}
          />
        </div>
      </TabsContent>

      <TabsContent value="safety" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="safetyLevel">安全レベル</Label>
          <Select
            value={formData.safetyLevel}
            onValueChange={(value: WorkType['safetyLevel']) => 
              setFormData({ ...formData, safetyLevel: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="安全レベルを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="very_high">非常に高</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="safetyGuidelines">安全ガイドライン</Label>
          <Textarea
            id="safetyGuidelines"
            value={formData.safetyGuidelines || ''}
            onChange={(e) => setFormData({ ...formData, safetyGuidelines: e.target.value })}
            placeholder="安全に関する注意事項を入力..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualityCheckpoints">品質チェックポイント（1行1項目）</Label>
          <Textarea
            id="qualityCheckpoints"
            value={formData.qualityCheckpoints?.join('\n') || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              qualityCheckpoints: e.target.value.split('\n').filter(line => line.trim()) 
            })}
            placeholder="配管の気密性確認\n排水確認\n冷暖房動作確認\n異音確認"
            rows={4}
          />
        </div>
      </TabsContent>

      <TabsContent value="cost" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseCost">基本料金（円）</Label>
          <Input
            id="baseCost"
            type="number"
            value={formData.baseCost || ''}
            onChange={(e) => setFormData({ ...formData, baseCost: parseInt(e.target.value) })}
            placeholder="15000"
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}