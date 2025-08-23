'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2, MapPin, FileText, Calendar } from 'lucide-react'
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

interface Customer {
  id: string
  companyName: string
  companyNameKana: string
  customerCode: string
  type: 'corporate' | 'individual' | 'government'
  industry: string
  contactPerson: string
  contactPersonKana: string
  department: string
  position: string
  email: string
  phone: string
  fax?: string
  postalCode: string
  address: string
  website?: string
  establishedDate?: string
  capitalAmount?: string
  employeeCount?: string
  fiscalMonth?: string
  paymentTerms: 'cash' | 'transfer' | 'credit' | 'invoice'
  paymentDueDate?: number // 支払い期日（締め日から何日後）
  creditLimit?: number
  taxType: 'include' | 'exclude'
  status: 'active' | 'inactive' | 'suspended'
  contractStatus: 'contracted' | 'negotiating' | 'prospective'
  notes?: string
  registeredDate: string
  lastContactDate?: string
  totalTransactionAmount?: number
  tags?: string[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({
    type: 'corporate',
    paymentTerms: 'invoice',
    taxType: 'exclude',
    status: 'active',
    contractStatus: 'prospective',
    tags: []
  })

  // Mock data
  useEffect(() => {
    setCustomers([
      {
        id: '1',
        companyName: '田中商事株式会社',
        companyNameKana: 'タナカショウジカブシキガイシャ',
        customerCode: 'CUST001',
        type: 'corporate',
        industry: '建設業',
        contactPerson: '田中一郎',
        contactPersonKana: 'タナカイチロウ',
        department: '総務部',
        position: '部長',
        email: 'tanaka@tanaka-shoji.co.jp',
        phone: '03-1234-5678',
        fax: '03-1234-5679',
        postalCode: '150-0001',
        address: '東京都渋谷区神宮前1-2-3 田中ビル5F',
        website: 'https://tanaka-shoji.co.jp',
        establishedDate: '1985-04-01',
        capitalAmount: '5000万円',
        employeeCount: '150名',
        fiscalMonth: '3月',
        paymentTerms: 'invoice',
        paymentDueDate: 30,
        creditLimit: 5000000,
        taxType: 'exclude',
        status: 'active',
        contractStatus: 'contracted',
        notes: '大口顧客。定期メンテナンス契約あり。',
        registeredDate: '2020-01-15',
        lastContactDate: '2024-01-10',
        totalTransactionAmount: 25000000,
        tags: ['VIP', '定期契約', '大口']
      },
      {
        id: '2',
        companyName: '山田工務店',
        companyNameKana: 'ヤマダコウムテン',
        customerCode: 'CUST002',
        type: 'individual',
        industry: '建設業',
        contactPerson: '山田太郎',
        contactPersonKana: 'ヤマダタロウ',
        department: '',
        position: '代表',
        email: 'info@yamada-koumuten.com',
        phone: '080-9876-5432',
        postalCode: '160-0022',
        address: '東京都新宿区新宿2-3-4',
        paymentTerms: 'transfer',
        paymentDueDate: 15,
        creditLimit: 1000000,
        taxType: 'include',
        status: 'active',
        contractStatus: 'contracted',
        notes: '小規模案件中心',
        registeredDate: '2021-06-20',
        lastContactDate: '2024-01-05',
        totalTransactionAmount: 3500000,
        tags: ['個人事業主', '小規模']
      },
    ])
  }, [])

  const industries = [
    '建設業', '製造業', '小売業', '飲食業', '不動産業', 
    'IT・通信業', '医療・福祉', '教育', 'サービス業', 'その他'
  ]

  const filteredCustomers = customers.filter(customer =>
    customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddCustomer = () => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      companyName: formData.companyName || '',
      companyNameKana: formData.companyNameKana || '',
      customerCode: formData.customerCode || `CUST${Date.now().toString().slice(-3)}`,
      type: formData.type || 'corporate',
      industry: formData.industry || '',
      contactPerson: formData.contactPerson || '',
      contactPersonKana: formData.contactPersonKana || '',
      department: formData.department || '',
      position: formData.position || '',
      email: formData.email || '',
      phone: formData.phone || '',
      fax: formData.fax,
      postalCode: formData.postalCode || '',
      address: formData.address || '',
      website: formData.website,
      establishedDate: formData.establishedDate,
      capitalAmount: formData.capitalAmount,
      employeeCount: formData.employeeCount,
      fiscalMonth: formData.fiscalMonth,
      paymentTerms: formData.paymentTerms || 'invoice',
      paymentDueDate: formData.paymentDueDate,
      creditLimit: formData.creditLimit,
      taxType: formData.taxType || 'exclude',
      status: formData.status || 'active',
      contractStatus: formData.contractStatus || 'prospective',
      notes: formData.notes,
      registeredDate: new Date().toISOString().split('T')[0],
      lastContactDate: formData.lastContactDate,
      totalTransactionAmount: 0,
      tags: formData.tags || []
    }
    setCustomers([...customers, newCustomer])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setCustomers(customers.map(c => 
        c.id === selectedCustomer.id ? { ...selectedCustomer, ...formData } : c
      ))
      setIsEditDialogOpen(false)
      setSelectedCustomer(null)
      resetForm()
    }
  }

  const handleDeleteCustomer = (id: string) => {
    if (confirm('この顧客情報を削除しますか？')) {
      setCustomers(customers.filter(c => c.id !== id))
    }
  }

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(customer)
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      type: 'corporate',
      paymentTerms: 'invoice',
      taxType: 'exclude',
      status: 'active',
      contractStatus: 'prospective',
      tags: []
    })
  }

  const getTypeBadge = (type: Customer['type']) => {
    const typeMap = {
      corporate: { label: '法人', variant: 'default' as const },
      individual: { label: '個人', variant: 'secondary' as const },
      government: { label: '官公庁', variant: 'outline' as const },
    }
    return typeMap[type]
  }

  const getStatusBadge = (status: Customer['status']) => {
    const statusMap = {
      active: { label: '取引中', variant: 'default' as const },
      inactive: { label: '休止中', variant: 'secondary' as const },
      suspended: { label: '取引停止', variant: 'destructive' as const },
    }
    return statusMap[status]
  }

  const getContractBadge = (status: Customer['contractStatus']) => {
    const contractMap = {
      contracted: { label: '契約済', color: 'bg-green-500' },
      negotiating: { label: '商談中', color: 'bg-yellow-500' },
      prospective: { label: '見込み', color: 'bg-gray-500' },
    }
    return contractMap[status]
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">顧客管理</h1>
          <p className="text-muted-foreground">顧客情報の登録・編集・管理</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              顧客を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規顧客登録</DialogTitle>
              <DialogDescription>
                新しい顧客の情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <CustomerForm 
              formData={formData}
              setFormData={setFormData}
              industries={industries}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddCustomer}>登録</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">総顧客数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">登録済み顧客</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">取引中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">アクティブ顧客</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">契約済み</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.contractStatus === 'contracted').length}
            </div>
            <p className="text-xs text-muted-foreground">契約顧客</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">総取引額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{customers.reduce((sum, c) => sum + (c.totalTransactionAmount || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">累計取引額</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顧客一覧</CardTitle>
          <CardDescription>
            登録されている顧客情報を管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="会社名、顧客コード、担当者名、メールで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客コード</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>契約状況</TableHead>
                  <TableHead>取引状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono">{customer.customerCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.companyName}</div>
                        <div className="text-sm text-muted-foreground">{customer.industry}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadge(customer.type).variant}>
                        {getTypeBadge(customer.type).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{customer.contactPerson}</div>
                        {customer.department && (
                          <div className="text-xs text-muted-foreground">
                            {customer.department} {customer.position}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-1" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-[150px]">{customer.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getContractBadge(customer.contractStatus).color}`}>
                        {getContractBadge(customer.contractStatus).label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(customer.status).variant}>
                        {getStatusBadge(customer.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(customer)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCustomer(customer.id)}
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
            <DialogTitle>顧客情報編集</DialogTitle>
            <DialogDescription>
              顧客の情報を更新してください
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            formData={formData}
            setFormData={setFormData}
            industries={industries}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditCustomer}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Customer Form Component
function CustomerForm({ 
  formData, 
  setFormData, 
  industries 
}: {
  formData: Partial<Customer>
  setFormData: (data: Partial<Customer>) => void
  industries: string[]
}) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic">基本情報</TabsTrigger>
        <TabsTrigger value="contact">連絡先</TabsTrigger>
        <TabsTrigger value="company">会社情報</TabsTrigger>
        <TabsTrigger value="payment">支払情報</TabsTrigger>
        <TabsTrigger value="other">その他</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerCode">顧客コード</Label>
            <Input
              id="customerCode"
              value={formData.customerCode || ''}
              onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
              placeholder="CUST001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">種別</Label>
            <Select
              value={formData.type}
              onValueChange={(value: Customer['type']) => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="種別を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corporate">法人</SelectItem>
                <SelectItem value="individual">個人</SelectItem>
                <SelectItem value="government">官公庁</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">取引状態</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Customer['status']) => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="状態を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">取引中</SelectItem>
                <SelectItem value="inactive">休止中</SelectItem>
                <SelectItem value="suspended">取引停止</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">会社名/氏名</Label>
            <Input
              id="companyName"
              value={formData.companyName || ''}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="田中商事株式会社"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyNameKana">フリガナ</Label>
            <Input
              id="companyNameKana"
              value={formData.companyNameKana || ''}
              onChange={(e) => setFormData({ ...formData, companyNameKana: e.target.value })}
              placeholder="タナカショウジカブシキガイシャ"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">業種</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="業種を選択" />
              </SelectTrigger>
              <SelectContent>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractStatus">契約状況</Label>
            <Select
              value={formData.contractStatus}
              onValueChange={(value: Customer['contractStatus']) => 
                setFormData({ ...formData, contractStatus: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="契約状況を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracted">契約済</SelectItem>
                <SelectItem value="negotiating">商談中</SelectItem>
                <SelectItem value="prospective">見込み</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="contact" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPerson">担当者名</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson || ''}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="田中一郎"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPersonKana">担当者名カナ</Label>
            <Input
              id="contactPersonKana"
              value={formData.contactPersonKana || ''}
              onChange={(e) => setFormData({ ...formData, contactPersonKana: e.target.value })}
              placeholder="タナカイチロウ"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">部署</Label>
            <Input
              id="department"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="総務部"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">役職</Label>
            <Input
              id="position"
              value={formData.position || ''}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="部長"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tanaka@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="03-1234-5678"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fax">FAX</Label>
            <Input
              id="fax"
              value={formData.fax || ''}
              onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
              placeholder="03-1234-5679"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">郵便番号</Label>
            <Input
              id="postalCode"
              value={formData.postalCode || ''}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="150-0001"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">住所</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="東京都渋谷区神宮前1-2-3 田中ビル5F"
          />
        </div>
      </TabsContent>

      <TabsContent value="company" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">ウェブサイト</Label>
            <Input
              id="website"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="establishedDate">設立年月日</Label>
            <Input
              id="establishedDate"
              type="date"
              value={formData.establishedDate || ''}
              onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capitalAmount">資本金</Label>
            <Input
              id="capitalAmount"
              value={formData.capitalAmount || ''}
              onChange={(e) => setFormData({ ...formData, capitalAmount: e.target.value })}
              placeholder="5000万円"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeCount">従業員数</Label>
            <Input
              id="employeeCount"
              value={formData.employeeCount || ''}
              onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
              placeholder="150名"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiscalMonth">決算月</Label>
            <Select
              value={formData.fiscalMonth}
              onValueChange={(value) => setFormData({ ...formData, fiscalMonth: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="決算月を選択" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i} value={`${i + 1}月`}>
                    {i + 1}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="payment" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">支払条件</Label>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value: Customer['paymentTerms']) => 
                setFormData({ ...formData, paymentTerms: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="支払条件を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="transfer">振込</SelectItem>
                <SelectItem value="credit">クレジット</SelectItem>
                <SelectItem value="invoice">請求書</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDueDate">支払期日（締め日から）</Label>
            <Input
              id="paymentDueDate"
              type="number"
              value={formData.paymentDueDate || ''}
              onChange={(e) => setFormData({ ...formData, paymentDueDate: parseInt(e.target.value) })}
              placeholder="30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="creditLimit">与信限度額</Label>
            <Input
              id="creditLimit"
              type="number"
              value={formData.creditLimit || ''}
              onChange={(e) => setFormData({ ...formData, creditLimit: parseInt(e.target.value) })}
              placeholder="5000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxType">税区分</Label>
            <Select
              value={formData.taxType}
              onValueChange={(value: Customer['taxType']) => 
                setFormData({ ...formData, taxType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="税区分を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="include">内税</SelectItem>
                <SelectItem value="exclude">外税</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="other" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tags">タグ（カンマ区切り）</Label>
          <Input
            id="tags"
            value={formData.tags?.join(', ') || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
            })}
            placeholder="VIP, 定期契約, 大口"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">備考</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="特記事項があれば入力してください..."
            rows={4}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}