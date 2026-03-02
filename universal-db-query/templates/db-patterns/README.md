# 数据库查询模板

此目录存放自定义 SQL 查询模板，可通过自然语言调用。

## 模板格式

```sql
-- @name: 模板名称
-- @description: 模板描述
-- @params:
--   param_name: 参数说明（默认值）

-- SQL 语句，使用 :param_name 作为参数占位符
SELECT * FROM table WHERE field = :param_name;
```

## 参数说明

- 使用 `:param_name` 作为参数占位符
- 参数默认值在注释中说明，格式：`参数名 (默认值)`
- 支持使用 `COALESCE(:param, default_value)` 提供默认值

## 示例模板

### 时间范围查询

```sql
-- @name: 每日统计
-- @description: 统计指定日期的数据
-- @params:
--   date: 日期 (CURDATE())

SELECT
    COUNT(*) as total,
    SUM(amount) as sum_amount
FROM orders
WHERE DATE(created_at) = COALESCE(:date, CURDATE());
```

### 状态过滤查询

```sql
-- @name: 订单状态统计
-- @description: 按状态统计订单
-- @params:
--   status: 订单状态 1-待付款 2-已付款 (NULL)

SELECT
    status,
    COUNT(*) as count
FROM orders
WHERE (:status IS NULL OR status = :status)
GROUP BY status;
```

### 多表关联查询

```sql
-- @name: 用户订单详情
-- @description: 查询用户及其订单信息
-- @params:
--   user_id: 用户ID (NULL)
--   limit: 返回条数 (100)

SELECT
    u.id as user_id,
    u.name as user_name,
    o.id as order_id,
    o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE (:user_id IS NULL OR u.id = :user_id)
LIMIT :limit;
```

## 使用方式

在 Claude Code 中输入：

- "运行每日统计"
- "执行订单状态统计，状态是 1"
- "查看用户订单详情，限制 50 条"
