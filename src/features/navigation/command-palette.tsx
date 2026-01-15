'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  GitBranch,
  Building2,
  MapPin,
  FileText,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationCommands = [
  {
    id: 'dashboard',
    title: 'ダッシュボード',
    href: '/ja/dashboard',
    icon: LayoutDashboard,
    keywords: ['dashboard', 'home', 'ダッシュボード', 'ホーム'],
    shortcut: 'g d',
  },
  {
    id: 'users',
    title: 'ユーザー管理',
    href: '/ja/users',
    icon: Users,
    keywords: ['users', 'ユーザー', 'management', '管理'],
    shortcut: 'g u',
  },
  {
    id: 'members',
    title: 'メンバー状況',
    href: '/ja/members',
    icon: UserCheck,
    keywords: ['members', 'メンバー', 'status', '状況'],
    shortcut: 'g m',
  },
  {
    id: 'attendance',
    title: '勤怠管理',
    href: '/ja/attendance',
    icon: Clock,
    keywords: ['attendance', '勤怠', 'time', '時間'],
    shortcut: 'g a',
  },
  {
    id: 'leave',
    title: '休暇管理',
    href: '/ja/leave',
    icon: Calendar,
    keywords: ['leave', '有給', 'vacation', '休暇'],
    shortcut: 'g l',
  }
  // {
  //   id: 'workflows',
  //   title: 'ワークフロー',
  //   href: '/ja/workflows',
  //   icon: GitBranch,
  //   keywords: ['workflows', 'ワークフロー', 'approval', '承認'],
  //   shortcut: 'g w',
  // },
  // {
  //   id: 'organization',
  //   title: '組織管理',
  //   href: '/ja/org',
  //   icon: Building2,
  //   keywords: ['organization', '組織', 'org', '管理'],
  //   shortcut: 'g o',
  // },
  // {
  //   id: 'sites',
  //   title: 'サイト',
  //   href: '/ja/sites',
  //   icon: MapPin,
  //   keywords: ['sites', 'サイト', 'location', '拠点'],
  //   shortcut: 'g s',
  // },
  // {
  //   id: 'settings',
  //   title: '設定',
  //   href: '/ja/settings',
  //   icon: Settings,
  //   keywords: ['settings', '設定', 'preferences', '環境設定'],
  //   shortcut: 'g se',
  // },
  // {
  //   id: 'audit',
  //   title: '監査ログ',
  //   href: '/ja/admin/audit-logs',
  //   icon: FileText,
  //   keywords: ['audit', '監査', 'logs', 'ログ'],
  //   shortcut: 'g au',
  // },
];

const actionCommands = [
  {
    id: 'new-user',
    title: '新規ユーザー作成',
    action: () => console.log('Create user'),
    icon: User,
    keywords: ['create', 'user', '作成', 'ユーザー', 'new'],
  },
  {
    id: 'checkin',
    title: '出勤する',
    action: () => console.log('Check in'),
    icon: Clock,
    keywords: ['checkin', '出勤', 'clock in'],
  },
  {
    id: 'new-leave-request',
    title: '有給申請作成',
    action: () => console.log('Create leave request'),
    icon: Calendar,
    keywords: ['leave', 'request', '有給', '申請', 'vacation'],
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [shortcutBuffer, setShortcutBuffer] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle navigation shortcuts
      if (open) return;

      // Build shortcut buffer
      const key = e.key.toLowerCase();
      const newBuffer = shortcutBuffer + key;
      
      // Check for matches
      const matchedCommand = navigationCommands.find(cmd => 
        cmd.shortcut === newBuffer
      );

      if (matchedCommand) {
        router.push(matchedCommand.href);
        setShortcutBuffer('');
        return;
      }

      // Update buffer or reset if no potential matches
      const hasPartialMatch = navigationCommands.some(cmd => 
        cmd.shortcut.startsWith(newBuffer)
      );
      
      if (hasPartialMatch) {
        setShortcutBuffer(newBuffer);
        // Clear buffer after timeout
        setTimeout(() => setShortcutBuffer(''), 1000);
      } else {
        setShortcutBuffer('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, shortcutBuffer, open]);

  const runCommand = (command: typeof navigationCommands[0] | typeof actionCommands[0]) => {
    onOpenChange(false);

    if ('href' in command) {
      router.push(command.href);
    } else if ('action' in command) {
      command.action();
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="コマンドを入力するか、ページを検索..." />
      <CommandList>
        <CommandEmpty>結果が見つかりませんでした。</CommandEmpty>
        
        <CommandGroup heading="ナビゲーション">
          {navigationCommands.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                value={`${command.title} ${command.keywords.join(' ')}`}
                onSelect={() => runCommand(command)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{command.title}</span>
                <CommandShortcut>{command.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="アクション">
          {actionCommands.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                value={`${command.title} ${command.keywords.join(' ')}`}
                onSelect={() => runCommand(command)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{command.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="ヘルプ">
          <CommandItem>
            <Smile className="mr-2 h-4 w-4" />
            <span>キーボードショートカット</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}