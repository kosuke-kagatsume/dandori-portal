'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

  const selectedUser = users.find((u) => u.id === value);

  const filteredUsers = useMemo(() => {
    if (search.length < 2) return [];
    const query = search.toLowerCase();
    return users.filter((user) => {
      const label = `${user.name} ${user.department ?? ''} ${user.position ?? ''}`.toLowerCase();
      return label.includes(query);
    });
  }, [users, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedUser
            ? `${selectedUser.name} (${selectedUser.department ?? ''} - ${selectedUser.position ?? ''})`
            : 'ユーザーを検索...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="名前で検索（2文字以上）..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < 2 ? (
              <CommandEmpty>2文字以上入力してください</CommandEmpty>
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
                        'mr-2 h-4 w-4',
                        value === user.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {user.name} ({user.department ?? ''} - {user.position ?? ''})
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
