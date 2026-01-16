'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Building2, 
  UserCheck,
  Mail,
  // Calendar, // 日付表示で使用予定
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrganizationNode, OrganizationMember } from '@/types';

interface OrganizationChartProps {
  data: OrganizationNode;
  viewMode?: 'tree' | 'list';
  onMemberSelect?: (member: OrganizationMember) => void;
  onNodeSelect?: (node: OrganizationNode) => void;
  selectedMemberId?: string;
  selectedNodeId?: string;
}

export function OrganizationChart({
  data,
  viewMode = 'tree',
  onMemberSelect,
  onNodeSelect,
  selectedMemberId,
  selectedNodeId
}: OrganizationChartProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([data.id]));

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeTypeIcon = (type: OrganizationNode['type']) => {
    switch (type) {
      case 'company':
        return <Building2 className="h-4 w-4" />;
      case 'division':
        return <Users className="h-4 w-4" />;
      case 'department':
        return <UserCheck className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: OrganizationMember['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hr':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'employee':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatMemberRole = (role: OrganizationMember['role']) => {
    switch (role) {
      case 'admin':
        return 'システム管理者';
      case 'hr':
        return '人事';
      case 'manager':
        return 'マネージャー';
      case 'employee':
        return '社員';
    }
  };

  const renderMember = (member: OrganizationMember) => (
    <div
      key={member.id}
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
        selectedMemberId === member.id 
          ? 'bg-blue-50 border-blue-200' 
          : 'hover:bg-gray-50',
        member.status !== 'active' && 'opacity-50'
      )}
      onClick={() => onMemberSelect?.(member)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={member.avatar} alt={member.name} />
        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-sm truncate">{member.name}</p>
          {member.isManager && (
            <Badge variant="outline" className="text-xs">
              責任者
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{member.position}</p>
        <div className="flex items-center space-x-1 mt-1">
          <Badge 
            variant="outline" 
            className={cn('text-xs', getRoleColor(member.role))}
          >
            {formatMemberRole(member.role)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            • {new Date(member.joinDate).getFullYear()}年入社
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`mailto:${member.email}`);
          }}
        >
          <Mail className="h-3 w-3" />
        </Button>
        <div className={cn(
          'w-2 h-2 rounded-full',
          member.status === 'active' ? 'bg-green-500' : 
          member.status === 'leave' ? 'bg-red-500' : 'bg-gray-400'
        )} />
      </div>
    </div>
  );

  const renderNode = (node: OrganizationNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.id} className={cn("w-full", depth > 0 && "ml-6")}>
        {/* Node Header */}
        <Card 
          className={cn(
            'mb-2 transition-colors cursor-pointer',
            selectedNodeId === node.id ? 'ring-2 ring-blue-500' : ''
          )}
          onClick={() => onNodeSelect?.(node)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(node.id);
                    }}
                    className="p-0 h-6 w-6"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-6" />
                )}
                
                {getNodeTypeIcon(node.type)}
                
                <div>
                  <h3 className="font-semibold text-lg">{node.name}</h3>
                  {node.description && (
                    <p className="text-sm text-muted-foreground">{node.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {node.memberCount}人
                </Badge>
                <Badge variant="outline">
                  レベル {node.level}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          {/* Members */}
          {node.members.length > 0 && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {node.headMember && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      責任者
                    </h4>
                    {renderMember(node.headMember)}
                  </div>
                )}
                
                {node.members.filter(m => m.id !== node.headMember?.id).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      メンバー ({node.members.filter(m => m.id !== node.headMember?.id).length}人)
                    </h4>
                    <div className="grid gap-2">
                      {node.members
                        .filter(m => m.id !== node.headMember?.id)
                        .map(renderMember)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
        
        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="space-y-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'list') {
    const flattenNodes = (node: OrganizationNode): OrganizationNode[] => {
      return [node, ...node.children.flatMap(flattenNodes)];
    };

    const allNodes = flattenNodes(data);

    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {allNodes.map(node => (
            <div key={node.id}>
              {renderNode(node, 0)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="organization-chart">
      {renderNode(data)}
    </div>
  );
}