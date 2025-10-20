import { z } from 'zod';

// Base schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  hireDate: z.string(),
  unitId: z.string(),
  roles: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'suspended', 'retired']),
  retiredDate: z.string().optional(), // 退職日
  retirementReason: z.enum(['voluntary', 'company', 'contract_end', 'retirement_age', 'other']).optional(), // 退職理由
  timezone: z.string().default('Asia/Tokyo'),
  avatar: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
});

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  timezone: z.string(),
  closingDay: z.enum(['末', '20', '15', '任意']),
  weekStartDay: z.number().min(0).max(6),
});

export const OrgUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().optional(),
  level: z.number(),
  headUserId: z.string().optional(),
  type: z.enum(['company', 'division', 'department', 'team']),
  memberCount: z.number().default(0),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 組織階層とポジション管理
export const PositionSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.number(),
  unitId: z.string(),
  description: z.string().optional(),
  responsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  reportingManager: z.string().optional(),
  isManagerRole: z.boolean().default(false),
  maxMembers: z.number().optional(),
});

// ユーザーと組織の関連
export const UserOrganizationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  unitId: z.string(),
  positionId: z.string(),
  role: z.enum(['employee', 'manager', 'hr', 'admin']),
  permissions: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

// 権限マスタ
export const PermissionSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['attendance', 'leave', 'organization', 'system', 'reports']),
  level: z.enum(['self', 'team', 'department', 'company', 'system']),
});

// ロール定義
export const RoleSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
  isSystemRole: z.boolean().default(false),
  unitTypes: z.array(z.string()).optional(),
});

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum(['info', 'warning', 'error', 'success']),
  title: z.string(),
  message: z.string(),
  timestamp: z.string(),
  read: z.boolean().default(false),
  important: z.boolean().default(false),
  actionUrl: z.string().optional(),
  userId: z.string().optional(),
});

export const AttendanceDaySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  breaks: z.array(z.object({
    start: z.string(),
    end: z.string(),
  })),
  status: z.enum(['present', 'absent', 'remote', 'business_trip', 'training']),
  workType: z.enum(['office', 'remote', 'hybrid']),
  note: z.string().optional(),
});

export const LeaveRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity']),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number(),
  reason: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
  approvers: z.array(z.string()),
  submittedAt: z.string(),
  approvedAt: z.string().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  type: z.enum(['leave', 'expense', 'overtime', 'purchase', 'business_trip', 'training']),
  title: z.string(),
  amount: z.number().optional(),
  applicantId: z.string(),
  unitId: z.string(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'cancelled']),
  currentStage: z.number(),
  timeline: z.array(z.object({
    stage: z.number(),
    name: z.string(),
    status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
    assigneeId: z.string(),
    completedAt: z.string().optional(),
    comment: z.string().optional(),
  })),
  attachments: z.array(z.string()),
  createdAt: z.string(),
  dueDate: z.string().optional(),
});

export const SiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  timezone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number(),
  address: z.string().optional(),
});

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  target: z.string(),
  targetId: z.string(),
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
});

// 異動履歴（配置転換）
export const TransferHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  type: z.enum(['transfer', 'promotion', 'demotion', 'role_change']),
  fromUnitId: z.string(),
  fromUnitName: z.string(),
  toUnitId: z.string(),
  toUnitName: z.string(),
  fromPosition: z.string(),
  toPosition: z.string(),
  fromRole: z.enum(['employee', 'manager', 'hr', 'admin']).optional(),
  toRole: z.enum(['employee', 'manager', 'hr', 'admin']).optional(),
  effectiveDate: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedByName: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  createdByName: z.string(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Tenant = z.infer<typeof TenantSchema>;
export type OrgUnit = z.infer<typeof OrgUnitSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type UserOrganization = z.infer<typeof UserOrganizationSchema>;
export type PermissionDef = z.infer<typeof PermissionSchema>;
export type RoleDef = z.infer<typeof RoleSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type AttendanceDay = z.infer<typeof AttendanceDaySchema>;
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type TransferHistory = z.infer<typeof TransferHistorySchema>;

// Role and Permission types
export type UserRole = 'employee' | 'manager' | 'hr' | 'admin';
export type Permission = 'view_own' | 'view_team' | 'view_all' | 'approve_requests' | 'manage_system';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  permissions: Permission[];
  unitId?: string;
  positionId?: string;
  managerIds?: string[];
  teamMemberIds?: string[];
}

// 組織図関連の型
export interface OrganizationNode {
  id: string;
  name: string;
  type: 'company' | 'division' | 'department' | 'team';
  parentId?: string;
  children: OrganizationNode[];
  members: OrganizationMember[];
  headMember?: OrganizationMember;
  level: number;
  memberCount: number;
  description?: string;
  isExpanded?: boolean;
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  position: string;
  role: UserRole;
  avatar?: string;
  isManager: boolean;
  joinDate: string;
  status: 'active' | 'inactive' | 'leave';
}

// 権限管理関連の型
export interface PermissionCategory {
  id: string;
  name: string;
  permissions: PermissionItem[];
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  description: string;
  level: 'self' | 'team' | 'department' | 'company' | 'system';
}

// UI State types
export type ViewMode = 'card' | 'table';
export type Theme = 'light' | 'dark';
export type Locale = 'ja' | 'en';
export type Density = 'standard' | 'compact';