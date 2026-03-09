# 数据库查询模板

此目录存放自定义 SQL 查询模板，可通过自然语言调用。

## 模板格式（Markdown）

```markdown
---
name: 模板名称
description: 模板描述
category: 分类名称
params:
  param_name:
    type: string
    description: 参数说明
    default: 默认值
---

## SQL

```sql
SELECT * FROM table WHERE field = :param_name;
```

## 使用示例

```bash
node scripts/run-pattern.js 模板名称 param_name=value
```
```

## 参数说明

- 使用 `:param_name` 作为参数占位符
- 参数定义在 YAML frontmatter 中
- 支持使用 `COALESCE(:param, default_value)` 提供默认值

## 示例模板

### 时间范围查询

```markdown
---
name: 每日统计
description: 统计指定日期的数据
category: 报表分析
params:
  date:
    type: string
    description: 日期
    default: CURDATE()
---

## SQL

```sql
SELECT
    COUNT(*) as total,
    SUM(amount) as sum_amount
FROM orders
WHERE DATE(created_at) = COALESCE(:date, CURDATE());
```
```

### 状态过滤查询

```markdown
---
name: 订单状态统计
description: 按状态统计订单
category: 订单分析
params:
  status:
    type: number
    description: 订单状态 1-待付款 2-已付款
    default: null
---

## SQL

```sql
SELECT
    status,
    COUNT(*) as count
FROM orders
WHERE (:status IS NULL OR status = :status)
GROUP BY status;
```
```

### 多表关联查询

```markdown
---
name: 用户订单详情
description: 查询用户及其订单信息
category: 订单查询
params:
  user_id:
    type: number
    description: 用户ID
    default: null
  limit:
    type: number
    description: 返回条数
    default: 100
---

## SQL

```sql
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
```

## 使用方式

### 命令行

```bash
# 列出所有模板
node scripts/run-pattern.js --list

# 运行模板
node scripts/run-pattern.js daily-report

# 运行模板并传入参数
node scripts/run-pattern.js daily-report date=2026-03-01
```

### 自然语言

在 Claude Code 中输入：

- "运行每日统计"
- "执行订单状态统计，状态是 1"
- "查看用户订单详情，限制 50 条"
