-- @name: 每日订单报表
-- @description: 统计每日订单数、金额、退款
-- @params:
--   date: 日期，格式 YYYY-MM-DD (CURDATE())

SELECT
    COUNT(*) as total_orders,
    SUM(CASE WHEN state NOT IN (5, 9) THEN money ELSE 0 END) as revenue,
    SUM(CASE WHEN state IN (6, 7) THEN money ELSE 0 END) as refund_amount,
    COUNT(CASE WHEN state = 1 THEN 1 END) as pending_orders,
    COUNT(CASE WHEN state = 4 THEN 1 END) as completed_orders
FROM ims_cjdc_order
WHERE DATE(time) = COALESCE(:date, CURDATE())
  AND type IN (1, 2);
