'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, ListFilter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface UserOption {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
}

interface UserComboboxProps {
  users: UserOption[];
  value: string;
  onValueChange: (value: string) => void;
}

export function UserCombobox({ users, value, onValueChange }: UserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'search' | 'filter'>('search');

  const selectedUser = users.find((u) => u.id === value);

  // 検索モード: 1文字以上で絞り込み
  const filteredUsers = useMemo(() => {
    if (mode !== 'search') return [];
    if (search.length < 1) return [];
    const query = search.toLowerCase();
    return users.filter((user) => {
      const label = `${user.name} ${user.department ?? ''} ${user.position ?? ''}`.toLowerCase();
      return label.includes(query);
    });
  }, [users, search, mode]);

  // フィルタモード: 部署ごとにグループ化
  const groupedByDepartment = useMemo(() => {
    if (mode !== 'filter') return {};
    const groups: Record<string, UserOption[]> = {};
    for (const user of users) {
      const dept = user.department || '部署未設定';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(user);
    }
    // 部署名でソート（未設定は最後）
    const sorted: Record<string, UserOption[]> = {};
    const keys = Object.keys(groups).sort((a, b) => {
      if (a === '部署未設定') return 1;
      if (b === '部署未設定') return -1;
      return a.localeCompare(b, 'ja');
    });
    for (const key of keys) {
      sorted[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    }
    return sorted;
  }, [users, mode]);

  const toggleMode = () => {
    setMode(prev => prev === 'search' ? 'filter' : 'search');
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedUser ? (
            <span className="truncate">
              {selectedUser.name}
              {(selectedUser.department || selectedUser.position) && (
                <span className="text-muted-foreground ml-1">
                  ({[selectedUser.department, selectedUser.position].filter(Boolean).join(' - ')})
                </span>
              )}
            </span>
          ) : (
            'ユーザーを検索...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b">
            <div className="flex-1">
              {mode === 'search' ? (
                <CommandInput
                  placeholder="名前・部署で検索（1文字以上）..."
                  value={search}
                  onValueChange={setSearch}
                />
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  部署別一覧
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 h-8 w-8 p-0"
              onClick={toggleMode}
              title={mode === 'search' ? 'フィルタモードに切替' : '検索モードに切替'}
            >
              {mode === 'search' ? (
                <ListFilter className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CommandList className="max-h-[300px]">
            {mode === 'search' ? (
              // 検索モード
              search.length < 1 ? (
                  <CommandEmpty>1文字以上入力してください</CommandEmpty>
                ) : filteredUsers.length === 0 ? (
                  <CommandEmpty>該当するユーザーが見つかりません</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={(currentValue) => {
                          onValueChange(currentValue === value ? '' : currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 shrink-0',
                            value === user.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium">{user.name}</span>
                          {(user.department || user.position) && (
                            <span className="text-xs text-muted-foreground truncate">
                              {[user.department, user.position].filter(Boolean).join(' / ')}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
            ) : (
              // フィルタモード: 部署グループ別一覧
              <>
                {Object.entries(groupedByDepartment).map(([dept, deptUsers]) => (
                  <CommandGroup key={dept} heading={`${dept}（${deptUsers.length}名）`}>
                    {deptUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={(currentValue) => {
                          onValueChange(currentValue === value ? '' : currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 shrink-0',
                            value === user.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium">{user.name}</span>
                          {user.position && (
                            <span className="text-xs text-muted-foreground truncate">
                              {user.position}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
