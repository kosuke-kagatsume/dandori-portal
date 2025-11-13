-- =========================================
-- HR機能用テーブルの追加
-- =========================================

-- updated_at自動更新関数（存在しない場合のみ作成）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- お知らせ（Announcements）
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('general', 'urgent', 'policy', 'deadline', 'system')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target TEXT DEFAULT 'all' CHECK (target IN ('all', 'department', 'role', 'custom')),
  target_roles TEXT[],
  target_departments TEXT[],
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  action_required BOOLEAN DEFAULT FALSE,
  action_label TEXT,
  action_url TEXT,
  action_deadline DATE,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_published ON announcements(published);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);

-- お知らせ既読状態
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);
CREATE INDEX idx_announcement_reads_announcement ON announcement_reads(announcement_id);

-- 勤怠記録（Attendance Records）
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  work_hours NUMERIC(4, 2),
  overtime_hours NUMERIC(4, 2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date DESC);
CREATE INDEX idx_attendance_date ON attendance_records(date DESC);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- 休暇申請（Leave Requests）
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'special', 'unpaid', 'compensatory')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(3, 1) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_user ON leave_requests(user_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);

-- 休暇残数（Leave Balances）
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  leave_type TEXT NOT NULL,
  total_days NUMERIC(4, 1) NOT NULL,
  used_days NUMERIC(4, 1) DEFAULT 0,
  remaining_days NUMERIC(4, 1) GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, leave_type)
);

CREATE INDEX idx_leave_balance_user_year ON leave_balances(user_id, year);

-- 給与記録（Payroll Records）
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  base_salary NUMERIC(10, 2) NOT NULL,
  allowances JSONB DEFAULT '{}'::JSONB,
  deductions JSONB DEFAULT '{}'::JSONB,
  gross_pay NUMERIC(10, 2) NOT NULL,
  net_pay NUMERIC(10, 2) NOT NULL,
  work_days INTEGER,
  work_hours NUMERIC(6, 2),
  overtime_hours NUMERIC(6, 2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
  paid_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_payroll_user_period ON payroll_records(user_id, year DESC, month DESC);
CREATE INDEX idx_payroll_status ON payroll_records(status);

-- 賞与記録（Bonus Records）
CREATE TABLE IF NOT EXISTS bonus_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_type TEXT CHECK (bonus_type IN ('summer', 'winter', 'special')),
  year INTEGER NOT NULL,
  basic_bonus NUMERIC(10, 2) NOT NULL,
  performance_bonus NUMERIC(10, 2) DEFAULT 0,
  deductions JSONB DEFAULT '{}'::JSONB,
  gross_bonus NUMERIC(10, 2) NOT NULL,
  net_bonus NUMERIC(10, 2) NOT NULL,
  performance_rating TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
  paid_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bonus_user_year ON bonus_records(user_id, year DESC);
CREATE INDEX idx_bonus_type ON bonus_records(bonus_type);
CREATE INDEX idx_bonus_status ON bonus_records(status);

-- 入社手続き申請（Onboarding Applications）
CREATE TABLE IF NOT EXISTS onboarding_applications (
  id TEXT PRIMARY KEY, -- demo-onboarding-001など
  applicant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_status TEXT DEFAULT 'draft' CHECK (application_status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
  start_date DATE,
  department TEXT,
  position TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_applicant ON onboarding_applications(applicant_id);
CREATE INDEX idx_onboarding_status ON onboarding_applications(application_status);

-- 入社手続きフォーム（Onboarding Forms）
CREATE TABLE IF NOT EXISTS onboarding_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id TEXT NOT NULL REFERENCES onboarding_applications(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL CHECK (form_type IN ('basic_info', 'family_info', 'bank_account', 'commute_route')),
  form_data JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'returned')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT REFERENCES users(id),
  return_reason TEXT,
  return_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, form_type)
);

CREATE INDEX idx_onboarding_forms_app ON onboarding_forms(application_id);
CREATE INDEX idx_onboarding_forms_status ON onboarding_forms(status);

-- PC資産（PC Assets）
CREATE TABLE IF NOT EXISTS pc_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_number TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  assigned_to TEXT REFERENCES users(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  purchase_date DATE,
  warranty_end DATE,
  specifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pc_assigned ON pc_assets(assigned_to);
CREATE INDEX idx_pc_status ON pc_assets(status);
CREATE INDEX idx_pc_asset_number ON pc_assets(asset_number);

-- 車両（Vehicles）
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  assigned_to TEXT REFERENCES users(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  purchase_date DATE,
  inspection_date DATE,
  next_inspection DATE,
  mileage INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_assigned ON vehicles(assigned_to);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_number ON vehicles(vehicle_number);

-- =========================================
-- RLS (Row Level Security) ポリシー
-- =========================================

-- お知らせ
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published announcements"
  ON announcements FOR SELECT
  USING (published = true);

CREATE POLICY "HR can manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND ('admin' = ANY(roles) OR position LIKE '%人事%')
    )
  );

CREATE POLICY "Users can view own announcement reads"
  ON announcement_reads FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can mark announcements as read"
  ON announcement_reads FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- 勤怠記録
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance"
  ON attendance_records FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own attendance"
  ON attendance_records FOR UPDATE
  USING (user_id = auth.uid()::text AND status = 'draft');

CREATE POLICY "Managers can view team attendance"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND roles && ARRAY['admin', 'manager']
    )
  );

-- 休暇申請
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leave requests"
  ON leave_requests FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Managers can view team leave requests"
  ON leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND roles && ARRAY['admin', 'manager']
    )
  );

CREATE POLICY "Users can view own leave balances"
  ON leave_balances FOR SELECT
  USING (user_id = auth.uid()::text);

-- 給与・賞与
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payroll"
  ON payroll_records FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "HR can manage payroll"
  ON payroll_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND ('admin' = ANY(roles) OR position LIKE '%人事%')
    )
  );

CREATE POLICY "Users can view own bonus"
  ON bonus_records FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "HR can manage bonus"
  ON bonus_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND ('admin' = ANY(roles) OR position LIKE '%人事%')
    )
  );

-- 入社手続き
ALTER TABLE onboarding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own application"
  ON onboarding_applications FOR SELECT
  USING (applicant_id = auth.uid()::text);

CREATE POLICY "Applicants can update own application"
  ON onboarding_applications FOR UPDATE
  USING (applicant_id = auth.uid()::text);

CREATE POLICY "HR can view all applications"
  ON onboarding_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND ('admin' = ANY(roles) OR position LIKE '%人事%')
    )
  );

CREATE POLICY "Applicants can view own forms"
  ON onboarding_forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_applications
      WHERE id = onboarding_forms.application_id
      AND applicant_id = auth.uid()::text
    )
  );

CREATE POLICY "Applicants can manage own forms"
  ON onboarding_forms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_applications
      WHERE id = onboarding_forms.application_id
      AND applicant_id = auth.uid()::text
    )
  );

-- 資産管理
ALTER TABLE pc_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assigned assets"
  ON pc_assets FOR SELECT
  USING (assigned_to = auth.uid()::text OR assigned_to IS NULL);

CREATE POLICY "Admins can manage assets"
  ON pc_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Users can view own assigned vehicles"
  ON vehicles FOR SELECT
  USING (assigned_to = auth.uid()::text OR assigned_to IS NULL);

CREATE POLICY "Admins can manage vehicles"
  ON vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND 'admin' = ANY(roles)
    )
  );

-- =========================================
-- トリガー設定
-- =========================================

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonus_records_updated_at BEFORE UPDATE ON bonus_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_applications_updated_at BEFORE UPDATE ON onboarding_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_forms_updated_at BEFORE UPDATE ON onboarding_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pc_assets_updated_at BEFORE UPDATE ON pc_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
