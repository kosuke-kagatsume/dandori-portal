'use client';

import type { WorkflowRequest } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, User, Calendar, Building2, UserCheck, AlertTriangle, type LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  getWorkflowTypeIcon, getStatusLabel, getStatusColor,
  getPriorityLabel, getPriorityColor, calculateProgress,
} from '@/lib/workflow/workflow-helpers';

interface WorkflowCardProps {
  request: WorkflowRequest;
  currentUserId: string;
  onApprove?: () => void;
  onReject?: () => void;
  onDelegate?: () => void;
  onDetail: () => void;
  isDelegated?: boolean;
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  showCheckbox?: boolean;
}

export function WorkflowCard({
  request, currentUserId, onApprove, onReject, onDelegate, onDetail,
  isDelegated = false, isSelected = false, onSelectChange, showCheckbox = false,
}: WorkflowCardProps) {
  const Icon = getWorkflowTypeIcon(request.type);
  const progress = calculateProgress(request);
  const currentStep = request.approvalSteps[request.currentStep];
  const canApprove = currentStep && (
    currentStep.approverId === currentUserId ||
    currentStep.delegatedTo?.id === currentUserId
  ) && currentStep.status === 'pending';

  return (
    <Card className={isSelected ? 'ring-2 ring-blue-500' : ''}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-4">
          <div className="flex gap-4 w-full lg:w-auto">
            {showCheckbox && (
              <Checkbox checked={isSelected} onCheckedChange={onSelectChange} className="mt-3" />
            )}
            <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{request.title}</h3>
                <Badge className={getPriorityColor(request.priority)}>{getPriorityLabel(request.priority)}</Badge>
                <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
                {isDelegated && <Badge className="bg-purple-100 text-purple-800">委任</Badge>}
                {request.status === 'escalated' && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />エスカレーション
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{request.requesterName}</span>
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{request.department}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(request.createdAt), 'MM/dd HH:mm', { locale: ja })}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">ステップ {request.currentStep + 1} / {request.approvalSteps.length}</span>
                  {currentStep && (
                    <span className="text-sm text-muted-foreground">
                      • 承認者: {currentStep.approverName}
                      {currentStep.delegatedTo && ` → ${currentStep.delegatedTo.name}`}
                    </span>
                  )}
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <Button variant="outline" size="sm" onClick={onDetail} className="w-full sm:w-auto">
              <Eye className="h-4 w-4 mr-1" />詳細
            </Button>
            {canApprove && onApprove && onReject && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" onClick={onApprove}>承認</Button>
                <Button size="sm" variant="outline" onClick={onReject} className="w-full sm:w-auto">却下</Button>
                {onDelegate && (
                  <Button size="sm" variant="outline" onClick={onDelegate} className="w-full sm:w-auto">
                    <UserCheck className="h-4 w-4 mr-1" />委任
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description }: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
