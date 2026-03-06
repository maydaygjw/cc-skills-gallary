# Universal DB Query Skill

智能数据库查询助手。通过自然语言查询数据库，自动发现元数据，推断业务逻辑。

---

## 快速开始

### 1. 配置数据库连接

在项目根目录创建 `./udq-config.yaml`：

```yaml
database:
  mcp_server: DBHub      # MCP 服务器名称
  schema: your_db_name   # 数据库名

options:
  cache_enabled: true
  readonly_mode: true    # 推荐保持只读
```

### 2. 开始使用

- "数据库有哪些表？"
- "订单表的结构"
- "今天有多少订单"
- "待付款的订单有哪些"

---

## 核心工作流

### 初始化流程

```
用户提问涉及数据库
    ↓
读取 ./udq-config.yaml
    ↓
配置不存在 → 引导用户创建（交互式）
配置存在   → 继续
    ↓
检查 Schema 缓存
    ↓
缓存有效 → 使用缓存
缓存缺失/过期 → 自动发现元数据并缓存
    ↓
处理用户请求
```

### 元数据发现流程

**Step 1: 获取表列表**

```yaml
工具: mcp__DBHub__search_objects
参数:
  schema: {config.database.schema}
```

**Step 2: 获取字段详情**

```yaml
工具: mcp__DBHub__execute_sql
SQL: |
  SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_COMMENT,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    ORDINAL_POSITION
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = :schema
  ORDER BY TABLE_NAME, ORDINAL_POSITION
```

**Step 3: 获取外键关系**

```yaml
工具: mcp__DBHub__execute_sql
SQL: |
  SELECT
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = :schema
    AND REFERENCED_TABLE_NAME IS NOT NULL
```

**Step 4: 解析枚举值（从注释）**

解析模式：
- `1:值1 2:值2` → 状态映射
- `1.值1 2.值2` → 状态映射
- `1-值1 2-值2` → 状态映射
- `是否xx(1是2否)` → 布尔映射
- `xx(1 是 2 否)` → 布尔映射

**Step 5: 保存缓存**

```yaml
位置: ./.udq-cache/schema.json
格式:
  database: string
  discovered_at: ISO8601
  tables:
    [table_name]:
      columns: [...]
      comment: string
      enums: {field: {value: label}}
  relations: [...]
```

---

## 查询处理

### 意图识别与处理

| 用户提问模式 | 识别意图 | 处理方式 |
|------------|---------|---------|
| "有哪些表" / "表列表" | 元数据探索 | 返回表名列表（带注释） |
| "xx表结构" / "xx表字段" | 表结构查询 | 返回字段详情（名称、类型、注释、枚举值） |
| "xx表有多少数据" | 统计查询 | COUNT(*) |
| "今天/昨天/本周的xx" | 时间过滤查询 | 识别时间字段，生成日期过滤 |
| "待付款/已完成/取消的xx" | 状态过滤查询 | 从注释解析状态值，生成 WHERE 条件 |
| "最新的xx" / "最近的xx" | 排序限制查询 | ORDER BY 时间字段 DESC LIMIT |
| "运行xx报表" / "执行xx模板" | 本地模板 | 加载 ./udq-patterns/ 下的 SQL 文件 |

### SQL 生成规则

**时间字段识别**
```yaml
匹配模式: [create|update|delete]_time, [created|updated|deleted]_at, *_date
示例:
  "今天的订单" → WHERE DATE(created_at) = CURDATE()
  "本周的订单" → WHERE YEARWEEK(created_at) = YEARWEEK(NOW())
  "3月的订单" → WHERE MONTH(created_at) = 3
```

**状态字段识别**
```yaml
匹配模式: *_status, *_state, type, pay_type
处理:
  1. 从缓存中获取字段枚举值
  2. 模糊匹配用户输入与枚举标签
  3. 生成 WHERE field = value

示例:
  用户: "待付款订单"
  缓存: orders.state {"1": "待付款", "2": "已付款"}
  生成: WHERE state = 1
```

**关联查询识别**
```yaml
输入: "用户和订单关联" / "用户订单"
处理:
  1. 从缓存获取外键关系
  2. 建议 JOIN 语法
  3. 说明关联字段
```

---

## 本地查询模板

### 模板目录

`./udq-patterns/*.sql`

### 模板格式

```sql
-- @name: 模板名称（用于匹配用户请求）
-- @description: 模板描述
-- @params:
--   param_name: 参数说明（默认值）

SELECT ...
FROM table
WHERE field = :param_name;
```

### 模板匹配流程

```
用户: "运行每日报表"
    ↓
扫描 ./udq-patterns/*.sql
    ↓
匹配 @name 包含 "每日" 或 "报表"
    ↓
解析 @params
    ↓
提示用户确认参数值
    ↓
替换参数（:param → 值）
    ↓
执行并返回结果
```

---

## 安全规则

### 只读模式（默认开启）

只允许以下 SQL 开头：
- `SELECT`
- `SHOW`
- `DESCRIBE`
- `EXPLAIN`

拒绝：
- `INSERT` / `UPDATE` / `DELETE`
- `DROP` / `TRUNCATE`
- `ALTER` / `CREATE`
- 多语句执行（;分隔）

### 查询限制

- 默认 LIMIT 1000（可通过配置调整）
- 无 LIMIT 的查询自动添加
- 超时查询提示优化

---

## 缓存管理

### 刷新缓存

用户说以下任意指令时刷新：
- "刷新数据库缓存"
- "更新表结构"
- "重新发现元数据"
- "schema 变了"

### 缓存失效

- 超过 `cache_ttl_hours` 自动失效（设置为 0 则永久有效，需手动刷新）
- 数据库连接失败时尝试刷新

---

## 示例对话

### 元数据探索

```
用户：数据库有哪些表？
AI：发现 15 张表：
     1. users (用户表) - 12 个字段
     2. orders (订单表) - 28 个字段
     3. products (商品表) - 15 个字段
     ...

用户：订单表的结构
AI：orders 表共 28 个字段：
     - id (bigint, PK) - 订单ID
     - order_no (varchar) - 订单编号
     - user_id (bigint) - 用户ID，关联 users.id
     - state (tinyint) - 订单状态：1待付款 2待结单 3等待送达...
     - amount (decimal) - 订单金额
     - created_at (datetime) - 创建时间
     ...
```

### 数据查询

```
用户：今天有多少订单
AI：今日订单统计：
     SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()
     结果：42 笔

用户：待付款的有哪些
AI：SELECT * FROM orders WHERE state = 1 ORDER BY created_at DESC LIMIT 100
     | 订单号 | 用户 | 金额 | 创建时间 |
     |--------|-----|-----|---------|
     | ...    | ... | ... | ...     |

用户：订单状态有哪些
AI：根据字段注释，订单状态如下：
     - 1: 待付款
     - 2: 待结单
     - 3: 等待送达
     - 4: 已完成
     - 5: 已取消
     - 6: 退款中
     - 7: 已退款
     - 8: 退款拒绝
     - 9: 已关闭
```

### 本地模板

```
用户：运行每日报表
AI：找到模板「每日订单统计」
     参数：date (默认今天: 2026-03-02)
     是否执行？[是/否/修改参数]

用户：是
AI：执行中...
     今日订单：42 笔
     今日营收：¥3,580.00
     今日退款：¥120.00
```

---

## 故障排除

### 配置不存在

```
用户：查询订单
AI：未找到数据库配置。请创建 ./udq-config.yaml：

     database:
       mcp_server: DBHub
       schema: your_database_name
```

### MCP 连接失败

```
AI：无法连接数据库，请检查：
     1. MCP 服务器是否运行
     2. config.yaml 中的 mcp_server 名称是否正确
     3. 数据库连接信息是否正确
```

### 元数据发现失败

```
AI：元数据发现失败，尝试以下方案：
     1. 检查数据库权限（需要读取 INFORMATION_SCHEMA）
     2. 手动刷新缓存："刷新数据库缓存"
     3. 检查配置中的 schema 名称是否正确
```
