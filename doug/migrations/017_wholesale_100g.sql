-- 業販を100g単位で注文できるように
--
-- これまで数量は1kg単位の整数だった。0.1kg（100g）刻みを入れるため、
-- 合計数量を小数1桁まで持てる型にする。明細(items jsonb)の kg はもともと数値。
ALTER TABLE wholesale_orders
  ALTER COLUMN total_kg TYPE numeric(7,1) USING total_kg::numeric(7,1);
