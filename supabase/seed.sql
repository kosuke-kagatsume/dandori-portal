-- Insert demo organization
INSERT INTO organizations (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'デモ株式会社', 'demo-company');

-- Insert demo users (パスワードは全て 'demo1234')
-- Note: These users need to be created in Supabase Auth first
INSERT INTO users (id, organization_id, email, name, department, position, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'tanaka@demo.com', '田中太郎', '営業部', '部長', 'manager'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'sato@demo.com', '佐藤花子', '営業部', '主任', 'member'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'suzuki@demo.com', '鈴木一郎', '人事部', '部長', 'manager'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'takahashi@demo.com', '高橋美咲', '経理部', '課長', 'member'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'yamada@demo.com', '山田次郎', '開発部', 'エンジニア', 'member');

-- Insert sample workflow requests
INSERT INTO workflow_requests (organization_id, type, title, description, requester_id, department, status, priority, details) VALUES
  ('11111111-1111-1111-1111-111111111111', 'leave_request', '有給休暇申請（3/15〜3/17）', '家族旅行のため', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '営業部', 'pending', 'normal', 
   '{"leaveType": "paid_leave", "startDate": "2024-03-15", "endDate": "2024-03-17", "days": 3, "reason": "家族旅行のため", "handover": "山田さんに引き継ぎ済み"}'::jsonb),
  
  ('11111111-1111-1111-1111-111111111111', 'expense_claim', '出張費精算（大阪）', '3月度大阪出張の交通費・宿泊費', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '開発部', 'approved', 'normal',
   '{"amount": 45000, "expenseType": "business_trip", "expenseDate": "2024-03-10", "purpose": "クライアント打ち合わせ", "hasReceipt": true}'::jsonb),
  
  ('11111111-1111-1111-1111-111111111111', 'overtime_request', '残業申請（3月分）', '月末処理のため', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '経理部', 'pending', 'high',
   '{"overtimeDate": "2024-03-31", "hours": 4, "startTime": "18:00", "endTime": "22:00", "reason": "月末決算処理"}'::jsonb);

-- Insert approval steps for the requests
INSERT INTO approval_steps (request_id, order_index, approver_role, approver_id, status) VALUES
  ((SELECT id FROM workflow_requests WHERE title LIKE '有給休暇申請%'), 1, 'direct_manager', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending'),
  ((SELECT id FROM workflow_requests WHERE title LIKE '有給休暇申請%'), 2, 'hr_manager', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'pending'),
  
  ((SELECT id FROM workflow_requests WHERE title LIKE '出張費精算%'), 1, 'direct_manager', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'approved'),
  
  ((SELECT id FROM workflow_requests WHERE title LIKE '残業申請%'), 1, 'direct_manager', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, action_url) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '新しい承認依頼', '佐藤花子さんから有給休暇申請が届いています', 'info', '/workflow'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'システムメンテナンス', '3/20 22:00〜24:00にメンテナンスを実施します', 'warning', NULL),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '経費精算が承認されました', '大阪出張の経費精算が承認されました', 'success', '/expenses');