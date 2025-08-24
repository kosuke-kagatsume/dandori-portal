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
  status: z.enum(['active', 'inactive', 'suspended']),
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
  before: z.record(z.any()).optional(),
  after: z.record(z.any()).optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Tenant = z.infer<typeof TenantSchema>;
export type OrgUnit = z.infer<typeof OrgUnitSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type AttendanceDay = z.infer<typeof AttendanceDaySchema>;
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;

// UI State types
export type ViewMode = 'card' | 'table';
export type Theme = 'light' | 'dark';
export type Locale = 'ja' | 'en';
export type Density = 'standard' | 'compact';