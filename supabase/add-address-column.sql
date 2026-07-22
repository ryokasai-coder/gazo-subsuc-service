-- 追加マイグレーション：users.address（店舗住所）
-- 用途：画像制作フォームで「店舗名・住所・電話番号」を登録情報から自動入力する機能で使用。
-- 本番Supabaseで一度だけ実行してください（schema.sql にも反映済み）。
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
