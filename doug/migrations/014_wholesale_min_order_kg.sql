-- 最低ロットを取引先ごとに持たせる
--
-- 既定は3kg。価格表は「1回 2kg〜」だが、運用上は3kgから縛る方針に決定。
-- 事情のある取引先だけ個別に下げる（CARBS は近所への直接お届けで1kg）。

ALTER TABLE wholesale_accounts
  ADD COLUMN IF NOT EXISTS min_order_kg int NOT NULL DEFAULT 3;

ALTER TABLE wholesale_accounts
  ADD CONSTRAINT wholesale_accounts_min_order_kg_check CHECK (min_order_kg >= 1);

COMMENT ON COLUMN wholesale_accounts.min_order_kg IS
  '1回のご注文の最低数量(kg)。既定3kg、ご要望に応じて取引先ごとに変更する。';

UPDATE wholesale_accounts SET min_order_kg = 1 WHERE code = 'CARBS';
