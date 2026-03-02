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

在 Claude Code 配置文件中添加（`~/.claude/settings.json` 或项目根目录 `.claude/settings.local.json`）：

```json
{
  "mcpServers": {
    "DBHub": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@bytebase/dbhub"
      ],
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

### 配置参数说明

| 参数 | 说明 | 示例 |
|-----|------|-----|
| `DB_TYPE` | 数据库类型 | `mysql`, `postgresql`, `sqlite`, `sqlserver` |
| `DB_HOST` | 数据库主机 | `localhost`, `127.0.0.1`, `your-db-host.com` |
| `DB_PORT` | 数据库端口 | `3306` (MySQL默认), `5432` (PostgreSQL默认) |
| `DB_USER` | 用户名 | `root`, `admin` |
| `DB_PASSWORD` | 密码 | - |
| `DB_NAME` | 数据库名 | `newmall`, `myapp` |
| `READONLY` | 只读模式 | `true` (推荐), `false` |

### 示例配置

#### MySQL 配置

```json
{
  "mcpServers": {
    "DBHub": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub"],
      "env": {
        "DB_TYPE": "mysql",
        "DB_HOST": "rr-uf6vn5019k4ujba4tto.mysql.rds.aliyuncs.com",
        "DB_PORT": "3306",
        "DB_USER": "newmall",
        "DB_PASSWORD": "newmall@190824",
        "DB_NAME": "newmall",
        "READONLY": "true"
      }
    }
  }
}
```

#### PostgreSQL 配置

```json
{
  "mcpServers": {
    "DBHub": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub"],
      "env": {
        "DB_TYPE": "postgresql",
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "postgres",
        "DB_PASSWORD": "password",
        "DB_NAME": "mydb",
        "READONLY": "true"
      }
    }
  }
}
```

#### SQLite 配置

```json
{
  "mcpServers": {
    "DBHub": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub"],
      "env": {
        "DB_TYPE": "sqlite",
        "DB_HOST": "/path/to/your/database.db",
        "READONLY": "true"
      }
    }
  }
}
```

### 2. 配置 Skill

在项目根目录创建 `.claude/db-config.yaml`：

```yaml
database:
  mcp_server: DBHub      # MCP 服务器名称，与上面配置的名称一致
  schema: newmall        # 数据库名

options:
  cache_enabled: true         # 启用 Schema 缓存
  readonly_mode: true         # 只读模式（推荐）
  max_query_results: 1000     # 最大返回行数
```

### 3. 开始使用

配置完成后，可以直接使用自然语言查询：

- "数据库有哪些表？"
- "订单表的结构"
- "今天有多少订单"
- "待付款的订单有哪些"

## 目录结构

```
universal-db-query/
├── SKILL.md                 # 主技能文件（核心逻辑）
├── README.md                # 本文件
├── templates/               # 配置模板
│   ├── db-config.yaml       # 配置文件模板
│   └── db-patterns/         # SQL 模板示例
│       ├── README.md
│       ├── daily-report.sql
│       └── recent-orders.sql
└── examples/                # 使用示例
    └── fanhuolun.md         # 饭火轮项目示例
```

## 本地查询模板

可以在项目根目录创建 `.claude/db-patterns/` 存放自定义 SQL 模板：

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

## 工作原理

1. **初始化** - 读取 `.claude/db-config.yaml` 获取配置
2. **元数据发现** - 使用 DBHub MCP 工具查询数据库结构
   - 表列表（`SHOW TABLES` / `information_schema.tables`）
   - 字段详情（`information_schema.columns`）
   - 外键关系（`information_schema.key_column_usage`）
3. **业务推断** - 解析字段注释中的枚举值
   - 支持格式：`1:值1 2:值2`, `1.值1 2.值2`, `1-值1 2-值2`
4. **缓存** - 元数据缓存到 `.claude/.cache/db-schema.json`
5. **查询生成** - 根据用户意图生成 SQL 并执行

## 故障排除

### MCP 连接失败

```
无法连接数据库，请检查：
1. MCP 服务器是否配置正确（settings.json）
2. 数据库连接信息是否正确
3. 网络是否可以访问数据库
```

### 配置不存在

```
未找到数据库配置。请创建 .claude/db-config.yaml
```

### 元数据发现失败

```
元数据发现失败，尝试以下方案：
1. 检查数据库权限（需要读取 INFORMATION_SCHEMA）
2. 手动刷新缓存："刷新数据库缓存"
3. 检查配置中的 schema 名称是否正确
```

## 参考

- [SKILL.md](SKILL.md) - 完整的技能指令和使用说明
- [examples/fanhuolun.md](examples/fanhuolun.md) - 饭火轮项目使用示例
- [DBHub MCP Server](https://github.com/bytebase/dbhub) - 官方仓库
