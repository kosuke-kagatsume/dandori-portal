'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Building2,
  MapPin,
  Award,
  BookOpen,
  Briefcase,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { AvatarUploadButton } from '@/features/profile/avatar-upload-button';

export default function ProfilePage() {
  const { currentUser, updateUser } = useUserStore();
  
  // 資格・免許データ（モック）
  const certifications = [
    {
      id: '1',
      name: '一級建築士',
      organization: '国土交通省',
      issueDate: '2015-04-01',
      expiryDate: '2025-03-31',
      status: 'active',
      document: '一級建築士免許証.pdf',
      fileSize: '1.2MB'
    },
    {
      id: '2',
      name: '建設業経理士1級',
      organization: '建設業振興基金',
      issueDate: '2018-09-01',
      expiryDate: '2024-08-31',
      status: 'expiring',
      document: '建設業経理士1級合格証明書.pdf',
      fileSize: '954.5KB'
    },
    {
      id: '3',
      name: '施工管理技士',
      organization: '国土交通省',
      issueDate: '2016-06-01',
      expiryDate: null,
      status: 'active'
    },
    {
      id: '4',
      name: 'PMP (Project Management Professional)',
      organization: 'PMI',
      issueDate: '2019-06-01',
      expiryDate: '2024-05-31',
      status: 'expired'
    }
  ];

  // スキル・専門性データ
  const skills = [
    { name: 'AWS', level: 80, category: 'クラウド' },
    { name: 'React', level: 90, category: 'フロントエンド' },
    { name: 'Node.js', level: 75, category: 'バックエンド' },
    { name: 'PostgreSQL', level: 70, category: 'データベース' },
    { name: 'Tableau', level: 60, category: 'BI' },
    { name: 'Salesforce', level: 65, category: 'CRM' },
    { name: 'Google Analytics', level: 85, category: 'マーケティング' }
  ];

  // 経歴データ
  const experience = [
    {
      id: '1',
      position: '代表取締役',
      company: '株式会社ダンドリ',
      period: '2020/04 - 現在',
      description: '全社戦略立案・事業推進・組織運営を統括。デジタル変革プロジェクトをリード。',
      achievements: [
        '売上30%増達成',
        '業務効率化40%向上',
        '新サービス3件立ち上げ'
      ],
      tags: ['AWS', 'React', 'Node.js', 'PostgreSQL']
    },
    {
      id: '2',
      position: '部長',
      company: 'ABC商事株式会社',
      period: '2015/04 - 2020/03',
      description: '営業企画部門を統括。新規事業開発・マーケティング戦略を担当。',
      achievements: [
        '新規顧客開拓200社',
        'マーケティングROI 150%向上',
        'チーム規模倍増'
      ],
      tags: ['Salesforce', 'Tableau', 'Google Analytics']
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />有効</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />期限切れ</Badge>;
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

  const handleAvatarUpload = (url: string) => {
    if (currentUser?.id) {
      updateUser(currentUser.id, { avatar: url });
    }
  };

  const handleAvatarUploadError = (error: string) => {
    console.error('Avatar upload error:', error);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="text-2xl bg-white text-blue-600">
                  {currentUser?.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                {currentUser?.id && (
                  <AvatarUploadButton
                    userId={currentUser.id}
                    onUploadSuccess={handleAvatarUpload}
                    onUploadError={handleAvatarUploadError}
                  />
                )}
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentUser?.name || '山田太郎'}</h1>
              <p className="text-lg opacity-90">代表取締役 / 本社 経営企画室</p>
              <div className="flex items-center space-x-4 mt-3 text-sm">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {currentUser?.email || 'admin@demo.com'}
                </span>
                <span className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  090-1234-5678
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  入社日: 2015-04-01
                </span>
              </div>
            </div>
          </div>
          <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
            管理者
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              完了プロジェクト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              チームメンバー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              年間経験
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              資格・認定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="certifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certifications" className="flex items-center">
            <Award className="w-4 h-4 mr-2" />
            資格・免許・認定
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            スキル・専門性
          </TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            経歴
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            実績・成果
          </TabsTrigger>
        </TabsList>

        {/* 資格・免許・認定タブ */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>資格・免許・認定</CardTitle>
              <CardDescription>
                <AlertCircle className="inline w-4 h-4 mr-1 text-yellow-500" />
                1件の資格・免許が3ヶ月以内に更新期限を迎えます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certifications.map((cert) => {
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
                                {daysUntilExpiry && daysUntilExpiry < 90 && (
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
                      {cert.document && (
                        <div className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>{cert.document}</span>
                            <span className="text-gray-500">({cert.fileSize})</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                            {cert.status === 'expiring' && (
                              <Button size="sm" variant="outline" className="text-yellow-600">
                                承認待ち
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* スキル・専門性タブ */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>スキル・専門性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {skills.map((skill) => (
                  <div key={skill.name} className="space-y-2">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* 経歴タブ */}
        <TabsContent value="experience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>経歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {experience.map((exp, index) => (
                  <div key={exp.id} className="relative">
                    {index !== experience.length - 1 && (
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
                          <Badge variant="outline">{exp.period}</Badge>
                        </div>
                        <p className="text-sm">{exp.description}</p>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">主な成果:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {exp.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 実績・成果タブ */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>実績・成果</CardTitle>
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