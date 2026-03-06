# Universal DB Query Skill

智能数据库查询助手。通过自然语言查询数据库，自动发现元数据，推断业务逻辑。

## 功能特性

- **自动元数据发现** - 自动获取表结构、字段注释、外键关系
- **智能业务推断** - 从字段注释解析状态枚举值（如 `1:待付款 2:已付款`）
- **自然语言查询** - "今天有多少订单" → 自动生成 SQL
- **本地查询模板** - 支持自定义 SQL 模板，通过自然语言调用
- **Schema 缓存** - 缓存元数据，避免重复查询

## 快速开始

### 1. 配置 DBHub MCP Server

在 Claude Code 配置文件（`~/.claude/settings.json` 或项目 `.claude/settings.local.json`）中添加：

```json
{
  "mcpServers": {
    "DBHub": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub"],
      "env": {
        "DB_TYPE": "mysql",
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_USER": "your_username",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "your_database",
        "READONLY": "true"
      }
    }
  }
}
```

**配置参数说明**

| 参数 | 说明 | 示例 |
|-----|------|-----|
| `DB_TYPE` | 数据库类型 | `mysql`, `postgresql`, `sqlite`, `sqlserver` |
| `DB_HOST` | 数据库主机 | `localhost`, `127.0.0.1` |
| `DB_PORT` | 数据库端口 | `3306` (MySQL), `5432` (PostgreSQL) |
| `DB_USER` | 用户名 | `root`, `admin` |
| `DB_PASSWORD` | 密码 | - |
| `DB_NAME` | 数据库名 | `newmall`, `myapp` |
| `READONLY` | 只读模式 | `true` (推荐), `false` |

### 2. 配置 Skill

在项目根目录创建 `./udq-config.yaml`：

```yaml
database:
  mcp_server: DBHub
  schema: your_database

options:
  cache_enabled: true
  readonly_mode: true
  max_query_results: 1000
```

### 3. 开始使用

配置完成后，使用自然语言查询：

| 用户输入 | 说明 |
|---------|------|
| "数据库有哪些表？" | 列出所有表 |
| "订单表的结构" | 查看表字段详情 |
| "今天有多少订单" | 时间统计查询 |
| "待付款的订单有哪些" | 状态过滤查询 |
| "运行每日报表" | 执行本地模板 |

## 使用示例

### 元数据探索

```
用户：数据库有哪些表？
Claude：发现 15 张表：
       1. users (用户表) - 12 个字段
       2. orders (订单表) - 28 个字段
       3. products (商品表) - 15 个字段
       ...

用户：订单状态有哪些？
Claude：根据数据库字段注释：\n       state 字段取值：
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

### 数据查询

```
用户：今天有多少订单？
Claude：SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()
       结果：42 笔

用户：待付款的订单有哪些？
Claude：SELECT * FROM orders WHERE state = 1 ORDER BY created_at DESC LIMIT 100
```

### 本地模板

```
用户：运行每日报表
Claude：找到模板「每日订单报表」
       参数 date: 2026-03-03（今天）
       是否执行？[是]

       📊 每日订单报表
       总订单数：128
       营收金额：¥6,230.00
```

## 本地查询模板

在项目根目录创建 `./udq-patterns/*.sql`：

```sql
-- @name: 每日订单统计
-- @description: 统计今日订单数、金额
-- @params:
--   date: 日期 (CURDATE())

SELECT
    COUNT(*) as total_orders,
    SUM(amount) as total_amount
FROM orders
WHERE DATE(created_at) = COALESCE(:date, CURDATE());
```

使用方式：
- "运行每日订单统计"
- "执行每日订单统计，日期是 2026-03-01"

## 目录结构

```
universal-db-query/
├── SKILL.md                 # 主技能文件（核心逻辑）
├── README.md                # 本文件
├── templates/               # 配置模板
│   ├── config.yaml          # 配置文件模板
│   └── patterns/            # SQL 模板示例
│       ├── README.md
│       ├── daily-report.sql
│       └── recent-orders.sql
└── examples/                # 使用示例（fanhuolun.md）
```

项目本地配置：
```
./
├── config.yaml              # 数据库配置
├── patterns/                # SQL 模板目录
│   └── *.sql
└── .cache/
    └── schema.json          # 元数据缓存
```

## 工作原理

1. **初始化** - 读取 `./udq-config.yaml`
2. **元数据发现** - 使用 DBHub MCP 查询数据库结构
3. **业务推断** - 解析字段注释中的枚举值
4. **缓存** - 元数据缓存到 `./.udq-cache/schema.json`
5. **查询生成** - 根据用户意图生成 SQL 并执行

## 故障排除

| 问题 | 解决方案 |
|-----|---------|
| MCP 连接失败 | 检查 settings.json 中的 MCP 配置和数据库连接信息 |
| 配置不存在 | 创建 `./udq-config.yaml` |
| 元数据发现失败 | 检查数据库权限（需要读取 INFORMATION_SCHEMA），然后"刷新数据库缓存" |

## 参考

- [SKILL.md](SKILL.md) - 完整的技能指令和使用说明
- [DBHub MCP Server](https://github.com/bytebase/dbhub) - 官方仓库
