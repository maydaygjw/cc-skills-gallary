# Universal DB Query Skill V2 (Standalone)

智能数据库查询助手（独立版）。直接连接数据库，无需 MCP Server，通过自然语言查询，自动发现元数据。

## 功能特性

- **直接数据库连接** - 支持 MySQL、PostgreSQL、SQLite，无需 MCP Server
- **自动元数据发现** - 自动获取表结构、字段注释、外键关系
- **智能业务推断** - 从字段注释解析状态枚举值（如 `1:待付款 2:已付款`）
- **自然语言查询** - "今天有多少订单" → 自动生成 SQL
- **本地查询模板** - 支持自定义 SQL 模板，通过自然语言调用
- **Schema 缓存** - 缓存元数据，避免重复查询

## 快速开始

### 1. 安装依赖

```bash
cd universal-db-query-v2
npm install
```

### 2. 配置数据库连接

配置文件支持多个位置，按优先级查找：

1. 项目根目录 `.claude/udq-config.yaml`（推荐）
2. 项目根目录 `.claude/skills-conf/udq/udq-config.yaml`
3. 用户家目录 `~/.claude/udq-config.yaml`
4. 用户家目录 `~/.claude/skills-conf/udq/udq-config.yaml`
5. 回退：`./udq-config.yaml`（向后兼容）

> **建议**：将配置文件放在项目根目录 `.claude/udq-config.yaml`，避免数据库凭据泄露到用户家目录。

```yaml
database:
  type: mysql              # 数据库类型: mysql, postgresql, sqlite
  host: localhost
  port: 3306
  user: your_username
  password: your_password
  database: your_db_name   # 数据库名

options:
  cache_enabled: true
  readonly_mode: true      # 推荐保持只读
  max_query_results: 1000
```

**SQLite 配置示例：**
```yaml
database:
  type: sqlite
  database: ./path/to/database.db

options:
  readonly_mode: true
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

完整使用指南请参考 [SKILL.md](SKILL.md)。

## CLI 工具

### 执行 SQL 查询

```bash
node scripts/query.js "SELECT * FROM orders LIMIT 10"
```

### 发现数据库 Schema

```bash
node scripts/discover-schema.js
```

### 列出所有表

```bash
node scripts/list-tables.js
```

### 查看表结构

```bash
node scripts/describe-table.js orders
```

### 运行查询模板

```bash
node scripts/run-pattern.js daily-report
```

## 目录结构

```
universal-db-query-v2/
├── SKILL.md                    # 主技能文件（完整使用指南）
├── README.md                   # 本文件
├── package.json                # Node.js 依赖
├── scripts/                    # CLI 工具
│   ├── query.js               # 执行 SQL
│   ├── discover-schema.js     # 发现 Schema
│   ├── list-tables.js         # 列出表
│   ├── describe-table.js      # 查看表结构
│   └── run-pattern.js         # 运行查询模板
├── lib/                        # 核心库
│   ├── db.js                  # 数据库连接
│   ├── schema.js              # Schema 发现
│   ├── query-builder.js       # 查询构建
│   └── cache.js               # 缓存管理
├── templates/                  # 配置模板
│   ├── config.yaml            # 配置文件模板
│   └── patterns/              # SQL 模板示例
└── examples/                   # 使用示例
```

项目本地配置（放在项目根目录的 .claude/ 目录下）：
```
./
├── .claude/
│   ├── udq-config.yaml            # 数据库配置（推荐）
│   ├── udq-patterns/             # SQL 模板目录
│   │   └── *.md                   # Markdown 格式，包含 YAML frontmatter
│   └── .udq-cache/
│       └── schema.json            # 元数据缓存
```

## 工作原理

1. **初始化** - 从多个位置查找配置文件（优先级：`.claude/udq-config.yaml` > `.claude/skills-conf/udq/` > `~/.claude/` > `./udq-config.yaml`）
2. **数据库连接** - 使用 mysql2/pg/better-sqlite3 直接连接
3. **元数据发现** - 查询数据库系统表获取结构
4. **业务推断** - 解析字段注释中的枚举值
5. **缓存** - 元数据缓存到 `.claude/.udq-cache/schema.json`
6. **查询生成** - 根据用户意图生成 SQL 并执行

## 与 V1 版本的区别

| 特性 | V1 (MCP) | V2 (Standalone) |
|-----|---------|-----------------|
| 依赖 | 需要 DBHub MCP Server | 无需 MCP，直接连接 |
| 配置复杂度 | 需要配置 MCP + Skill | 只需配置 Skill |
| 性能 | 通过 MCP 中转 | 直连数据库，更快 |
| 部署 | 需要 Node.js + MCP 环境 | 只需 Node.js |

## 参考

- [SKILL.md](SKILL.md) - 完整的技能指令、配置说明和使用示例
