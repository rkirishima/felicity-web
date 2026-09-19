-- 業販価格は価格表どおりに統一する（旭興産を除く）
--
-- 012 では JOLT に旧グレード価格（¥5,200 / ¥6,000）を銘柄別へ引き継いだが、
-- 今後は価格表の銘柄別卸価格で一本化する方針に決定。個別のお取り決め価格を
-- 残すのは旭興産（PNG バロイダ ¥10,000/kg・小売同額）のみ。

UPDATE wholesale_accounts
SET special_prices = '{}'::jsonb
WHERE code <> 'ASAHIKOSAN';
