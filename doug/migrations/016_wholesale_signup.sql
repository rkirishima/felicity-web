-- 業販アカウントの自己申し込み（HP の /wholesale/signup）
--
-- 先方が会社名・店舗名・住所・連絡先・パスワードを自分で入力して申し込む。
-- 申し込んだ時点ではアカウントは active=false で、卸価格は見えない。
-- Telegram に届く承認リンクから承認すると active=true になり、先方に
-- 「ご利用いただけます」のメールが届く。
--
-- 申し込み中:   active=false, approved_at IS NULL
-- 承認済み:     active=true,  approved_at IS NOT NULL
-- 停止:         active=false, approved_at IS NOT NULL

ALTER TABLE wholesale_accounts
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS application_note text,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 既存の取引先は、こちらで発行した時点で承認済みとみなす。
UPDATE wholesale_accounts SET approved_at = created_at WHERE approved_at IS NULL AND active;
