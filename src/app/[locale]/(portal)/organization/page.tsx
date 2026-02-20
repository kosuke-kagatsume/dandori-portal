'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Users,
  Shield,
  // BarChart3, // 分析タブ削除に伴い未使用
  TreePine,
  List,
  Download,
  // Search, // 検索機能で使用予定
  // Plus, // ヘッダーの追加ボタン削除に伴い未使用
  // Settings, // 設定ボタンで使用予定
} from 'lucide-react';
import { OrganizationChart } from '@/components/organization/organization-chart';
import { UserManagementPanel } from '@/components/organization/user-management-panel';
import { TransferHistoryPanel } from '@/components/organization/transfer-history-panel';
import { DepartmentManagementPanel } from '@/components/organization/department-management-panel';
// import { AddTransferDialog } from '@/components/organization/add-transfer-dialog'; // 異動登録ボタン削除に伴い未使用
import { useOrganizationStore, type ChartTemplateType } from '@/lib/store/organization-store';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUserStore } from '@/lib/store';
import { hasPermission as hasRbacPermission, type UserRole } from '@/lib/rbac';
import type { OrganizationNode, OrganizationMember } from '@/types';
import { Loader2 } from 'lucide-react';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentUser } = useUserStore();
  
  const {
    organizationTree,
    allMembers,
    selectedMember,
    selectedNode,
    viewMode,
    templateType,
    isLoading,
    error,
    fetchOrganization,
    setSelectedMember,
    setSelectedNode,
    setViewMode,
    setTemplateType,
    addMember,
    updateMember,
    removeMember,
  } = useOrganizationStore();

  // 組織図のコンテナへのref
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // PDF出力機能
  const exportToPDF = useCallback(async () => {
    if (!chartContainerRef.current || !organizationTree) return;

    setIsExporting(true);
    try {
      // html2canvasで組織図をキャプチャ
      const canvas = await html2canvas(chartContainerRef.current, {
        scale: 2, // 高解像度
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // PDFを作成
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 画像をPDFに収まるようにスケーリング
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // 上部余白

      // タイトルを追加
      pdf.setFontSize(16);
      pdf.text('組織図', pdfWidth / 2, 15, { align: 'center' });

      // 画像を追加
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', imgX, imgY + 10, imgWidth * ratio * 0.95, imgHeight * ratio * 0.95);

      // 日時を追加
      const now = new Date();
      pdf.setFontSize(8);
      pdf.text(`出力日時: ${now.toLocaleString('ja-JP')}`, pdfWidth - 10, pdfHeight - 5, { align: 'right' });

      // ダウンロード
      const fileName = `組織図_${now.toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF出力エラー:', error);
    } finally {
      setIsExporting(false);
    }
  }, [organizationTree]);

  // APIから組織データを取得
  useEffect(() => {
    // Zustand persistのhydration
    useOrganizationStore.persist.rehydrate();
    // APIから組織データを取得
    fetchOrganization();
  }, [fetchOrganization]);

  // 権限チェック
  const getUserRole = (): UserRole | null => {
    if (currentUser?.roles && currentUser.roles.length > 0) {
      return currentUser.roles[0] as UserRole;
    }
    return null;
  };

  const userRole = getUserRole();
  const canManageOrganization = userRole && hasRbacPermission(userRole, 'organization:write');
  const canViewAll = userRole && hasRbacPermission(userRole, 'organization:read');

  // 組織統計の計算
  const organizationStats = {
    totalMembers: allMembers.length,
    activeMembers: allMembers.filter(m => m.status === 'active').length,
    managers: allMembers.filter(m => m.isManager).length,
    departments: organizationTree ? countNodes(organizationTree, 'department') : 0
  };

  function countNodes(node: OrganizationNode, type?: string): number {
    let count = type ? (node.type === type ? 1 : 0) : 1;
    for (const child of node.children) {
      count += countNodes(child, type);
    }
    return count;
  }

  const handleMemberSelect = (member: OrganizationMember) => {
    setSelectedMember(member);
  };

  const handleNodeSelect = (node: OrganizationNode) => {
    setSelectedNode(node);
  };

  const handleMemberAdd = (newMemberData: Omit<OrganizationMember, 'id'>) => {
    const newMember: OrganizationMember = {
      ...newMemberData,
      id: `member-${Date.now()}`
    };
    
    // デフォルトでは会社のルートに追加
    addMember('company', newMember);
  };

  const handleMemberUpdate = (memberId: string, updates: Partial<OrganizationMember>) => {
    updateMember(memberId, updates);
  };

  const handleMemberRemove = (memberId: string) => {
    removeMember(memberId);
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">組織データを読み込んでいます...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => fetchOrganization()}>再読み込み</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewAll) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">アクセス権限が必要です</h2>
            <p className="text-muted-foreground text-center">
              組織管理機能を利用するには適切な権限が必要です。<br />
              システム管理者にお問い合わせください。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">組織管理</h1>
          <p className="text-muted-foreground mt-1">
            組織構造とメンバーの管理、権限設定を行います
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">総メンバー数</p>
              <p className="text-2xl font-bold">{organizationStats.totalMembers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">在職中</p>
              <p className="text-2xl font-bold">{organizationStats.activeMembers}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {Math.round((organizationStats.activeMembers / organizationStats.totalMembers) * 100)}%
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">管理職</p>
              <p className="text-2xl font-bold">{organizationStats.managers}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">部署数</p>
              <p className="text-2xl font-bold">{organizationStats.departments}</p>
            </div>
            <Building2 className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">組織図</TabsTrigger>
          <TabsTrigger value="departments">部門管理</TabsTrigger>
          <TabsTrigger value="members">メンバー</TabsTrigger>
          <TabsTrigger value="transfers">異動</TabsTrigger>
        </TabsList>

        {/* 組織図タブ */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <TreePine className="h-5 w-5" />
                  <span>組織構造</span>
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  {/* テンプレートタイプ選択 */}
                  <Select value={templateType} onValueChange={(value: ChartTemplateType) => setTemplateType(value)}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="テンプレート選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pyramid-with-names">
                        ピラミッド（名前あり）
                      </SelectItem>
                      <SelectItem value="pyramid-without-names">
                        ピラミッド（名前なし）
                      </SelectItem>
                      <SelectItem value="horizontal-with-names">
                        横並び（名前あり）
                      </SelectItem>
                      <SelectItem value="horizontal-without-names">
                        横並び（名前なし）
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {/* 表示モード選択 */}
                  <Select value={viewMode} onValueChange={(value: 'tree' | 'list') => setViewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tree">
                        <div className="flex items-center space-x-2">
                          <TreePine className="h-4 w-4" />
                          <span>ツリー</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="list">
                        <div className="flex items-center space-x-2">
                          <List className="h-4 w-4" />
                          <span>リスト</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {/* PDF出力ボタン */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    disabled={isExporting || !organizationTree}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>{isExporting ? '出力中...' : 'PDF出力'}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={chartContainerRef}>
                {organizationTree ? (
                  <OrganizationChart
                    data={organizationTree}
                    viewMode={viewMode}
                    templateType={templateType}
                    onMemberSelect={handleMemberSelect}
                    onNodeSelect={handleNodeSelect}
                    selectedMemberId={selectedMember?.id}
                    selectedNodeId={selectedNode?.id}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">組織データを読み込んでいます...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 選択されたメンバーまたはノードの詳細 */}
          {(selectedMember || selectedNode) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedMember ? 'メンバー詳細' : 'ノード詳細'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMember ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">氏名</p>
                      <p className="font-medium">{selectedMember.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">メール</p>
                      <p className="font-medium">{selectedMember.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">役職</p>
                      <p className="font-medium">{selectedMember.position}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">入社日</p>
                      <p className="font-medium">
                        {new Date(selectedMember.joinDate).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ) : selectedNode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">組織名</p>
                      <p className="font-medium">{selectedNode.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">タイプ</p>
                      <p className="font-medium">{selectedNode.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">メンバー数</p>
                      <p className="font-medium">{selectedNode.memberCount}人</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">レベル</p>
                      <p className="font-medium">{selectedNode.level}</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 部門管理タブ */}
        <TabsContent value="departments">
          <DepartmentManagementPanel canEdit={!!canManageOrganization} />
        </TabsContent>

        {/* メンバー管理タブ */}
        <TabsContent value="members">
          <UserManagementPanel
            members={allMembers}
            organizationNodes={organizationTree ? [organizationTree] : []}
            onMemberAdd={canManageOrganization ? handleMemberAdd : undefined}
            onMemberUpdate={canManageOrganization ? handleMemberUpdate : undefined}
            onMemberRemove={canManageOrganization ? handleMemberRemove : undefined}
            selectedMemberId={selectedMember?.id}
          />
        </TabsContent>

        {/* 異動履歴タブ */}
        <TabsContent value="transfers">
          <TransferHistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}