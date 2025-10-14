'use client';

import { useEffect, useState } from 'react';
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
  BarChart3,
  TreePine,
  List,
  Search,
  Plus,
  Settings
} from 'lucide-react';
import { OrganizationChart } from '@/components/organization/organization-chart';
import { UserManagementPanel } from '@/components/organization/user-management-panel';
import { PermissionManagementPanel } from '@/components/organization/permission-management-panel';
import { TransferHistoryPanel } from '@/components/organization/transfer-history-panel';
import { AddTransferDialog } from '@/components/organization/add-transfer-dialog';
import { useOrganizationStore } from '@/lib/store/organization-store';
import { useUserStore } from '@/lib/store';
import { demoOrganizationTree, demoMembers } from '@/lib/demo-organization';
import { hasPermission } from '@/lib/demo-users';
import type { OrganizationNode, OrganizationMember } from '@/types';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const { currentDemoUser } = useUserStore();
  
  const {
    organizationTree,
    allMembers,
    selectedMember,
    selectedNode,
    viewMode,
    setOrganizationTree,
    setSelectedMember,
    setSelectedNode,
    setViewMode,
    addMember,
    updateMember,
    removeMember
  } = useOrganizationStore();

  // 初期データの設定
  useEffect(() => {
    if (!organizationTree) {
      setOrganizationTree(demoOrganizationTree);
    }
  }, [organizationTree, setOrganizationTree]);

  // 権限チェック
  const canManageOrganization = currentDemoUser && hasPermission(currentDemoUser, 'manage_system');
  const canViewAll = currentDemoUser && (
    hasPermission(currentDemoUser, 'view_all') || 
    hasPermission(currentDemoUser, 'manage_system')
  );

  // 組織統計の計算
  const organizationStats = {
    totalMembers: allMembers.length || demoMembers.length,
    activeMembers: (allMembers.length ? allMembers : demoMembers).filter(m => m.status === 'active').length,
    managers: (allMembers.length ? allMembers : demoMembers).filter(m => m.isManager).length,
    departments: organizationTree ? countNodes(organizationTree, 'department') : 3
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">組織管理</h1>
          <p className="text-muted-foreground mt-1">
            組織構造とメンバーの管理、権限設定を行います
          </p>
        </div>
        
        {canManageOrganization && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規追加
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-sm font-medium text-muted-foreground">部門数</p>
              <p className="text-2xl font-bold">{organizationStats.departments}</p>
            </div>
            <Building2 className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">組織図</TabsTrigger>
          <TabsTrigger value="members">メンバー管理</TabsTrigger>
          <TabsTrigger value="transfers">異動履歴</TabsTrigger>
          <TabsTrigger value="permissions" disabled={!canManageOrganization}>
            権限管理
          </TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {organizationTree ? (
                <OrganizationChart
                  data={organizationTree}
                  viewMode={viewMode}
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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

        {/* メンバー管理タブ */}
        <TabsContent value="members">
          <UserManagementPanel
            members={allMembers.length ? allMembers : demoMembers}
            organizationNodes={organizationTree ? [organizationTree] : []}
            onMemberAdd={canManageOrganization ? handleMemberAdd : undefined}
            onMemberUpdate={canManageOrganization ? handleMemberUpdate : undefined}
            onMemberRemove={canManageOrganization ? handleMemberRemove : undefined}
            selectedMemberId={selectedMember?.id}
          />
        </TabsContent>

        {/* 異動履歴タブ */}
        <TabsContent value="transfers">
          <TransferHistoryPanel
            onAddTransfer={canManageOrganization ? () => setTransferDialogOpen(true) : undefined}
          />
        </TabsContent>

        {/* 権限管理タブ */}
        <TabsContent value="permissions">
          {canManageOrganization ? (
            <PermissionManagementPanel
              members={allMembers.length ? allMembers : demoMembers}
              onMemberPermissionUpdate={(memberId, permissions) => {
                console.log('Update permissions for member:', memberId, permissions);
              }}
              onRoleUpdate={(roleId, permissions) => {
                console.log('Update role permissions:', roleId, permissions);
              }}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">権限管理にはシステム管理者権限が必要です</h3>
                <p className="text-muted-foreground text-center">
                  この機能にアクセスするには、システム管理者権限が必要です。
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 分析タブ */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>部門別メンバー数</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">技術部門</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                      <span className="text-sm font-medium">10人</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ビジネス部門</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }} />
                      </div>
                      <span className="text-sm font-medium">5人</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">人事部</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '18%' }} />
                      </div>
                      <span className="text-sm font-medium">3人</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>権限レベル分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">システム管理者</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800">2人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">人事</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">3人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">マネージャー</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">5人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">一般社員</span>
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">8人</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 異動登録ダイアログ */}
      <AddTransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
      />
    </div>
  );
}