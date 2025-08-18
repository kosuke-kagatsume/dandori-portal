import { faker } from '@faker-js/faker';
import type {
  User,
  Tenant,
  OrgUnit,
  Notification,
  AttendanceDay,
  LeaveRequest,
  Workflow,
  Site,
  AuditLog,
} from '@/types';

// Note: faker.js locale configuration changed in newer versions
// Japanese data is generated through specific methods

export const generateUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  hireDate: faker.date.past({ years: 5 }).toISOString().split('T')[0],
  unitId: faker.string.uuid(),
  roles: faker.helpers.arrayElements(['admin', 'manager', 'employee', 'hr'], { min: 1, max: 2 }),
  status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
  timezone: 'Asia/Tokyo',
  avatar: faker.image.avatar(),
  position: faker.person.jobTitle(),
  department: faker.helpers.arrayElement(['営業部', '開発部', '人事部', '総務部', '経理部']),
  ...overrides,
});

export const generateTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  logo: faker.image.url(),
  timezone: 'Asia/Tokyo',
  closingDay: faker.helpers.arrayElement(['末', '20', '15', '任意']),
  weekStartDay: 1, // Monday
  ...overrides,
});

export const generateOrgUnit = (overrides: Partial<OrgUnit> = {}): OrgUnit => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement(['本社', '営業部', '開発部', '人事部', '総務部']),
  parentId: faker.datatype.boolean() ? faker.string.uuid() : undefined,
  level: faker.number.int({ min: 0, max: 4 }),
  headUserId: faker.string.uuid(),
  type: faker.helpers.arrayElement(['company', 'division', 'department', 'team']),
  memberCount: faker.number.int({ min: 1, max: 50 }),
  ...overrides,
});

export const generateNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['info', 'warning', 'error', 'success']),
  title: faker.helpers.arrayElement([
    '承認待ちの申請があります',
    'システムメンテナンスのお知らせ',
    '勤怠の修正が必要です',
    '有給残日数が少なくなっています',
  ]),
  message: faker.lorem.sentence(),
  timestamp: faker.date.recent().toISOString(),
  read: faker.datatype.boolean(),
  important: faker.datatype.boolean({ probability: 0.3 }),
  actionUrl: faker.datatype.boolean() ? `/workflows/${faker.string.uuid()}` : undefined,
  ...overrides,
});

export const generateAttendanceDay = (overrides: Partial<AttendanceDay> = {}): AttendanceDay => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
  clockIn: faker.date.recent().toISOString().split('T')[1].slice(0, 5),
  clockOut: faker.date.recent().toISOString().split('T')[1].slice(0, 5),
  breaks: [
    {
      start: '12:00',
      end: '13:00',
    },
  ],
  status: faker.helpers.arrayElement(['present', 'absent', 'remote', 'business_trip', 'training']),
  workType: faker.helpers.arrayElement(['office', 'remote', 'hybrid']),
  note: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : undefined,
  ...overrides,
});

export const generateLeaveRequest = (overrides: Partial<LeaveRequest> = {}): LeaveRequest => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  type: faker.helpers.arrayElement(['annual', 'sick', 'personal', 'maternity', 'paternity']),
  startDate: faker.date.future().toISOString().split('T')[0],
  endDate: faker.date.future().toISOString().split('T')[0],
  days: faker.number.int({ min: 1, max: 5 }),
  reason: faker.lorem.sentence(),
  status: faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'cancelled']),
  approvers: [faker.string.uuid()],
  submittedAt: faker.date.recent().toISOString(),
  approvedAt: faker.datatype.boolean() ? faker.date.recent().toISOString() : undefined,
  ...overrides,
});

export const generateWorkflow = (overrides: Partial<Workflow> = {}): Workflow => ({
  id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['leave', 'expense', 'overtime', 'purchase', 'business_trip', 'training']),
  title: faker.lorem.words(3),
  amount: faker.datatype.boolean() ? faker.number.int({ min: 1000, max: 100000 }) : undefined,
  applicantId: faker.string.uuid(),
  unitId: faker.string.uuid(),
  status: faker.helpers.arrayElement(['draft', 'pending', 'approved', 'rejected', 'cancelled']),
  currentStage: faker.number.int({ min: 1, max: 3 }),
  timeline: [
    {
      stage: 1,
      name: '申請者',
      status: 'approved',
      assigneeId: faker.string.uuid(),
      completedAt: faker.date.recent().toISOString(),
      comment: undefined,
    },
    {
      stage: 2,
      name: '直属上司',
      status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
      assigneeId: faker.string.uuid(),
      completedAt: faker.datatype.boolean() ? faker.date.recent().toISOString() : undefined,
      comment: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : undefined,
    },
  ],
  attachments: faker.helpers.multiple(() => faker.string.uuid(), { count: { min: 0, max: 3 } }),
  createdAt: faker.date.recent().toISOString(),
  dueDate: faker.date.future().toISOString(),
  ...overrides,
});

export const generateSite = (overrides: Partial<Site> = {}): Site => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement(['本社', '大阪支社', '名古屋支社', '福岡支社']),
  timezone: 'Asia/Tokyo',
  latitude: faker.location.latitude({ min: 35, max: 36 }),
  longitude: faker.location.longitude({ min: 139, max: 140 }),
  radiusMeters: faker.number.int({ min: 50, max: 500 }),
  address: faker.location.streetAddress(),
  ...overrides,
});

export const generateAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  action: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']),
  target: faker.helpers.arrayElement(['USER', 'ATTENDANCE', 'LEAVE_REQUEST', 'WORKFLOW']),
  targetId: faker.string.uuid(),
  before: faker.datatype.boolean() ? { status: 'active' } : undefined,
  after: { status: 'inactive' },
  ipAddress: faker.internet.ip(),
  userAgent: faker.internet.userAgent(),
  timestamp: faker.date.recent().toISOString(),
  ...overrides,
});

// Generate mock datasets
export const generateMockData = () => {
  return {
    tenants: faker.helpers.multiple(generateTenant, { count: 3 }),
    users: faker.helpers.multiple(generateUser, { count: 50 }),
    orgUnits: faker.helpers.multiple(generateOrgUnit, { count: 10 }),
    notifications: faker.helpers.multiple(generateNotification, { count: 20 }),
    attendanceDays: faker.helpers.multiple(generateAttendanceDay, { count: 200 }),
    leaveRequests: faker.helpers.multiple(generateLeaveRequest, { count: 30 }),
    workflows: faker.helpers.multiple(generateWorkflow, { count: 40 }),
    sites: faker.helpers.multiple(generateSite, { count: 4 }),
    auditLogs: faker.helpers.multiple(generateAuditLog, { count: 100 }),
  };
};