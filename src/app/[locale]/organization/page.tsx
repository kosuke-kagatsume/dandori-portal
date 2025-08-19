'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  UserPlus,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrgUnit {
  id: string;
  name: string;
  type: 'company' | 'division' | 'department' | 'team';
  headUserId?: string;
  headUserName?: string;
  memberCount: number;
  children?: OrgUnit[];
  expanded?: boolean;
}

export default function OrganizationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orgData, setOrgData] = useState<OrgUnit[]>([
    {
      id: '1',
      name: '株式会社ダンドリ',
      type: 'company',
      headUserId: '1',
      headUserName: '山田太郎',
      memberCount: 50,
      expanded: true,
      children: [
        {
          id: '2',
          name: '経営企画室',
          type: 'division',
          headUserId: '2',
          headUserName: '佐藤花子',
          memberCount: 3,
          expanded: false
        },
        {
          id: '3',
          name: '営業本部',
          type: 'division',
          headUserId: '3',
          headUserName: '鈴木一郎',
          memberCount: 15,
          expanded: true,
          children: [
            {
              id: '4',
              name: '第一営業部',
              type: 'department',
              headUserId: '4',
              headUserName: '田中次郎',
              memberCount: 8
            },
            {
              id: '5',
              name: '第二営業部',
              type: 'department',
              headUserId: '5',
              headUserName: '高橋美香',
              memberCount: 7
            }
          ]
        },
        {
          id: '6',
          name: '開発本部',
          type: 'division',
          headUserId: '6',
          headUserName: '渡辺健太',
          memberCount: 20,
          expanded: true,
          children: [
            {
              id: '7',
              name: 'プロダクト開発部',
              type: 'department',
              headUserId: '7',
              headUserName: '伊藤真一',
              memberCount: 15,
              expanded: false,
              children: [
                {
                  id: '8',
                  name: 'フロントエンドチーム',
                  type: 'team',
                  headUserId: '8',
                  headUserName: '山口恵子',
                  memberCount: 6
                },
                {
                  id: '9',
                  name: 'バックエンドチーム',
                  type: 'team',
                  headUserId: '9',
                  headUserName: '小林大輔',
                  memberCount: 5
                },
                {
                  id: '10',
                  name: 'インフラチーム',
                  type: 'team',
                  headUserId: '10',
                  headUserName: '松本雄太',
                  memberCount: 4
                }
              ]
            },
            {
              id: '11',
              name: 'QA部',
              type: 'department',
              headUserId: '11',
              headUserName: '加藤美咲',
              memberCount: 5
            }
          ]
        },
        {
          id: '12',
          name: '管理本部',
          type: 'division',
          headUserId: '12',
          headUserName: '中村裕子',
          memberCount: 12,
          expanded: false,
          children: [
            {
              id: '13',
              name: '人事部',
              type: 'department',
              headUserId: '13',
              headUserName: '青木健二',
              memberCount: 5
            },
            {
              id: '14',
              name: '経理部',
              type: 'department',
              headUserId: '14',
              headUserName: '森田香織',
              memberCount: 4
            },
            {
              id: '15',
              name: '総務部',
              type: 'department',
              headUserId: '15',
              headUserName: '石井孝明',
              memberCount: 3
            }
          ]
        }
      ]
    }
  ]);

  const toggleExpand = (id: string) => {
    const toggleNode = (nodes: OrgUnit[]): OrgUnit[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setOrgData(toggleNode(orgData));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company':
        return 'bg-purple-100 text-purple-800';
      case 'division':
        return 'bg-blue-100 text-blue-800';
      case 'department':
        return 'bg-green-100 text-green-800';
      case 'team':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'company':
        return '会社';
      case 'division':
        return '本部';
      case 'department':
        return '部署';
      case 'team':
        return 'チーム';
      default:
        return type;
    }
  };

  const renderOrgTree = (nodes: OrgUnit[], level = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div 
          className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer ${level > 0 ? `ml-${level * 8}` : ''}`}
          style={{ marginLeft: `${level * 2}rem` }}
        >
          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {node.children && node.children.length > 0 ? (
                node.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="w-4" />
              )}
            </button>
            <Building2 className="w-5 h-5 text-gray-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{node.name}</span>
                <Badge className={getTypeColor(node.type)} variant="secondary">
                  {getTypeLabel(node.type)}
                </Badge>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {node.memberCount}名
                </Badge>
              </div>
              {node.headUserName && (
                <p className="text-sm text-muted-foreground">
                  責任者: {node.headUserName}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="w-4 h-4 mr-2" />
                メンバー追加
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="w-4 h-4 mr-2" />
                下位組織追加
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {node.expanded && node.children && renderOrgTree(node.children, level + 1)}
      </div>
    ));
  };

  // 統計データ
  const stats = {
    totalEmployees: 50,
    divisions: 4,
    departments: 8,
    teams: 3
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">組織管理</h1>
        <p className="text-muted-foreground">
          組織構造の管理と編集を行います
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総従業員数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">+12 先月比</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本部数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.divisions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              部署数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              チーム数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams}</div>
          </CardContent>
        </Card>
      </div>

      {/* 組織ツリー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>組織構造</CardTitle>
              <CardDescription>
                組織階層とメンバー数を表示しています
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="組織を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                組織追加
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {renderOrgTree(orgData)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}