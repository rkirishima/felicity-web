-- 業販の価格を「グレード×数量ティア」から「銘柄別の卸価格」へ
--
-- 2026年の WHOLESALE GUIDE が銘柄ごとの単価で出ているため、数量で単価が動く
-- ラダーは廃止。取引先ごとのお取り決め価格も、グレード単位ではなく銘柄単位で
-- 持つ（slug → 税抜/kg）。
--
-- special_price_economy / standard / premium は読まなくなるが、移行元の記録
-- として残す。消すのは取引先全員の銘柄別価格が確定してから。

ALTER TABLE wholesale_accounts
  ADD COLUMN IF NOT EXISTS special_prices jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN wholesale_accounts.special_prices IS
  '取引先ごとのお取り決め単価。{"<bean slug>": <税抜/kg>}。空なら価格表の銘柄別卸価格。';
COMMENT ON COLUMN wholesale_accounts.special_price_economy IS
  '非推奨（旧グレード価格）。special_prices へ移行済み。';
COMMENT ON COLUMN wholesale_accounts.special_price_standard IS
  '非推奨（旧グレード価格）。special_prices へ移行済み。';
COMMENT ON COLUMN wholesale_accounts.special_price_premium IS
  '非推奨（旧グレード価格）。special_prices へ移行済み。';

-- 旭興産: PNG バロイダ 18kg/月を小売同額の ¥10,000/kg で継続。
UPDATE wholesale_accounts
SET special_prices = '{"png-baroida": 10000}'::jsonb
WHERE code = 'ASAHIKOSAN';

-- JOLT the COFFEE: 提示済みの ¥5,200（旧スタンダード）/ ¥6,000（旧プレミアム＝
-- デカフェ）を、当時そのグレードだった銘柄へそのまま引き継ぐ。価格表から
-- 新しく加わった銘柄（イエメン・グアルバドール・ゲイシャ）は定価。
UPDATE wholesale_accounts
SET special_prices = '{
  "png-baroida": 5200,
  "ethiopia-yirgacheffe-g1": 5200,
  "tanzania-mwika": 5200,
  "guatemala-la-cupula": 5200,
  "india-attikan": 5200,
  "el-salvador-la-fany": 5200,
  "brazil-santa-alina": 5200,
  "colombia-decaf": 6000
}'::jsonb
WHERE code = 'JOLT';
