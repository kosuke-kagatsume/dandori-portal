-- =========================================
-- Supabase デモデータシード
-- =========================================

-- 重要: このSQLを実行する前に、Supabase Authでユーザーを作成してください
-- パスワードは全て 'demo1234' を推奨

-- =========================================
-- 1. ユーザーデータ
-- =========================================

-- 注意: usersテーブルのid型はTEXTです
INSERT INTO users (id, email, name, department, position, roles, avatar, timezone, hireDate, unitId) VALUES
  ('user-001', 'tanaka.taro@example.com', '田中太郎', '人事部', '人事部長', ARRAY['employee', 'admin'], NULL, 'Asia/Tokyo', '2020-04-01', 'hr'),
  ('user-002', 'suzuki.hanako@example.com', '鈴木花子', '人事部', '人事担当', ARRAY['employee'], NULL, 'Asia/Tokyo', '2021-04-01', 'hr'),
  ('user-003', 'sato.ichiro@example.com', '佐藤一郎', '営業部', '営業部長', ARRAY['employee', 'manager'], NULL, 'Asia/Tokyo', '2019-04-01', 'sales'),
  ('user-004', 'yamada.yuki@example.com', '山田勇気', '営業部', '営業担当', ARRAY['employee'], NULL, 'Asia/Tokyo', '2022-04-01', 'sales'),
  ('user-005', 'takahashi.mika@example.com', '高橋美香', '開発部', 'エンジニアリングマネージャー', ARRAY['employee', 'manager'], NULL, 'Asia/Tokyo', '2018-04-01', 'engineering'),
  ('user-006', 'watanabe.ken@example.com', '渡辺健', '開発部', 'シニアエンジニア', ARRAY['employee'], NULL, 'Asia/Tokyo', '2021-07-01', 'engineering'),
  ('user-007', 'ito.aoi@example.com', '伊藤葵', '開発部', 'ジュニアエンジニア', ARRAY['employee'], NULL, 'Asia/Tokyo', '2023-04-01', 'engineering'),
  ('user-008', 'nakamura.rei@example.com', '中村礼', '営業部', '営業担当', ARRAY['employee'], NULL, 'Asia/Tokyo', '2020-10-01', 'sales'),
  ('user-009', 'kobayashi.sora@example.com', '小林空', '人事部', '総務担当', ARRAY['employee'], NULL, 'Asia/Tokyo', '2022-07-01', 'hr'),
  ('user-010', 'kato.riku@example.com', '加藤陸', '営業部', '元営業部長', ARRAY['employee', 'admin'], NULL, 'Asia/Tokyo', '2017-04-01', NULL)
ON CONFLICT (id) DO NOTHING;

-- 退職者の設定
UPDATE users SET status = 'retired', retiredDate = '2024-03-31', retirementReason = 'voluntary' WHERE id = 'user-010';

-- =========================================
-- 2. お知らせ（Announcements）
-- =========================================

INSERT INTO announcements (title, content, type, priority, target, published, published_at, start_date, end_date, created_by) VALUES
  ('【重要】令和6年分 年末調整書類の提出について', '## 提出期限: 2024年12月15日 (金) まで 以下の書類を人事部まで提出してください。### 提出書類1. 扶養控除申告書 (第1号)2. 保険料控除申告書 (第2号)3. 配偶者控除等申告書 (第3号)...', 'deadline', 'urgent', 'all', true, NOW(), CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'user-001'),
  ('夏季休暇の取得について', '今年度の夏季休暇は7月1日〜9月30日の期間中に5日間取得してください。計画的な業務調整をお願いします。', 'general', 'normal', 'all', true, NOW(), CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '60 days', 'user-001'),
  ('新型コロナウイルス感染症対策について', '引き続き感染症対策の徹底をお願いします。体調不良の場合は無理せず在宅勤務または休暇を取得してください。', 'policy', 'high', 'all', true, NOW(), CURRENT_DATE - INTERVAL '5 days', NULL, 'user-001'),
  ('社内システムメンテナンスのお知らせ', '3月20日 22:00〜24:00にシステムメンテナンスを実施します。この間、システムへのアクセスができなくなります。', 'system', 'normal', 'all', true, NOW(), CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days', 'user-001'),
  ('営業部向け：新商品研修のお知らせ', '4月1日より新商品の販売を開始します。3月25日に研修を実施しますので、営業部の皆様は必ずご参加ください。', 'general', 'high', 'department', 'all', true, NOW(), CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', 'user-003')
ON CONFLICT DO NOTHING;

-- お知らせの既読状態
INSERT INTO announcement_reads (announcement_id, user_id, read_at)
SELECT a.id, u.id, NOW() - INTERVAL '1 day'
FROM announcements a
CROSS JOIN users u
WHERE u.id IN ('user-001', 'user-002', 'user-003')
  AND a.title LIKE '%夏季休暇%'
ON CONFLICT DO NOTHING;

-- =========================================
-- 3. 勤怠記録（Attendance Records）- 過去30日分
-- =========================================

-- 勤怠データ生成関数（PostgreSQL）
DO $$
DECLARE
  day_offset INTEGER;
  target_date DATE;
  day_of_week INTEGER;
  user_record RECORD;
  check_in_time TIMESTAMP;
  check_out_time TIMESTAMP;
  work_hrs NUMERIC;
  overtime_hrs NUMERIC;
BEGIN
  -- 過去30日分のデータを生成
  FOR day_offset IN 1..30 LOOP
    target_date := CURRENT_DATE - day_offset;
    day_of_week := EXTRACT(DOW FROM target_date); -- 0=日, 6=土

    -- 土日はスキップ
    IF day_of_week = 0 OR day_of_week = 6 THEN
      CONTINUE;
    END IF;

    -- アクティブユーザーのみ
    FOR user_record IN SELECT id FROM users WHERE status = 'active' LOOP
      -- 90%の確率で出勤
      IF RANDOM() < 0.9 THEN
        -- 出勤時刻（8:30〜9:30）
        check_in_time := target_date + TIME '08:00:00' + (RANDOM() * INTERVAL '90 minutes');

        -- 退勤時刻（17:30〜19:30）
        check_out_time := target_date + TIME '17:30:00' + (RANDOM() * INTERVAL '120 minutes');

        -- 勤務時間計算（休憩1時間を引く）
        work_hrs := EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600 - 1;
        overtime_hrs := GREATEST(0, work_hrs - 8);

        INSERT INTO attendance_records (user_id, date, check_in, check_out, work_hours, overtime_hours, status, location)
        VALUES (
          user_record.id,
          target_date,
          check_in_time,
          check_out_time,
          ROUND(work_hrs::NUMERIC, 2),
          ROUND(overtime_hrs::NUMERIC, 2),
          'approved',
          CASE
            WHEN RANDOM() < 0.8 THEN 'office'
            WHEN RANDOM() < 0.9 THEN 'home'
            ELSE 'client'
          END
        )
        ON CONFLICT (user_id, date) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- =========================================
-- 4. 休暇残数（Leave Balances）
-- =========================================

INSERT INTO leave_balances (user_id, year, leave_type, total_days, used_days)
SELECT
  u.id,
  EXTRACT(YEAR FROM CURRENT_DATE),
  'annual',
  20.0,
  FLOOR(RANDOM() * 10)::NUMERIC
FROM users u
WHERE u.status = 'active'
ON CONFLICT (user_id, year, leave_type) DO NOTHING;

-- =========================================
-- 5. 休暇申請（Leave Requests）
-- =========================================

INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days, reason, status, approved_by, approved_at) VALUES
  ('user-004', 'annual', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '9 days', 3, '家族旅行のため', 'pending', NULL, NULL),
  ('user-006', 'annual', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '8 days', 3, '私用', 'approved', 'user-005', CURRENT_DATE - INTERVAL '15 days'),
  ('user-007', 'sick', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', 1, '体調不良', 'approved', 'user-005', CURRENT_DATE - INTERVAL '3 days'),
  ('user-008', 'annual', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '24 days', 5, '夏季休暇', 'pending', NULL, NULL)
ON CONFLICT DO NOTHING;

-- =========================================
-- 6. 給与記録（Payroll Records）
-- =========================================

-- 直近3ヶ月分の給与データ
INSERT INTO payroll_records (user_id, year, month, base_salary, allowances, deductions, gross_pay, net_pay, work_days, work_hours, overtime_hours, status, paid_at)
SELECT
  u.id,
  EXTRACT(YEAR FROM month_date),
  EXTRACT(MONTH FROM month_date),
  CASE u.position
    WHEN '人事部長' THEN 450000
    WHEN 'エンジニアリングマネージャー' THEN 500000
    WHEN '営業部長' THEN 480000
    WHEN 'シニアエンジニア' THEN 420000
    ELSE 350000
  END,
  jsonb_build_object('housing', 30000, 'commute', 15000),
  jsonb_build_object('health_insurance', 20000, 'pension', 35000, 'income_tax', 25000),
  CASE u.position
    WHEN '人事部長' THEN 450000 + 45000
    WHEN 'エンジニアリングマネージャー' THEN 500000 + 45000
    WHEN '営業部長' THEN 480000 + 45000
    WHEN 'シニアエンジニア' THEN 420000 + 45000
    ELSE 350000 + 45000
  END,
  CASE u.position
    WHEN '人事部長' THEN 450000 + 45000 - 80000
    WHEN 'エンジニアリングマネージャー' THEN 500000 + 45000 - 80000
    WHEN '営業部長' THEN 480000 + 45000 - 80000
    WHEN 'シニアエンジニア' THEN 420000 + 45000 - 80000
    ELSE 350000 + 45000 - 80000
  END,
  20,
  160,
  FLOOR(RANDOM() * 20),
  'paid',
  DATE_TRUNC('month', month_date) + INTERVAL '24 days'
FROM users u
CROSS JOIN (
  SELECT CURRENT_DATE - INTERVAL '1 month' AS month_date
  UNION ALL
  SELECT CURRENT_DATE - INTERVAL '2 months'
  UNION ALL
  SELECT CURRENT_DATE - INTERVAL '3 months'
) months
WHERE u.status = 'active'
ON CONFLICT (user_id, year, month) DO NOTHING;

-- =========================================
-- 7. 賞与記録（Bonus Records）
-- =========================================

-- 冬季賞与（昨年12月）
INSERT INTO bonus_records (user_id, bonus_type, year, basic_bonus, performance_bonus, deductions, gross_bonus, net_bonus, performance_rating, status, paid_at)
SELECT
  u.id,
  'winter',
  EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '3 months'),
  CASE u.position
    WHEN '人事部長' THEN 900000
    WHEN 'エンジニアリングマネージャー' THEN 1000000
    WHEN '営業部長' THEN 960000
    WHEN 'シニアエンジニア' THEN 840000
    ELSE 700000
  END,
  CASE
    WHEN RANDOM() < 0.2 THEN 150000 -- S評価
    WHEN RANDOM() < 0.5 THEN 100000 -- A評価
    WHEN RANDOM() < 0.8 THEN 50000  -- B評価
    ELSE 20000                       -- C評価
  END,
  jsonb_build_object('income_tax', 150000, 'pension', 50000),
  CASE u.position
    WHEN '人事部長' THEN 900000 + 100000
    WHEN 'エンジニアリングマネージャー' THEN 1000000 + 100000
    WHEN '営業部長' THEN 960000 + 100000
    WHEN 'シニアエンジニア' THEN 840000 + 100000
    ELSE 700000 + 100000
  END,
  CASE u.position
    WHEN '人事部長' THEN 900000 + 100000 - 200000
    WHEN 'エンジニアリングマネージャー' THEN 1000000 + 100000 - 200000
    WHEN '営業部長' THEN 960000 + 100000 - 200000
    WHEN 'シニアエンジニア' THEN 840000 + 100000 - 200000
    ELSE 700000 + 100000 - 200000
  END,
  CASE
    WHEN RANDOM() < 0.2 THEN 'S'
    WHEN RANDOM() < 0.5 THEN 'A'
    WHEN RANDOM() < 0.8 THEN 'B'
    ELSE 'C'
  END,
  'paid',
  (CURRENT_DATE - INTERVAL '3 months')::DATE
FROM users u
WHERE u.status = 'active'
ON CONFLICT DO NOTHING;

-- =========================================
-- 8. PC資産（PC Assets）
-- =========================================

INSERT INTO pc_assets (asset_number, model, manufacturer, assigned_to, status, purchase_date, warranty_end, specifications) VALUES
  ('PC-2023-001', 'MacBook Pro 16inch', 'Apple', 'user-005', 'in_use', '2023-04-01', '2026-03-31', '{"cpu": "M2 Max", "ram": "32GB", "storage": "1TB SSD"}'::jsonb),
  ('PC-2023-002', 'MacBook Pro 14inch', 'Apple', 'user-006', 'in_use', '2023-04-01', '2026-03-31', '{"cpu": "M2 Pro", "ram": "16GB", "storage": "512GB SSD"}'::jsonb),
  ('PC-2023-003', 'MacBook Air 13inch', 'Apple', 'user-007', 'in_use', '2023-05-01', '2026-04-30', '{"cpu": "M2", "ram": "16GB", "storage": "512GB SSD"}'::jsonb),
  ('PC-2022-001', 'ThinkPad X1 Carbon', 'Lenovo', 'user-001', 'in_use', '2022-04-01', '2025-03-31', '{"cpu": "Intel i7-1260P", "ram": "16GB", "storage": "512GB SSD"}'::jsonb),
  ('PC-2022-002', 'ThinkPad X1 Carbon', 'Lenovo', 'user-002', 'in_use', '2022-04-01', '2025-03-31', '{"cpu": "Intel i7-1260P", "ram": "16GB", "storage": "512GB SSD"}'::jsonb),
  ('PC-2024-001', 'MacBook Pro 14inch', 'Apple', NULL, 'available', '2024-01-15', '2027-01-14', '{"cpu": "M3 Pro", "ram": "18GB", "storage": "512GB SSD"}'::jsonb)
ON CONFLICT (asset_number) DO NOTHING;

-- =========================================
-- 9. 車両（Vehicles）
-- =========================================

INSERT INTO vehicles (vehicle_number, make, model, year, assigned_to, status, purchase_date, inspection_date, next_inspection, mileage) VALUES
  ('品川 300 あ 1234', 'Toyota', 'Prius', 2022, 'user-003', 'in_use', '2022-04-01', '2024-04-15', '2026-04-15', 28500),
  ('品川 300 あ 5678', 'Toyota', 'Aqua', 2023, 'user-004', 'in_use', '2023-04-01', '2024-04-20', '2025-04-20', 15200),
  ('品川 300 い 9012', 'Nissan', 'Note', 2021, NULL, 'available', '2021-04-01', '2024-03-10', '2025-03-10', 42300)
ON CONFLICT (vehicle_number) DO NOTHING;

-- =========================================
-- 10. 入社手続き（Onboarding）
-- =========================================

-- 入社予定者のユーザー作成
INSERT INTO users (id, email, name, department, position, roles, status, hireDate) VALUES
  ('user-011', 'applicant01@example.com', '新入太郎', '営業部', '営業担当（入社予定）', ARRAY['applicant'], 'active', CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 入社手続き申請
INSERT INTO onboarding_applications (id, applicant_id, application_status, start_date, department, position, submitted_at) VALUES
  ('onb-001', 'user-011', 'submitted', CURRENT_DATE + INTERVAL '30 days', '営業部', '営業担当', NOW())
ON CONFLICT (id) DO NOTHING;

-- 基本情報フォーム
INSERT INTO onboarding_forms (application_id, form_type, form_data, status, submitted_at) VALUES
  ('onb-001', 'basic_info',
   jsonb_build_object(
     'lastName', '新入',
     'firstName', '太郎',
     'lastNameKana', 'ニュウニュウ',
     'firstNameKana', 'タロウ',
     'birthDate', '1995-04-01',
     'gender', 'male',
     'postalCode', '100-0001',
     'address', '東京都千代田区千代田1-1',
     'phone', '090-1234-5678',
     'emergencyContact', '新入花子',
     'emergencyPhone', '090-8765-4321'
   ),
   'submitted',
   NOW()
  )
ON CONFLICT (application_id, form_type) DO NOTHING;

-- =========================================
-- 完了メッセージ
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '✅ シードデータの投入が完了しました！';
  RAISE NOTICE '📊 ユーザー: 11人';
  RAISE NOTICE '📊 お知らせ: 5件';
  RAISE NOTICE '📊 勤怠記録: 約200件（過去30日分）';
  RAISE NOTICE '📊 休暇申請: 4件';
  RAISE NOTICE '📊 給与記録: 約30件';
  RAISE NOTICE '📊 賞与記録: 約10件';
  RAISE NOTICE '📊 PC資産: 6台';
  RAISE NOTICE '📊 車両: 3台';
  RAISE NOTICE '📊 入社手続き: 1件';
END $$;
