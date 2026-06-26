@AGENTS.md

# DESIGN BOX（画像制作サブスクサービス）

## プロジェクト概要
月額2万円・月10回の画像制作サブスクサービス。申込〜制作管理〜納品〜請求まで一元管理。

**パス:** `C:\Users\ryo19\gazo-subsuc-service`
**期限:** 2026-07-01（最優先・7/1公開）
**本番URL:** https://gazo-subsuc-service.vercel.app
**GitHub:** https://github.com/ryokasai-coder/gazo-subsuc-service

## 技術スタック
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (DB + Auth + RLS) — SupabaseプロジェクトID: `searlfbcbqvqugrtuzhp`
- Resend（メール） — `lib/resend.ts`
- Vercel Cron Jobs（毎朝9時リマインダー）
- `npm run dev`で起動（port 3001）

## 環境変数（.env.localに定義済み）
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- ADMIN_EMAIL=ryo.kasai@funrix.co.jp
- CRON_SECRET=gazo-subsuc-secret-2024

## DBスキーマ（主要テーブル）
- `users`: id, email, login_id, billing_code, role, is_payment_registered, is_active
- `image_requests`: 依頼管理（production_types[], design_image, template_id, status, ...）
- `usage_limits`: user_id, billing_month, total_limit=10, used_count
- `billing_records`: invoice_number UNIQUE, clearing_status, billing_amount
- `billing_contracts`: billing_info_number UNIQUE, billing_type
- `reminder_logs`: 重複防止（user_id, billing_month, threshold_day — UNIQUE）

## ページ構成
| URL | 内容 |
|-----|------|
| / | LP（ヒーロー・料金・ギャラリー・FAQ）|
| /apply | 申し込みフォーム（3ステップ）|
| /login | お客様ログイン（お客様番号+PW）|
| /dashboard | ダッシュボード（依頼一覧・残数）|
| /admin | 管理者トップ |
| /admin/projects | 案件管理 |
| /admin/billing | 請求管理・CSVインポート |

## ログイン仕様
- お客様: login_id（C-0001形式）+ パスワード → `/api/auth/login` でメール変換→Supabase認証
- 管理者: login_id（ADMIN-001）+ パスワード → adminロールは決済登録チェックスキップ

## 次のタスク（7/1公開に向けた残作業）
1. **本番動作確認** — `npm run build` でエラーなし確認・Vercel本番デプロイ確認
2. **LP最終調整** — コンテンツ・FAQの最終文言確認
3. **管理者フロー確認** — 依頼ステータス更新・納品処理・CSVインポートの動作確認
4. **リマインダーCron確認** — Vercel Cronが`/api/cron/reminder`を毎朝9時に叩けているか確認
5. **申し込みフォームE2Eテスト** — 新規申し込み→ログイン→依頼→管理画面で確認できるか

## コーディング規約
- TypeScript（型明示）・ES modules
- App Router（`use client`は最小限）
- 日本語コメントOK・変数名は英語
- 型定義は `types/` フォルダまたはファイル末尾に

## 開発基本方針（適用メモ）
- **集計ロジック確認必須:** 使用回数カウント（`used_count` vs `total_limit=10`）・月次リセット判定・請求金額計算・残数算出の算出式をコメントで明示する
- **保存先:** 請求CSV等の出力は `H:\マイドライブ\Funrix\` に保存。Google Drive MCP経由でアップロード
- **Google API:** リマインダーメールはGmail APIへの移行を中長期で検討（現在: Resend）
- **自動化:** Vercel Cron（毎朝9時リマインダー `/api/cron/reminder`）実装済み。追加処理も同様にCron化
