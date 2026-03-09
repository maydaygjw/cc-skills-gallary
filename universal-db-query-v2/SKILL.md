---
name: universal-db-query-v2
description: Standalone database query skill. Natural language to SQL with automatic schema discovery. Use for any database query tasks.
---

# Universal DB Query V2

智能数据库查询助手。直接连接数据库，通过自然语言查询。

---

## 快速开始

### 1. 配置文件

配置文件支持多个位置，按优先级查找：

1. 环境变量 `UDQ_CONFIG_PATH`（最高优先级）
2. 项目根目录 `udq-config.yaml`
3. 项目根目录 `.config/udq-config.yaml`
4. 用户家目录 `~/.config/udq/config.yaml`
5. 回退：当前目录 `./udq-config.yaml`

> **建议**：将配置文件放在项目根目录 `udq-config.yaml` 或使用环境变量指定路径。

```yaml
database:
  type: mysql              # mysql | postgresql | sqlite
  host: localhost
  port: 3306
  user: your_username
  password: your_password
  database: your_db_name

options:
  readonly_mode: true      # 推荐保持只读
  cache_enabled: true
```

### 2. 使用方式

```
- "数据库有哪些表？"
- "订单表的结构"
- "查询昨天的销售数据"
- "运行xx报表"
```

---

## 工作流

```
用户提问
    ↓
Pattern 匹配 (udq-patterns/*.md)
    ↓
匹配成功 → 按 Pattern 文档执行
    ↓
匹配失败 → 元数据解析 + 意图识别
```

### Pattern 匹配

**重要：使用语义匹配而非关键词匹配！**

当用户提出数据库查询需求时，你应该：
1. 读取 Pattern 目录下的所有 Pattern 文件
2. **语义理解**用户的查询意图
3. 选择语义最匹配的 Pattern（即使没有精确的关键词重叠）
4. 从用户查询中语义提取参数值（如"昨天"、"前5名"、"氧气学长"等）

Pattern 目录支持多个位置，按优先级查找：

1. 环境变量 `UDQ_PATTERNS_PATH`（最高优先级）
2. 项目根目录 `udq-patterns/`
3. 项目根目录 `.config/udq/patterns/`
4. 用户家目录 `~/.config/udq/patterns/`
5. 回退：Skill 内置 `udq-patterns/`

文件名即 Pattern 名称。

匹配规则：
- 扫描所有 Pattern 的 frontmatter
- 按 `triggers` 关键词匹配
- 匹配成功则按 Pattern 定义执行（参考 Pattern 文档）

### 兜底处理

无 Pattern 匹配时：
| 用户提问 | 处理 |
|---------|------|
| "有哪些表" | 返回表列表 |
| "表结构" | 返回字段详情 |
| 统计查询 | 自动生成 COUNT/SUM |
| 条件查询 | 解析 WHERE 条件 |
| 时间过滤 | 识别时间字段 |

---

## 功能配置

### 表过滤

```yaml
options:
  table_filter:
    mode: whitelist  # whitelist | blacklist
    listed_tables: [表名...]
    patterns: ["app_*", "*_backup"]
```

### 注释覆盖

```yaml
options:
  comments:
    tables:
      orders: "订单表"
    columns:
      "orders.state": "状态：1待付款 2已完成"
```

### 缓存

缓存位置按以下优先级查找：

1. 环境变量 `UDQ_CACHE_PATH`（最高优先级）
2. 项目根目录 `.udq-cache/`
3. 项目根目录 `.config/udq/cache/`
4. 用户家目录 `~/.cache/udq/`
5. 回退：当前目录 `./.udq-cache/`

- 刷新指令："刷新缓存"、"更新表结构"
- 配置 `cache_ttl_hours: 0` 可禁用自动失效

---

## 安全

只读模式仅允许：`SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN`, `PRAGMA`

拒绝：`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`

---

## 故障排除

| 错误 | 解决方案 |
|-----|---------|
| 配置文件不存在 | 创建 `udq-config.yaml` 或设置 `UDQ_CONFIG_PATH` |
| 连接失败 | 检查 host/port/user/password |
| 权限不足 | 确认有 INFORMATION_SCHEMA 读取权限 |