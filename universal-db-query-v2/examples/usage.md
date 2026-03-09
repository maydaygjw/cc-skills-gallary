# Universal DB Query V2 使用示例

## 配置示例

### MySQL 配置

```yaml
# udq-config.yaml
database:
  type: mysql
  host: localhost
  port: 3306
  user: root
  password: your_password
  database: ecommerce

options:
  cache_enabled: true
  readonly_mode: true
  max_query_results: 1000
```

### PostgreSQL 配置

```yaml
# udq-config.yaml
database:
  type: postgresql
  host: localhost
  port: 5432
  user: postgres
  password: your_password
  database: myapp

options:
  cache_enabled: true
  readonly_mode: true
```

### SQLite 配置

```yaml
# udq-config.yaml
database:
  type: sqlite
  database: ./data/app.db

options:
  readonly_mode: true
```

## CLI 使用示例

### 列出所有表

```bash
$ node universal-db-query-v2/scripts/list-tables.js

Tables:

1. users
   用户表
   8 columns

2. orders
   订单表
   12 columns

3. products
   商品表
   10 columns
```

### 查看表结构

```bash
$ node universal-db-query-v2/scripts/describe-table.js orders

Table: orders
Columns: 12

| Column      | Type        | Nullable | Default | Comment                     |
|-------------|-------------|----------|---------|-----------------------------|
| id          | bigint      | NO       | -       | 订单ID                      |
| order_no    | varchar     | NO       | -       | 订单编号                    |
| user_id     | bigint      | NO       | -       | 用户ID                      |
| state       | tinyint     | NO       | 1       | 状态：1待付款 2已付款 [1:待付款, 2:已付款] |
| amount      | decimal     | NO       | 0.00    | 订单金额                    |
| created_at  | datetime    | NO       | -       | 创建时间                    |

Foreign Keys:
  - user_id → users.id
```

### 执行 SQL 查询

```bash
$ node universal-db-query-v2/scripts/query.js "SELECT COUNT(*) as count FROM orders"

Connected to database.

Results:
| count |
|-------|
| 1542  |

Total rows: 1
```

### 发现 Schema

```bash
$ node universal-db-query-v2/scripts/discover-schema.js --refresh

Connected to database.

Discovering schema for mysql database: ecommerce...
Schema cached to ./.udq-cache/schema.json

=== Schema Summary ===
Database: ecommerce
Type: mysql
Discovered at: 2026-03-06T10:30:00.000Z

Tables: 15
  - users: 8 columns (用户表)
  - orders: 12 columns (订单表)
  - products: 10 columns (商品表)
  ...

Relations: 5
  - orders.user_id → users.id
  - orders.product_id → products.id
  ...
```

### 运行查询模板

```bash
$ node universal-db-query-v2/scripts/run-pattern.js --list

Available patterns:

1. 每日订单报表
   统计每日订单数、金额、退款

2. 最近订单
   查询最近的订单列表
```

```bash
$ node universal-db-query-v2/scripts/run-pattern.js daily-report

Pattern: 每日订单报表
Description: 统计每日订单数、金额、退款

Parameters:
  date: 日期，格式 YYYY-MM-DD = CURDATE()

SQL:
SELECT
    COUNT(*) as total_orders,
    SUM(CASE WHEN state NOT IN (5, 9) THEN money ELSE 0 END) as revenue,
    ...

--- Executing ---

Results:
| total_orders | revenue  | refund_amount | pending_orders | completed_orders |
|--------------|----------|---------------|----------------|------------------|
| 42           | 3580.00  | 120.00        | 8              | 28               |

Total rows: 1
```

## 自然语言查询示例

### 元数据探索

```
用户：数据库有哪些表？
Claude：发现 15 张表：
       1. users (用户表) - 8 个字段
       2. orders (订单表) - 12 个字段
       3. products (商品表) - 10 个字段
       ...

用户：订单表的结构
Claude：orders 表共 12 个字段：
       - id (bigint, PK) - 订单ID
       - order_no (varchar) - 订单编号
       - user_id (bigint) - 用户ID，关联 users.id
       - state (tinyint) - 订单状态：1待付款 2已付款...
       - amount (decimal) - 订单金额
       - created_at (datetime) - 创建时间
       ...
```

### 数据查询

```
用户：今天有多少订单
Claude：今日订单统计：
       SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()
       结果：42 笔

用户：待付款的有哪些
Claude：找到 8 笔待付款订单：
       | 订单号   | 用户    | 金额    | 创建时间           |
       |----------|---------|---------|--------------------|
       | 20240301 | 张三    | 128.00  | 2026-03-06 09:30   |
       | 20240302 | 李四    | 256.50  | 2026-03-06 10:15   |
       ...

用户：订单状态有哪些
Claude：根据字段注释，订单状态如下：
       - 1: 待付款
       - 2: 已付款
       - 3: 待发货
       - 4: 已发货
       - 5: 已完成
       - 6: 已取消
```

### 本地模板

```
用户：运行每日报表
Claude：找到模板「每日订单报表」
       参数：date (默认今天: 2026-03-06)
       是否执行？[是/否/修改参数]

用户：是
Claude：执行中...

       📊 每日订单报表
       =================
       总订单数：42 笔
       营收金额：¥3,580.00
       退款金额：¥120.00
       待付款：8 笔
       已完成：28 笔
```

## 自定义查询模板

创建文件 `./udq-patterns/user-stats.md`：

```markdown
---
name: 用户统计
description: 按注册日期统计用户数
category: 用户分析
params:
  start_date:
    type: string
    description: 开始日期
    default: 2026-01-01
  end_date:
    type: string
    description: 结束日期
    default: CURDATE()
---

## SQL

```sql
SELECT
    DATE(created_at) as date,
    COUNT(*) as new_users
FROM users
WHERE DATE(created_at) BETWEEN :start_date AND :end_date
GROUP BY DATE(created_at)
ORDER BY date DESC;
```
```

使用：

```
用户：运行用户统计
Claude：找到模板「用户统计」
       参数：
         start_date: 开始日期 = 2026-01-01
         end_date: 结束日期 = 2026-03-06

       是否执行？[是]

       执行结果：
       | date       | new_users |
       |------------|-----------|
       | 2026-03-06 | 12        |
       | 2026-03-05 | 8         |
       | 2026-03-04 | 15        |
       ...
```
