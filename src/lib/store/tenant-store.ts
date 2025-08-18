import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant } from '@/types';

interface TenantState {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  setCurrentTenant: (tenant: Tenant) => void;
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Tenant) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  removeTenant: (id: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      tenants: [],
      
      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant });
      },
      
      setTenants: (tenants) => {
        set({ tenants });
        if (tenants.length > 0 && !get().currentTenant) {
          set({ currentTenant: tenants[0] });
        }
      },
      
      addTenant: (tenant) => {
        set((state) => ({
          tenants: [...state.tenants, tenant],
          currentTenant: state.currentTenant || tenant,
        }));
      },
      
      updateTenant: (id, updates) => {
        set((state) => ({
          tenants: state.tenants.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          currentTenant:
            state.currentTenant?.id === id
              ? { ...state.currentTenant, ...updates }
              : state.currentTenant,
        }));
      },
      
      removeTenant: (id) => {
        set((state) => {
          const newTenants = state.tenants.filter((t) => t.id !== id);
          const newCurrentTenant =
            state.currentTenant?.id === id
              ? newTenants[0] || null
              : state.currentTenant;
          
          return {
            tenants: newTenants,
            currentTenant: newCurrentTenant,
          };
        });
      },
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        tenants: state.tenants,
      }),
    }
  )
);