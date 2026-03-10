'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface FollowUpFiltersProps {
  searchQuery: string;
  filterDepartment: string;
  filterStatus?: string;
  departments: string[];
  onSearchQueryChange: (query: string) => void;
  onFilterDepartmentChange: (dept: string) => void;
  onFilterStatusChange?: (status: string) => void;
}

export function FollowUpFilters({
  searchQuery,
  filterDepartment,
  filterStatus = 'all',
  departments,
  onSearchQueryChange,
  onFilterDepartmentChange,
  onFilterStatusChange,
}: FollowUpFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="氏名・部署で検索..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={filterDepartment} onValueChange={onFilterDepartmentChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="部署" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての部署</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onFilterStatusChange && (
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="pending">未対応</SelectItem>
            <SelectItem value="in_progress">対応中</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
