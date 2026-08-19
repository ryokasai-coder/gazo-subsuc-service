-- ============================================================
-- 解約申請機能 + 無料期間対応マイグレーション（2026-08-19）
-- 本番反映: Supabase SQL Editor（プロジェクト searlfbcbqvqugrtuzhp）で実行
-- 冪等（IF NOT EXISTS / CHECK付き）なので再実行しても安全
-- ============================================================

ALTER TABLE users
  -- 初回契約日（無料期間・次回更新日・利用期限の算出基準）。既存ユーザーは created_at で補完
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  -- 解約ステータス: active=契約中 / cancel_requested=解約申請済み / cancelled=解約済み
  ADD COLUMN IF NOT EXISTS cancellation_status TEXT NOT NULL DEFAULT 'active'
    CHECK (cancellation_status IN ('active', 'cancel_requested', 'cancelled')),
  -- 解約申請日時
  ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMPTZ,
  -- 解約理由（区分キー）
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  -- 解約理由の自由記述（「その他」「サービス内容が合わなかった」等）
  ADD COLUMN IF NOT EXISTS cancel_reason_detail TEXT,
  -- 契約終了日（＝解約後のサービス利用期限。当月末日）
  ADD COLUMN IF NOT EXISTS service_end_date DATE;

-- 既存ユーザーの契約開始日を登録日（created_at）で補完
UPDATE users
  SET contract_start_date = created_at::date
  WHERE contract_start_date IS NULL;

-- 管理画面の解約ステータス絞り込み用インデックス
CREATE INDEX IF NOT EXISTS idx_users_cancellation_status ON users(cancellation_status);
