-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  login_id TEXT NOT NULL UNIQUE,
  billing_code TEXT UNIQUE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  plan_type TEXT DEFAULT 'basic',
  is_payment_registered BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 画像依頼テーブル
CREATE TABLE IF NOT EXISTS image_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,
  production_types TEXT[],
  production_purpose TEXT[],
  design_image TEXT,
  target TEXT,
  media_types TEXT[],
  image_size TEXT,
  custom_size TEXT,
  text_content TEXT,
  material_urls TEXT[],
  reference_urls TEXT[],
  cta_action TEXT,
  delivery_speed TEXT,
  other_requests TEXT,
  template_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'cancelled')),
  slack_notified_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- テンプレートテーブル
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  preview_url TEXT,
  file_url TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 月次利用制限テーブル
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,
  total_limit INTEGER DEFAULT 10,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, billing_month)
);

-- リマインドメール送信履歴（重複送信防止）
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,
  threshold_day INTEGER NOT NULL,
  required_count INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, billing_month, threshold_day)
);

-- 請求明細テーブル（請求管理ロボ：請求明細CSV）
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_name TEXT,
  billing_code TEXT,
  invoice_number TEXT UNIQUE,
  product_code TEXT,
  product_name TEXT,
  period_start DATE,
  period_end DATE,
  unit_price NUMERIC,
  quantity NUMERIC,
  subtotal INTEGER,
  tax_excluded INTEGER,
  tax_amount INTEGER,
  billing_amount INTEGER,
  payment_due DATE,
  payment_date DATE,
  clearing_status TEXT,
  deposit_date DATE,
  notes TEXT,
  billing_month TEXT,
  sales_date DATE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 請求情報テーブル（請求管理ロボ：請求情報CSV）
CREATE TABLE IF NOT EXISTS billing_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_info_number TEXT UNIQUE,
  billing_code TEXT,
  billing_dept_code TEXT,
  product_code TEXT,
  billing_type TEXT,
  billing_method TEXT,
  repeat_cycle INTEGER,
  service_start_date DATE,
  repeat_count TEXT,
  remaining_count TEXT,
  remaining_amount TEXT,
  aggregate_product_code TEXT,
  product_name TEXT,
  unit_price NUMERIC,
  quantity NUMERIC,
  tax_rate INTEGER,
  notes TEXT,
  memo TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- フィードバックテーブル
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  design_quality INTEGER CHECK (design_quality BETWEEN 1 AND 5),
  speed_rating INTEGER CHECK (speed_rating BETWEEN 1 AND 5),
  comment TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, billing_month)
);

-- RLS ポリシー
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_self" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "requests_self" ON image_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "usage_self" ON usage_limits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "billing_self" ON billing_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback_self" ON feedbacks FOR ALL USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_image_requests_user_id ON image_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_image_requests_billing_month ON image_requests(billing_month);
CREATE INDEX IF NOT EXISTS idx_image_requests_status ON image_requests(status);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_billing ON usage_limits(user_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_billing_records_code ON billing_records(billing_code);
CREATE INDEX IF NOT EXISTS idx_billing_records_status ON billing_records(clearing_status);
CREATE INDEX IF NOT EXISTS idx_billing_records_month ON billing_records(billing_month);
CREATE INDEX IF NOT EXISTS idx_billing_contracts_code ON billing_contracts(billing_code);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user ON reminder_logs(user_id, billing_month);
