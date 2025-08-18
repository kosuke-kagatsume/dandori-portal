import { rest } from 'msw';
import { generateMockData } from '../data/generators';

// Generate mock data
const mockData = generateMockData();

// Helper function to simulate API delay
const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to simulate random success/failure
const simulateApiCall = async (successRate: number = 0.9) => {
  await delay(Math.random() * 1000 + 200);
  if (Math.random() > successRate) {
    throw new Error('Simulated API error');
  }
};

export const handlers = [
  // Tenants
  rest.get('/api/tenants', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      return res(ctx.status(200), ctx.json(mockData.tenants));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch tenants' }));
    }
  }),

  // Users
  rest.get('/api/users', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      const page = Number(req.url.searchParams.get('page')) || 1;
      const limit = Number(req.url.searchParams.get('limit')) || 10;
      const search = req.url.searchParams.get('search') || '';
      const department = req.url.searchParams.get('department') || '';
      
      let filteredUsers = mockData.users;
      
      if (search) {
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (department) {
        filteredUsers = filteredUsers.filter(user => user.department === department);
      }
      
      const total = filteredUsers.length;
      const offset = (page - 1) * limit;
      const paginatedUsers = filteredUsers.slice(offset, offset + limit);
      
      return res(
        ctx.status(200),
        ctx.json({
          users: paginatedUsers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      );
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch users' }));
    }
  }),

  rest.post('/api/users', async (req, res, ctx) => {
    try {
      await simulateApiCall(0.8); // Lower success rate for creation
      const body = await req.json();
      // Simulate validation error
      if (Math.random() > 0.7) {
        return res(ctx.status(422), ctx.json({ 
          error: 'Validation failed',
          details: { email: 'Email already exists' }
        }));
      }
      return res(ctx.status(201), ctx.json({ id: Date.now().toString(), ...body }));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to create user' }));
    }
  }),

  // Attendance
  rest.get('/api/attendance', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      const userId = req.url.searchParams.get('userId');
      const month = req.url.searchParams.get('month');
      
      let attendance = mockData.attendanceDays;
      if (userId) {
        attendance = attendance.filter(day => day.userId === userId);
      }
      if (month) {
        attendance = attendance.filter(day => day.date.startsWith(month));
      }
      
      return res(ctx.status(200), ctx.json(attendance));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch attendance' }));
    }
  }),

  rest.post('/api/attendance/checkin', async (req, res, ctx) => {
    try {
      await simulateApiCall(0.95);
      return res(ctx.status(200), ctx.json({ 
        message: 'Checked in successfully',
        timestamp: new Date().toISOString()
      }));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to check in' }));
    }
  }),

  // Leave requests
  rest.get('/api/leave-requests', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      const status = req.url.searchParams.get('status');
      const userId = req.url.searchParams.get('userId');
      
      let requests = mockData.leaveRequests;
      if (status) {
        requests = requests.filter(req => req.status === status);
      }
      if (userId) {
        requests = requests.filter(req => req.userId === userId);
      }
      
      return res(ctx.status(200), ctx.json(requests));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch leave requests' }));
    }
  }),

  rest.post('/api/leave-requests', async (req, res, ctx) => {
    try {
      await simulateApiCall(0.85);
      const body = await req.json();
      return res(ctx.status(201), ctx.json({ 
        id: Date.now().toString(), 
        ...body,
        status: 'pending'
      }));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to create leave request' }));
    }
  }),

  // Workflows
  rest.get('/api/workflows', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      const status = req.url.searchParams.get('status');
      const type = req.url.searchParams.get('type');
      
      let workflows = mockData.workflows;
      if (status) {
        workflows = workflows.filter(w => w.status === status);
      }
      if (type) {
        workflows = workflows.filter(w => w.type === type);
      }
      
      return res(ctx.status(200), ctx.json(workflows));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch workflows' }));
    }
  }),

  rest.put('/api/workflows/:id/approve', async (req, res, ctx) => {
    try {
      await simulateApiCall(0.9);
      return res(ctx.status(200), ctx.json({ 
        message: 'Workflow approved successfully',
        status: 'approved'
      }));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to approve workflow' }));
    }
  }),

  // Organization units
  rest.get('/api/org-units', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      return res(ctx.status(200), ctx.json(mockData.orgUnits));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch organization units' }));
    }
  }),

  // Sites
  rest.get('/api/sites', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      return res(ctx.status(200), ctx.json(mockData.sites));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch sites' }));
    }
  }),

  rest.post('/api/sites', async (req, res, ctx) => {
    try {
      await simulateApiCall(0.8);
      const body = await req.json();
      return res(ctx.status(201), ctx.json({ 
        id: Date.now().toString(), 
        ...body 
      }));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to create site' }));
    }
  }),

  // Notifications
  rest.get('/api/notifications', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      const filter = req.url.searchParams.get('filter');
      
      let notifications = mockData.notifications;
      if (filter === 'unread') {
        notifications = notifications.filter(n => !n.read);
      } else if (filter === 'important') {
        notifications = notifications.filter(n => n.important);
      }
      
      return res(ctx.status(200), ctx.json(notifications));
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch notifications' }));
    }
  }),

  // Audit logs
  rest.get('/api/audit-logs', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      const page = Number(req.url.searchParams.get('page')) || 1;
      const limit = Number(req.url.searchParams.get('limit')) || 20;
      
      const total = mockData.auditLogs.length;
      const offset = (page - 1) * limit;
      const paginatedLogs = mockData.auditLogs.slice(offset, offset + limit);
      
      return res(
        ctx.status(200),
        ctx.json({
          logs: paginatedLogs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      );
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch audit logs' }));
    }
  }),

  // Dashboard stats
  rest.get('/api/dashboard/stats', async (req, res, ctx) => {
    try {
      await simulateApiCall();
      return res(
        ctx.status(200),
        ctx.json({
          totalEmployees: mockData.users.length,
          todayAttendance: mockData.users.filter(u => u.status === 'active').length,
          pendingApprovals: mockData.workflows.filter(w => w.status === 'pending').length,
          monthlyUtilization: 87.5,
          leaveBalance: {
            remaining: 12,
            used: 8,
            pending: 2,
            expiring: 3,
          },
          attendanceChart: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            rate: Math.random() * 20 + 80,
          })),
        })
      );
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Failed to fetch dashboard stats' }));
    }
  }),
];