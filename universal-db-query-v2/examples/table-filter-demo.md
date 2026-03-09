# 表过滤功能演示

本文档演示 universal-db-query-v2 的表过滤功能。

## 使用场景

### 场景1：只允许查询业务表（白名单）

适用于：只暴露部分表给非技术人员使用

```yaml
# udq-config.yaml
options:
  table_filter:
    mode: whitelist
    listed_tables:
      - users
      - orders
      - products
      - categories
```

**效果：**
- ✅ `SELECT * FROM users` - 允许
- ✅ `SELECT * FROM orders` - 允许
- ❌ `SELECT * FROM admin_logs` - 拒绝（未在白名单中）
- ❌ `SELECT * FROM password_hashes` - 拒绝（未在白名单中）

### 场景2：排除敏感表（黑名单）

适用于：排除敏感表，其他表都可以访问

```yaml
# udq-config.yaml
options:
  table_filter:
    mode: blacklist
    listed_tables:
      - admin_logs
      - password_hashes
      - api_keys
      - sessions
```

**效果：**
- ✅ `SELECT * FROM users` - 允许（不在黑名单）
- ✅ `SELECT * FROM orders` - 允许（不在黑名单）
- ❌ `SELECT * FROM admin_logs` - 拒绝（在黑名单中）
- ❌ `SELECT * FROM api_keys` - 拒绝（在黑名单中）

### 场景3：按前缀/后缀过滤（通配符）

适用于：按命名规范批量控制表访问

```yaml
# udq-config.yaml
options:
  table_filter:
    mode: whitelist
    listed_tables:
      - users
      - orders
    patterns:
      - "report_*"      # 允许所有报表表
      - "dim_*"         # 允许所有维度表
      - "*_summary"     # 允许所有汇总表
```

**效果：**
- ✅ `SELECT * FROM users` - 允许（精确匹配）
- ✅ `SELECT * FROM report_daily` - 允许（匹配 report_*）
- ✅ `SELECT * FROM dim_product` - 允许（匹配 dim_*）
- ✅ `SELECT * FROM sales_summary` - 允许（匹配 *_summary）
- ❌ `SELECT * FROM temp_data` - 拒绝（不匹配任何规则）
- ❌ `SELECT * FROM internal_config` - 拒绝（不匹配任何规则）

### 场景4：组合使用

适用于：复杂的数据访问控制

```yaml
# udq-config.yaml
options:
  table_filter:
    mode: whitelist
    listed_tables:
      - users
      - orders
      - products
    patterns:
      - "report_*"
      - "analytics_*"
```

## 错误提示示例

当用户尝试访问未授权的表时，会看到清晰的错误提示：

```
Table access denied: "admin_logs"

Table filter mode: whitelist
Allowed tables: users, orders, products
Pattern rules: report_*, analytics_*

To modify table restrictions, update options.table_filter in ./udq-config.yaml
```

## 元数据发现的影响

启用表过滤后，以下命令只显示允许的表：

```bash
# 只列出白名单中的表
node scripts/list-tables.js

# 只能描述允许的表
node scripts/describe-table.js users   # ✓ 成功
node scripts/describe-table.js secrets # ✗ 失败：表未授权

# Schema 缓存只包含允许的表
node scripts/discover-schema.js
```

## 最佳实践

### 1. 生产环境建议使用白名单

```yaml
options:
  table_filter:
    mode: whitelist
    listed_tables:
      - users
      - orders
      - products
```

更安全，明确知道哪些表可以被访问。

### 2. 开发环境可以使用黑名单

```yaml
options:
  table_filter:
    mode: blacklist
    listed_tables:
      - password_hashes
      - internal_logs
```

方便开发，但排除真正敏感的表。

### 3. 使用通配符简化配置

如果表命名规范，使用通配符减少配置：

```yaml
options:
  table_filter:
    mode: whitelist
    patterns:
      - "public_*"    # 所有公开表
      - "vw_*"        # 所有视图
```

### 4. 与其他安全选项一起使用

```yaml
options:
  readonly_mode: true        # 只允许查询
  max_query_results: 100     # 限制返回行数
  table_filter:
    mode: whitelist
    listed_tables:
      - users
      - orders
```

多层安全保护。
