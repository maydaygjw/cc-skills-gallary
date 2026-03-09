---
name: 每日订单报表
description: 统计每日订单数、金额、退款
category: 报表分析
params:
  date:
    type: string
    description: 日期，格式 YYYY-MM-DD
    default: CURDATE()
---

## SQL

```sql
SELECT
    COUNT(*) as total_orders,
    SUM(CASE WHEN state NOT IN (5, 9) THEN money ELSE 0 END) as revenue,
    SUM(CASE WHEN state IN (6, 7) THEN money ELSE 0 END) as refund_amount,
    COUNT(CASE WHEN state = 1 THEN 1 END) as pending_orders,
    COUNT(CASE WHEN state = 4 THEN 1 END) as completed_orders
FROM orders
WHERE DATE(created_at) = COALESCE(:date, CURDATE())
  AND type IN (1, 2);
```

## 状态说明

| 状态码 | 含义 |
|--------|------|
| 1 | 待付款 |
| 4 | 已完成 |
| 5, 9 | 无效/取消 |
| 6, 7 | 退款相关 |
