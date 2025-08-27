/**
 * K6 負荷テストスクリプト
 * 目標: 1日10,000ユーザー、ピーク時3,000同時接続
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// カスタムメトリクス
const loginSuccess = new Rate('login_success');
const dashboardLoadTime = new Trend('dashboard_load_time');
const apiResponseTime = new Trend('api_response_time');

// テストシナリオ設定
export let options = {
  // テストステージ
  stages: [
    // Stage 1: ウォームアップ（5分で100ユーザーまで）
    { duration: '5m', target: 100 },
    
    // Stage 2: 通常負荷（10分で1000ユーザー）
    { duration: '10m', target: 1000 },
    
    // Stage 3: ピーク負荷（5分で3000ユーザー）
    { duration: '5m', target: 3000 },
    
    // Stage 4: ピーク維持（20分）
    { duration: '20m', target: 3000 },
    
    // Stage 5: スパイクテスト（2分で5000ユーザー）
    { duration: '2m', target: 5000 },
    
    // Stage 6: 回復テスト（5分で1000ユーザーに戻る）
    { duration: '5m', target: 1000 },
    
    // Stage 7: クールダウン（3分で0）
    { duration: '3m', target: 0 },
  ],
  
  // パフォーマンス目標（SLO）
  thresholds: {
    // HTTPリクエストのエラー率は1%未満
    http_req_failed: ['rate<0.01'],
    
    // 95%のリクエストは500ms以内
    http_req_duration: [
      'p(95)<500',
      'p(99)<1000',
    ],
    
    // ログイン成功率は99%以上
    login_success: ['rate>0.99'],
    
    // ダッシュボード読み込みは95%が2秒以内
    dashboard_load_time: ['p(95)<2000'],
    
    // API応答時間は95%が200ms以内
    api_response_time: ['p(95)<200'],
  },
  
  // 設定オプション
  ext: {
    loadimpact: {
      projectID: 'dandori-portal',
      name: 'Production Load Test',
    },
  },
};

// テスト環境設定
const BASE_URL = __ENV.BASE_URL || 'https://dandori-portal.vercel.app';
const THINK_TIME_MIN = 3; // 最小思考時間（秒）
const THINK_TIME_MAX = 10; // 最大思考時間（秒）

// ユーザーの行動パターン
const USER_SCENARIOS = {
  // 一般社員（70%）
  employee: {
    weight: 70,
    actions: ['login', 'viewDashboard', 'checkAttendance', 'submitLeave'],
  },
  // マネージャー（20%）
  manager: {
    weight: 20,
    actions: ['login', 'viewDashboard', 'checkTeam', 'approveRequests'],
  },
  // HR担当者（8%）
  hr: {
    weight: 8,
    actions: ['login', 'viewDashboard', 'viewAllEmployees', 'generateReports'],
  },
  // 管理者（2%）
  admin: {
    weight: 2,
    actions: ['login', 'viewDashboard', 'systemSettings', 'userManagement'],
  },
};

// ヘルパー関数
function randomThinkTime() {
  return Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN;
}

function selectUserScenario() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [role, scenario] of Object.entries(USER_SCENARIOS)) {
    cumulative += scenario.weight;
    if (rand <= cumulative) {
      return { role, ...scenario };
    }
  }
  
  return { role: 'employee', ...USER_SCENARIOS.employee };
}

// APIエンドポイント
const ENDPOINTS = {
  login: '/api/auth/login',
  dashboard: '/api/dashboard',
  attendance: '/api/attendance',
  leave: '/api/leave',
  team: '/api/team',
  approvals: '/api/approvals',
  reports: '/api/reports',
  settings: '/api/settings',
  users: '/api/users',
};

// メインテスト関数
export default function () {
  const scenario = selectUserScenario();
  const userId = `user_${__VU}_${Date.now()}`;
  
  // ユーザーセッション開始
  group(`${scenario.role} User Journey`, function () {
    
    // 1. ログイン
    group('Login', function () {
      const loginStart = new Date();
      const loginRes = http.post(
        `${BASE_URL}${ENDPOINTS.login}`,
        JSON.stringify({
          email: `${userId}@example.com`,
          password: 'password123',
          role: scenario.role,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'login' },
        }
      );
      
      const loginDuration = new Date() - loginStart;
      
      const success = check(loginRes, {
        'login successful': (r) => r.status === 200,
        'auth token received': (r) => r.json('token') !== null,
        'login under 1s': (r) => loginDuration < 1000,
      });
      
      loginSuccess.add(success);
      
      if (!success) {
        console.error(`Login failed for ${userId}`);
        return;
      }
      
      // 認証トークンを保存
      const authToken = loginRes.json('token');
      const authHeaders = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };
      
      sleep(randomThinkTime());
      
      // 2. ダッシュボード表示
      group('Dashboard', function () {
        const dashStart = new Date();
        const dashRes = http.get(
          `${BASE_URL}${ENDPOINTS.dashboard}`,
          {
            headers: authHeaders,
            tags: { name: 'dashboard' },
          }
        );
        
        const dashDuration = new Date() - dashStart;
        dashboardLoadTime.add(dashDuration);
        
        check(dashRes, {
          'dashboard loaded': (r) => r.status === 200,
          'has KPI data': (r) => r.json('kpiData') !== null,
          'dashboard under 2s': (r) => dashDuration < 2000,
        });
        
        sleep(randomThinkTime());
      });
      
      // 3. 役割別アクション
      if (scenario.role === 'employee') {
        // 勤怠確認
        group('Check Attendance', function () {
          const attStart = new Date();
          const attRes = http.get(
            `${BASE_URL}${ENDPOINTS.attendance}`,
            {
              headers: authHeaders,
              tags: { name: 'attendance' },
            }
          );
          
          apiResponseTime.add(new Date() - attStart);
          
          check(attRes, {
            'attendance loaded': (r) => r.status === 200,
          });
          
          sleep(randomThinkTime());
        });
        
        // 休暇申請
        if (Math.random() > 0.7) {
          group('Submit Leave Request', function () {
            const leaveStart = new Date();
            const leaveRes = http.post(
              `${BASE_URL}${ENDPOINTS.leave}`,
              JSON.stringify({
                type: 'annual',
                startDate: '2024-02-01',
                endDate: '2024-02-02',
                reason: 'Personal',
              }),
              {
                headers: authHeaders,
                tags: { name: 'submit_leave' },
              }
            );
            
            apiResponseTime.add(new Date() - leaveStart);
            
            check(leaveRes, {
              'leave submitted': (r) => r.status === 201,
            });
          });
        }
        
      } else if (scenario.role === 'manager') {
        // チーム確認
        group('Check Team', function () {
          const teamStart = new Date();
          const teamRes = http.get(
            `${BASE_URL}${ENDPOINTS.team}`,
            {
              headers: authHeaders,
              tags: { name: 'team' },
            }
          );
          
          apiResponseTime.add(new Date() - teamStart);
          
          check(teamRes, {
            'team data loaded': (r) => r.status === 200,
            'has team members': (r) => r.json('members').length > 0,
          });
          
          sleep(randomThinkTime());
        });
        
        // 承認処理
        group('Process Approvals', function () {
          const appStart = new Date();
          const appRes = http.get(
            `${BASE_URL}${ENDPOINTS.approvals}`,
            {
              headers: authHeaders,
              tags: { name: 'approvals' },
            }
          );
          
          apiResponseTime.add(new Date() - appStart);
          
          check(appRes, {
            'approvals loaded': (r) => r.status === 200,
          });
          
          // ランダムに承認
          if (Math.random() > 0.5 && appRes.json('pending').length > 0) {
            const approvalId = appRes.json('pending')[0].id;
            const approveRes = http.put(
              `${BASE_URL}${ENDPOINTS.approvals}/${approvalId}`,
              JSON.stringify({ action: 'approve' }),
              {
                headers: authHeaders,
                tags: { name: 'approve' },
              }
            );
            
            check(approveRes, {
              'approval processed': (r) => r.status === 200,
            });
          }
        });
        
      } else if (scenario.role === 'hr') {
        // レポート生成
        group('Generate Reports', function () {
          const repStart = new Date();
          const repRes = http.post(
            `${BASE_URL}${ENDPOINTS.reports}`,
            JSON.stringify({
              type: 'monthly_attendance',
              month: '2024-01',
            }),
            {
              headers: authHeaders,
              tags: { name: 'reports' },
            }
          );
          
          apiResponseTime.add(new Date() - repStart);
          
          check(repRes, {
            'report generated': (r) => r.status === 200 || r.status === 202,
          });
        });
        
      } else if (scenario.role === 'admin') {
        // システム設定
        group('System Settings', function () {
          const setStart = new Date();
          const setRes = http.get(
            `${BASE_URL}${ENDPOINTS.settings}`,
            {
              headers: authHeaders,
              tags: { name: 'settings' },
            }
          );
          
          apiResponseTime.add(new Date() - setStart);
          
          check(setRes, {
            'settings loaded': (r) => r.status === 200,
          });
        });
        
        // ユーザー管理
        group('User Management', function () {
          const userStart = new Date();
          const userRes = http.get(
            `${BASE_URL}${ENDPOINTS.users}?limit=50`,
            {
              headers: authHeaders,
              tags: { name: 'users' },
            }
          );
          
          apiResponseTime.add(new Date() - userStart);
          
          check(userRes, {
            'users loaded': (r) => r.status === 200,
            'has pagination': (r) => r.json('totalCount') !== null,
          });
        });
      }
      
      // 4. ログアウト
      group('Logout', function () {
        const logoutRes = http.post(
          `${BASE_URL}/api/auth/logout`,
          null,
          {
            headers: authHeaders,
            tags: { name: 'logout' },
          }
        );
        
        check(logoutRes, {
          'logout successful': (r) => r.status === 200,
        });
      });
    });
  });
  
  // セッション間の待機
  sleep(randomThinkTime());
}

// テスト終了時のサマリー
export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}