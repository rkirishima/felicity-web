-- 業販ログインを「取引先コード」から「メールアドレス」へ
--
-- `code` はそのまま主キー・注文の外部キーとして残す。変わるのはログイン画面で
-- 何を打つかだけで、セッションにも注文にも従来どおり code が入る。
--
-- 照合は小文字に正規化した完全一致で行う。ILIKE は `_` と `%` をワイルドカード
-- として扱い、メールアドレスにはどちらも使えてしまうため採用しない。かわりに
-- 保存時点で小文字に揃え、それを CHECK で強制する。

-- 既存行を先に正規化してから制約をかける。
UPDATE wholesale_accounts SET email = lower(btrim(email)) WHERE email <> lower(btrim(email));

ALTER TABLE wholesale_accounts
  ADD CONSTRAINT wholesale_accounts_email_lowercase CHECK (email = lower(email));

-- ログインIDになるので重複は許さない。
ALTER TABLE wholesale_accounts
  ADD CONSTRAINT wholesale_accounts_email_key UNIQUE (email);
