# Dandori Portal - データベース設計書

## 概要

このドキュメントは、Dandori PortalのSupabaseデータベーススキーマを定義します。
現在localStorageで管理されているデータを、Supabaseに移行するための設計です。

## データベース構成

### 1. 認証関連テーブル

#### users（ユーザー）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_kana TEXT,
  department TEXT,
  position TEXT,
  roles TEXT[] DEFAULT ARRAY['employee']::TEXT[],
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'retired')),
  retired_date DATE,
  retirement_reason TEXT,
  hired_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department ON users(department);
```

#### user_profiles（ユーザープロフィール拡張）
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  postal_code TEXT,
  birth_date DATE,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 組織関連テーブル

#### organizations（組織）
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES organizations(id),
  type TEXT CHECK (type IN ('company', 'department', 'team')),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_parent ON organizations(parent_id);
```

### 3. 勤怠関連テーブル

#### attendance_records（勤怠記録）
```sql
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_attendance_date ON attendance_records(date);
```

### 4. 休暇関連テーブル

#### leave_requests（休暇申請）
```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'special', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(3, 1) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_user ON leave_requests(user_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);
```

#### leave_balances（休暇残数）
```sql
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
```

### 5. ワークフロー関連テーブル

#### workflow_requests（ワークフロー申請）
```sql
CREATE TABLE workflow_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('leave', 'overtime', 'expense', 'purchase', 'trip', 'other')),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
  current_step INTEGER DEFAULT 0,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_requester ON workflow_requests(requester_id);
CREATE INDEX idx_workflow_status ON workflow_requests(status);
CREATE INDEX idx_workflow_type ON workflow_requests(request_type);
```

#### approval_steps（承認ステップ）
```sql
CREATE TABLE approval_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workflow_id, step_number, approver_id)
);

CREATE INDEX idx_approval_workflow ON approval_steps(workflow_id);
CREATE INDEX idx_approval_approver ON approval_steps(approver_id);
```

### 6. 給与関連テーブル

#### payroll_records（給与記録）
```sql
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  base_salary NUMERIC(10, 2) NOT NULL,
  allowances JSONB DEFAULT '{}'::JSONB,
  deductions JSONB DEFAULT '{}'::JSONB,
  gross_pay NUMERIC(10, 2) NOT NULL,
  net_pay NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
  paid_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_payroll_user_period ON payroll_records(user_id, year, month);
```

#### bonus_records（賞与記録）
```sql
CREATE TABLE bonus_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_bonus_user_year ON bonus_records(user_id, year);
```

### 7. お知らせ関連テーブル

#### announcements（お知らせ）
```sql
CREATE TABLE announcements (
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
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_published ON announcements(published);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
```

#### announcement_reads（お知らせ既読状態）
```sql
CREATE TABLE announcement_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);
```

### 8. 入社手続き関連テーブル

#### onboarding_applications（入社申請）
```sql
CREATE TABLE onboarding_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_status TEXT DEFAULT 'draft' CHECK (application_status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
  start_date DATE,
  department TEXT,
  position TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_applicant ON onboarding_applications(applicant_id);
CREATE INDEX idx_onboarding_status ON onboarding_applications(application_status);
```

#### onboarding_forms（入社フォーム）
```sql
CREATE TABLE onboarding_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES onboarding_applications(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL CHECK (form_type IN ('basic_info', 'family_info', 'bank_account', 'commute_route')),
  form_data JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'returned')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  return_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(application_id, form_type)
);

CREATE INDEX idx_onboarding_forms_app ON onboarding_forms(application_id);
```

### 9. 資産管理関連テーブル

#### pc_assets（PC資産）
```sql
CREATE TABLE pc_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_number TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  purchase_date DATE,
  warranty_end DATE,
  specifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pc_assigned ON pc_assets(assigned_to);
CREATE INDEX idx_pc_status ON pc_assets(status);
```

#### vehicles（車両）
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  assigned_to UUID REFERENCES users(id),
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
```

### 10. 通知関連テーブル

#### notifications（通知）
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_important BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

## Row Level Security (RLS) ポリシー

各テーブルにRLSポリシーを設定し、ユーザーが自分のデータのみにアクセスできるようにします。

### 基本ポリシー例（usersテーブル）

```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分のデータは閲覧可能
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 自分のデータは更新可能
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- HRロールは全ユーザー閲覧可能
CREATE POLICY "HR can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND 'hr' = ANY(roles)
    )
  );
```

## データ移行戦略

1. **Phase 1**: 認証システム（users, user_profiles）
2. **Phase 2**: 組織管理（organizations）
3. **Phase 3**: 勤怠・休暇（attendance_records, leave_requests, leave_balances）
4. **Phase 4**: ワークフロー（workflow_requests, approval_steps）
5. **Phase 5**: 給与（payroll_records, bonus_records）
6. **Phase 6**: お知らせ（announcements, announcement_reads）
7. **Phase 7**: 入社手続き（onboarding_applications, onboarding_forms）
8. **Phase 8**: 資産管理（pc_assets, vehicles）
9. **Phase 9**: 通知（notifications）

## 次のステップ

1. Supabaseプロジェクトの作成
2. 上記SQLスクリプトの実行
3. 環境変数の設定（`.env.local`）
4. Supabaseクライアントの設定
5. 各ストアの段階的な移行
