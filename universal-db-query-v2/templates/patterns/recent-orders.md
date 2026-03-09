---
name: 最近订单
description: 查询最近的订单列表
category: 订单查询
params:
  limit:
    type: number
    description: 返回条数
    default: 50
  status:
    type: number
    description: 订单状态，为空则查询所有
    default: null
---

## SQL

```sql
SELECT
    o.id,
    o.order_no,
    u.name as user_name,
    o.amount,
    o.state,
    o.created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE (:status IS NULL OR o.state = :status)
ORDER BY o.created_at DESC
LIMIT :limit;
```

## 使用示例

```bash
# 查询最近 50 条订单
node scripts/run-pattern.js 最近订单

# 查询最近 10 条待付款订单
node scripts/run-pattern.js 最近订单 limit=10 status=1
```
