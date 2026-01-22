'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  Calendar,
  Building2,
  Award,
  BookOpen,
  Briefcase,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Send,
  Plus,
  Loader2,
} from 'lucide-react';
import { useUserStore, useTenantStore } from '@/lib/store';
import { toast } from 'sonner';

interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  expiryDate: string | null;
  status: string;
  documentUrl?: string;
  documentName?: string;
  documentSize?: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
}

interface Experience {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
  achievements: string[];
  skills: string[];
}

interface ProfileData {
  id: string;
  completedProjectsCount: number;
  teamMembersCount: number;
  yearsOfExperience: number;
  certifications: Certification[];
  skills: Skill[];
  experiences: Experience[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    avatar?: string;
    hireDate?: string;
  };
}

export default function ProfilePage() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // ダイアログ状態
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 変更申請フォーム
  const [changeRequest, setChangeRequest] = useState({
    field: '',
    newValue: '',
    reason: '',
  });

  // 資格追加フォーム
  const [newCertification, setNewCertification] = useState({
    name: '',
    organization: '',
    issueDate: '',
    expiryDate: '',
  });

  const tenantId = currentTenant?.id || 'tenant-1';
  const userId = currentUser?.id;

  // プロフィール取得
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/employee-profile?userId=${userId}&tenantId=${tenantId}`
        );
        const data = await response.json();

        if (data.success) {
          setProfile(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // デモデータをフォールバックとして設定
        setProfile({
          id: 'demo',
          completedProjectsCount: 47,
          teamMembersCount: 23,
          yearsOfExperience: 14,
          certifications: [
            {
              id: '1',
              name: '一級建築士',
              organization: '国土交通省',
              issueDate: '2015-04-01',
              expiryDate: '2025-03-31',
              status: 'active',
              documentName: '一級建築士免許証.pdf',
              documentSize: '1.2MB',
            },
            {
              id: '2',
              name: '建設業経理士1級',
              organization: '建設業振興基金',
              issueDate: '2018-09-01',
              expiryDate: '2024-08-31',
              status: 'expiring',
              documentName: '建設業経理士1級合格証明書.pdf',
              documentSize: '954.5KB',
            },
            {
              id: '3',
              name: '施工管理技士',
              organization: '国土交通省',
              issueDate: '2016-06-01',
              expiryDate: null,
              status: 'active',
            },
          ],
          skills: [
            { id: '1', name: 'AWS', level: 80, category: 'クラウド' },
            { id: '2', name: 'React', level: 90, category: 'フロントエンド' },
            { id: '3', name: 'Node.js', level: 75, category: 'バックエンド' },
            { id: '4', name: 'PostgreSQL', level: 70, category: 'データベース' },
          ],
          experiences: [
            {
              id: '1',
              position: '代表取締役',
              company: '株式会社ダンドリ',
              startDate: '2020-04-01',
              endDate: null,
              isCurrent: true,
              description: '全社戦略立案・事業推進・組織運営を統括。',
              achievements: ['売上30%増達成', '業務効率化40%向上'],
              skills: ['AWS', 'React', 'Node.js'],
            },
          ],
          user: {
            id: userId || '',
            name: currentUser?.name || 'システム管理者',
            email: currentUser?.email || 'admin@dandori.local',
            phone: '090-1234-5678',
            position: currentUser?.position || '代表取締役',
            department: currentUser?.department || '本社 経営企画室',
            avatar: currentUser?.avatar,
            hireDate: '2015-04-01',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, tenantId, currentUser]);

  // 変更申請を送信
  const handleSubmitChangeRequest = async () => {
    if (!changeRequest.field || !changeRequest.newValue) {
      toast.error('変更内容を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/employee-profile/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId,
          requestType: 'basic_info',
          fieldName: changeRequest.field,
          newValue: changeRequest.newValue,
          reason: changeRequest.reason,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('変更申請を送信しました。管理者の承認をお待ちください。');
        setChangeDialogOpen(false);
        setChangeRequest({ field: '', newValue: '', reason: '' });
      } else {
        toast.error(data.error || '変更申請の送信に失敗しました');
      }
    } catch {
      toast.error('変更申請の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // 資格追加申請を送信
  const handleSubmitCertification = async () => {
    if (!newCertification.name || !newCertification.organization || !newCertification.issueDate) {
      toast.error('必須項目を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/employee-profile/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId,
          requestType: 'certification',
          newValue: JSON.stringify(newCertification),
          reason: '資格追加申請',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('資格追加申請を送信しました。管理者の承認をお待ちください。');
        setCertDialogOpen(false);
        setNewCertification({ name: '', organization: '', issueDate: '', expiryDate: '' });
      } else {
        toast.error(data.error || '資格追加申請の送信に失敗しました');
      }
    } catch {
      toast.error('資格追加申請の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />有効</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />期限間近</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />期限切れ</Badge>;
      default:
        return null;
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const user = profile?.user || currentUser;
  const certifications = profile?.certifications || [];
  const skills = profile?.skills || [];
  const experiences = profile?.experiences || [];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="h-24 w-24 border-4 border-white">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-2xl bg-white text-blue-600">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{user?.name}</h1>
              <p className="text-base sm:text-lg opacity-90">{user?.position} / {user?.department}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-sm">
                <span className="flex items-center justify-center sm:justify-start">
                  <Mail className="w-4 h-4 mr-1" />
                  <span className="truncate">{user?.email}</span>
                </span>
                <span className="flex items-center justify-center sm:justify-start">
                  <Phone className="w-4 h-4 mr-1" />
                  {user?.phone || '未登録'}
                </span>
                <span className="flex items-center justify-center sm:justify-start">
                  <Calendar className="w-4 h-4 mr-1" />
                  入社日: {user?.hireDate || '未登録'}
                </span>
              </div>
            </div>
          </div>
          <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100">
                <Edit className="w-4 h-4 mr-2" />
                変更申請
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>従業員情報変更申請</DialogTitle>
                <DialogDescription>
                  変更したい情報を入力してください。管理者の承認後に反映されます。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>変更項目</Label>
                  <Select
                    value={changeRequest.field}
                    onValueChange={(value) => setChangeRequest(prev => ({ ...prev, field: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="変更する項目を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">電話番号</SelectItem>
                      <SelectItem value="address">住所</SelectItem>
                      <SelectItem value="emergency_contact">緊急連絡先</SelectItem>
                      <SelectItem value="bank_account">銀行口座</SelectItem>
                      <SelectItem value="commute_route">通勤経路</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newValue">変更後の値</Label>
                  <Input
                    id="newValue"
                    value={changeRequest.newValue}
                    onChange={(e) => setChangeRequest(prev => ({ ...prev, newValue: e.target.value }))}
                    placeholder="新しい情報を入力"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">変更理由（任意）</Label>
                  <Textarea
                    id="reason"
                    value={changeRequest.reason}
                    onChange={(e) => setChangeRequest(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="引っ越し、結婚など"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setChangeDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSubmitChangeRequest} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  申請する
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              完了プロジェクト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.completedProjectsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              チームメンバー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.teamMembersCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              年間経験
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.yearsOfExperience || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              資格・認定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certifications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="certifications" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="certifications" className="flex items-center gap-1 sm:gap-2">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">資格・免許・認定</span>
            <span className="sm:hidden">資格</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-1 sm:gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">スキル・専門性</span>
            <span className="sm:hidden">スキル</span>
          </TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center gap-1 sm:gap-2">
            <Briefcase className="w-4 h-4" />
            <span>経歴</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-1 sm:gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">実績・成果</span>
            <span className="sm:hidden">実績</span>
          </TabsTrigger>
        </TabsList>

        {/* 資格・免許・認定タブ */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>資格・免許・認定</CardTitle>
                  <CardDescription>
                    {certifications.filter(c => c.status === 'expiring').length > 0 && (
                      <>
                        <AlertCircle className="inline w-4 h-4 mr-1 text-yellow-500" />
                        {certifications.filter(c => c.status === 'expiring').length}件の資格・免許が3ヶ月以内に更新期限を迎えます
                      </>
                    )}
                  </CardDescription>
                </div>
                <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      資格追加申請
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>資格追加申請</DialogTitle>
                      <DialogDescription>
                        取得した資格を申請してください。管理者の承認後に登録されます。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="certName">資格名 *</Label>
                        <Input
                          id="certName"
                          value={newCertification.name}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="例: 一級建築士"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="certOrg">発行機関 *</Label>
                        <Input
                          id="certOrg"
                          value={newCertification.organization}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, organization: e.target.value }))}
                          placeholder="例: 国土交通省"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="issueDate">取得日 *</Label>
                          <Input
                            id="issueDate"
                            type="date"
                            value={newCertification.issueDate}
                            onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">有効期限</Label>
                          <Input
                            id="expiryDate"
                            type="date"
                            value={newCertification.expiryDate}
                            onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCertDialogOpen(false)}>
                        キャンセル
                      </Button>
                      <Button onClick={handleSubmitCertification} disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        申請する
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certifications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">登録された資格はありません</p>
                ) : (
                  certifications.map((cert) => {
                    const daysUntilExpiry = calculateDaysUntilExpiry(cert.expiryDate);
                    return (
                      <div key={cert.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              {cert.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{cert.organization}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                取得: {cert.issueDate}
                              </span>
                              {cert.expiryDate && (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  更新期限: {cert.expiryDate}
                                  {daysUntilExpiry && daysUntilExpiry > 0 && daysUntilExpiry < 90 && (
                                    <span className="ml-1 text-yellow-600">
                                      （あと{daysUntilExpiry}日）
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(cert.status)}
                        </div>
                        {cert.documentName && (
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2">
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span>{cert.documentName}</span>
                              {cert.documentSize && <span className="text-gray-500">({cert.documentSize})</span>}
                            </div>
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* スキル・専門性タブ */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>スキル・専門性</CardTitle>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  スキル追加申請
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">登録されたスキルはありません</p>
              ) : (
                <div className="space-y-6">
                  {skills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.name}</span>
                          <Badge variant="secondary">{skill.category}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{skill.level}%</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 経歴タブ */}
        <TabsContent value="experience" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>経歴</CardTitle>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  経歴追加申請
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {experiences.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">登録された経歴はありません</p>
              ) : (
                <div className="space-y-6">
                  {experiences.map((exp, index) => (
                    <div key={exp.id} className="relative">
                      {index !== experiences.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{exp.position}</h3>
                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                            </div>
                            <Badge variant="outline">
                              {new Date(exp.startDate).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' })}
                              {' - '}
                              {exp.isCurrent ? '現在' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }) : ''}
                            </Badge>
                          </div>
                          {exp.description && <p className="text-sm">{exp.description}</p>}
                          {exp.achievements.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">主な成果:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {exp.achievements.map((achievement, i) => (
                                  <li key={i}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {exp.skills.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {exp.skills.map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 実績・成果タブ */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>実績・成果</CardTitle>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  実績追加申請
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                実績・成果の詳細は準備中です
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
