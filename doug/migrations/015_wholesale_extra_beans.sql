-- 取引先限定の銘柄
--
-- 価格表に載せていない豆を、特定の取引先にだけ注文画面へ出すための列。
-- CARBS は基本がブラジル サントスのため、そこだけ表に出す。

ALTER TABLE wholesale_accounts
  ADD COLUMN IF NOT EXISTS extra_beans text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN wholesale_accounts.extra_beans IS
  '価格表外の銘柄で、この取引先にだけ表示・注文を許すもの。app/lib/wholesale.ts の slug。';

UPDATE wholesale_accounts SET extra_beans = ARRAY['brazil-santos'] WHERE code = 'CARBS';
