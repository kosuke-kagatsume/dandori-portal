'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface BankValue {
  code: string;
  name: string;
}

interface BankOption {
  code: string;
  name: string;
  kana: string;
}

interface BankComboboxProps {
  value: BankValue | null;
  onChange: (value: BankValue | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function BankCombobox({
  value,
  onChange,
  disabled,
  placeholder = '銀行名またはコードで検索',
  className,
  id,
}: BankComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = query.trim()
          ? `/api/banks?q=${encodeURIComponent(query.trim())}`
          : '/api/banks';
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setOptions(json.data || []);
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          setOptions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  const handleSelect = (opt: BankOption) => {
    onChange({ code: opt.code, name: opt.name });
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          {value ? (
            <span className="truncate">
              <span className="text-muted-foreground mr-1.5 text-xs">{value.code}</span>
              {value.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[300px]">
            {loading && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />検索中...
              </div>
            )}
            {!loading && options.length === 0 && (
              <CommandEmpty>該当する銀行がありません</CommandEmpty>
            )}
            {!loading && options.length > 0 && (
              <CommandGroup>
                {options.map(opt => (
                  <CommandItem
                    key={opt.code}
                    value={opt.code}
                    onSelect={() => handleSelect(opt)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value?.code === opt.code ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">
                        <span className="text-muted-foreground mr-1.5 text-xs">
                          {opt.code}
                        </span>
                        {opt.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {opt.kana}
                      </span>
                    </div>
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
