import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrganizationNode, OrganizationMember, UserRole } from '@/types';

interface OrganizationStore {
  // State
  organizationTree: OrganizationNode | null;
  allMembers: OrganizationMember[];
  selectedMember: OrganizationMember | null;
  selectedNode: OrganizationNode | null;
  viewMode: 'tree' | 'list';
  searchQuery: string;
  filters: {
    role: UserRole | 'all';
    department: string | 'all';
    status: 'active' | 'inactive' | 'all';
  };

  // Actions
  setOrganizationTree: (tree: OrganizationNode) => void;
  setSelectedMember: (member: OrganizationMember | null) => void;
  setSelectedNode: (node: OrganizationNode | null) => void;
  setViewMode: (mode: 'tree' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<OrganizationStore['filters']>) => void;
  
  // Organization management
  addMember: (nodeId: string, member: OrganizationMember) => void;
  updateMember: (memberId: string, updates: Partial<OrganizationMember>) => void;
  removeMember: (memberId: string) => void;
  moveMember: (memberId: string, targetNodeId: string) => void;
  
  // Node management
  addNode: (parentId: string, node: Omit<OrganizationNode, 'children' | 'members'>) => void;
  updateNode: (nodeId: string, updates: Partial<OrganizationNode>) => void;
  removeNode: (nodeId: string) => void;
  
  // Utility functions
  findMember: (memberId: string) => OrganizationMember | null;
  findNode: (nodeId: string) => OrganizationNode | null;
  getFilteredMembers: () => OrganizationMember[];
  getMembersByNode: (nodeId: string) => OrganizationMember[];
  getManagersForMember: (memberId: string) => OrganizationMember[];
  getTeamMembersForManager: (managerId: string) => OrganizationMember[];
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      organizationTree: null,
      allMembers: [],
      selectedMember: null,
      selectedNode: null,
      viewMode: 'tree',
      searchQuery: '',
      filters: {
        role: 'all',
        department: 'all',
        status: 'active'
      },

      // Basic setters
      setOrganizationTree: (tree) => set({ organizationTree: tree }),
      setSelectedMember: (member) => set({ selectedMember: member }),
      setSelectedNode: (node) => set({ selectedNode: node }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters }
      })),

      // Member management
      addMember: (nodeId, newMember) => set((state) => {
        if (!state.organizationTree) return state;
        
        const updateNode = (node: OrganizationNode): OrganizationNode => {
          if (node.id === nodeId) {
            return {
              ...node,
              members: [...node.members, newMember],
              memberCount: node.memberCount + 1
            };
          }
          return {
            ...node,
            children: node.children.map(updateNode)
          };
        };

        return {
          organizationTree: updateNode(state.organizationTree),
          allMembers: [...state.allMembers, newMember]
        };
      }),

      updateMember: (memberId, updates) => set((state) => {
        if (!state.organizationTree) return state;

        const updateMemberInNode = (node: OrganizationNode): OrganizationNode => {
          const updatedMembers = node.members.map(member =>
            member.id === memberId ? { ...member, ...updates } : member
          );

          const updatedHeadMember = node.headMember?.id === memberId
            ? { ...node.headMember, ...updates }
            : node.headMember;

          return {
            ...node,
            members: updatedMembers,
            headMember: updatedHeadMember,
            children: node.children.map(updateMemberInNode)
          };
        };

        return {
          organizationTree: updateMemberInNode(state.organizationTree),
          allMembers: state.allMembers.map(member =>
            member.id === memberId ? { ...member, ...updates } : member
          ),
          selectedMember: state.selectedMember?.id === memberId
            ? { ...state.selectedMember, ...updates }
            : state.selectedMember
        };
      }),

      removeMember: (memberId) => set((state) => {
        if (!state.organizationTree) return state;

        const removeMemberFromNode = (node: OrganizationNode): OrganizationNode => {
          const filteredMembers = node.members.filter(m => m.id !== memberId);
          const updatedHeadMember = node.headMember?.id === memberId
            ? undefined
            : node.headMember;

          return {
            ...node,
            members: filteredMembers,
            headMember: updatedHeadMember,
            memberCount: Math.max(0, node.memberCount - (node.members.length - filteredMembers.length)),
            children: node.children.map(removeMemberFromNode)
          };
        };

        return {
          organizationTree: removeMemberFromNode(state.organizationTree),
          allMembers: state.allMembers.filter(m => m.id !== memberId),
          selectedMember: state.selectedMember?.id === memberId ? null : state.selectedMember
        };
      }),

      moveMember: (memberId, targetNodeId) => set((state) => {
        if (!state.organizationTree) return state;

        const member = get().findMember(memberId);
        if (!member) return state;

        // Remove from current location
        let updatedState = get().removeMember(memberId);
        
        // Add to target location
        return get().addMember(targetNodeId, member);
      }),

      // Node management
      addNode: (parentId, newNodeData) => set((state) => {
        if (!state.organizationTree) return state;

        const newNode: OrganizationNode = {
          ...newNodeData,
          children: [],
          members: [],
          memberCount: 0
        };

        const addToParent = (node: OrganizationNode): OrganizationNode => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...node.children, newNode]
            };
          }
          return {
            ...node,
            children: node.children.map(addToParent)
          };
        };

        return {
          organizationTree: addToParent(state.organizationTree)
        };
      }),

      updateNode: (nodeId, updates) => set((state) => {
        if (!state.organizationTree) return state;

        const updateNodeInTree = (node: OrganizationNode): OrganizationNode => {
          if (node.id === nodeId) {
            return { ...node, ...updates };
          }
          return {
            ...node,
            children: node.children.map(updateNodeInTree)
          };
        };

        return {
          organizationTree: updateNodeInTree(state.organizationTree),
          selectedNode: state.selectedNode?.id === nodeId
            ? { ...state.selectedNode, ...updates }
            : state.selectedNode
        };
      }),

      removeNode: (nodeId) => set((state) => {
        if (!state.organizationTree) return state;

        const removeNodeFromTree = (node: OrganizationNode): OrganizationNode => {
          return {
            ...node,
            children: node.children
              .filter(child => child.id !== nodeId)
              .map(removeNodeFromTree)
          };
        };

        return {
          organizationTree: removeNodeFromTree(state.organizationTree),
          selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode
        };
      }),

      // Utility functions
      findMember: (memberId) => {
        const state = get();
        return state.allMembers.find(member => member.id === memberId) || null;
      },

      findNode: (nodeId) => {
        const state = get();
        if (!state.organizationTree) return null;

        const searchInNode = (node: OrganizationNode): OrganizationNode | null => {
          if (node.id === nodeId) return node;
          for (const child of node.children) {
            const found = searchInNode(child);
            if (found) return found;
          }
          return null;
        };

        return searchInNode(state.organizationTree);
      },

      getFilteredMembers: () => {
        const state = get();
        let filtered = [...state.allMembers];

        // Filter by search query
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(member =>
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query) ||
            member.position.toLowerCase().includes(query)
          );
        }

        // Filter by role
        if (state.filters.role !== 'all') {
          filtered = filtered.filter(member => member.role === state.filters.role);
        }

        // Filter by status
        if (state.filters.status !== 'all') {
          filtered = filtered.filter(member => member.status === state.filters.status);
        }

        return filtered;
      },

      getMembersByNode: (nodeId) => {
        const node = get().findNode(nodeId);
        return node ? node.members : [];
      },

      getManagersForMember: (memberId) => {
        const state = get();
        const member = state.findMember(memberId);
        if (!member) return [];

        // Find the node containing this member and return managers
        // This is a simplified implementation
        return state.allMembers.filter(m => 
          m.isManager && m.id !== memberId
        );
      },

      getTeamMembersForManager: (managerId) => {
        const state = get();
        if (!state.organizationTree) return [];

        const findMembersUnderManager = (node: OrganizationNode): OrganizationMember[] => {
          let members: OrganizationMember[] = [];
          
          // If this node's head is the manager, add all members
          if (node.headMember?.id === managerId) {
            members = [...node.members];
          }
          
          // Recursively search children
          for (const child of node.children) {
            members = [...members, ...findMembersUnderManager(child)];
          }
          
          return members;
        };

        return findMembersUnderManager(state.organizationTree)
          .filter(member => member.id !== managerId);
      }
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        organizationTree: state.organizationTree,
        allMembers: state.allMembers,
        viewMode: state.viewMode,
        filters: state.filters
      })
    }
  )
);