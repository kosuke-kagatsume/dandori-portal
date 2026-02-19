'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyAvatar } from '@/components/ui/lazy-avatar';
import {
  MapPin,
  Home,
  Plane,
  GraduationCap,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import Link from 'next/link';

interface MemberCardProps {
  member: User & {
    currentStatus: 'present' | 'remote' | 'business_trip' | 'training' | 'absent' | 'not_checked_in';
    workLocation?: string;
    lastActivity?: string;
    workingTime?: string;
    employeeNumber?: string;
  };
}

const statusConfig = {
  present: {
    label: '出社',
    icon: MapPin,
    variant: 'default' as const,
    bgClass: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    iconClass: 'text-green-600',
  },
  remote: {
    label: '在宅',
    icon: Home,
    variant: 'secondary' as const,
    bgClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    iconClass: 'text-blue-600',
  },
  business_trip: {
    label: '出張',
    icon: Plane,
    variant: 'outline' as const,
    bgClass: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
    iconClass: 'text-purple-600',
  },
  training: {
    label: '研修',
    icon: GraduationCap,
    variant: 'outline' as const,
    bgClass: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    iconClass: 'text-orange-600',
  },
  absent: {
    label: '休暇',
    icon: Clock,
    variant: 'secondary' as const,
    bgClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    iconClass: 'text-gray-600',
  },
  not_checked_in: {
    label: '未出勤',
    icon: Clock,
    variant: 'outline' as const,
    bgClass: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    iconClass: 'text-red-600',
  },
};

export function MemberCard({ member }: MemberCardProps) {
  // ステータスのマッピング（DBの値をUIの値に変換）
  const normalizeStatus = (status: string): keyof typeof statusConfig => {
    const statusMap: Record<string, keyof typeof statusConfig> = {
      'present': 'present',
      'office': 'present',  // officeはpresentとして表示
      'remote': 'remote',
      'wfh': 'remote',      // work from home
      'business_trip': 'business_trip',
      'trip': 'business_trip',
      'training': 'training',
      'absent': 'absent',
      'leave': 'absent',    // leaveはabsentとして表示
      'vacation': 'absent',
      'not_checked_in': 'not_checked_in',
    };
    return statusMap[status] || 'not_checked_in';
  };

  const normalizedStatus = normalizeStatus(member.currentStatus);
  const config = statusConfig[normalizedStatus];
  const StatusIcon = config.icon;

  return (
    <Link href={`/ja/users/${member.id}`}>
      <Card className={cn('transition-all hover:shadow-md cursor-pointer', config.bgClass)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="relative">
            <LazyAvatar
              src={member.avatar}
              alt={member.name}
              fallback={member.name.charAt(0)}
              className="h-10 w-10"
            />
            {member.currentStatus === 'present' && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <CheckCircle className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm truncate">{member.name}</h3>
              <Badge variant={config.variant} className="ml-2">
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              {member.employeeNumber && (
                <p>社員番号：{member.employeeNumber}</p>
              )}
              <p>{member.department}</p>
              <p>{member.position}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}