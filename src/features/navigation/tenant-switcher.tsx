'use client';

import { Check, ChevronDown, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenantStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function TenantSwitcher() {
  const { currentTenant, tenants, setCurrentTenant } = useTenantStore();

  if (!currentTenant) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Building className="w-4 h-4" />
        <span className="text-sm">No tenant selected</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 h-9 px-2"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentTenant.logo} alt={currentTenant.name} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {currentTenant.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium leading-none">
              {currentTenant.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentTenant.timezone}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => setCurrentTenant(tenant)}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={tenant.logo} alt={tenant.name} />
              <AvatarFallback className="text-xs">
                {tenant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{tenant.name}</div>
              <div className="text-xs text-muted-foreground">
                {tenant.timezone}
              </div>
            </div>
            {currentTenant.id === tenant.id && (
              <Check className="w-4 h-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}