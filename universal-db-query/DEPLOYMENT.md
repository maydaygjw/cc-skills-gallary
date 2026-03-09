# Universal DB Query - 部署指南

本技能支持在多种环境中部署，不依赖 Claude Code 特定的目录结构。

## 配置文件查找优先级

### 1. 配置文件 (udq-config.yaml)

按以下顺序查找：

1. **环境变量** `UDQ_CONFIG` 指定的路径
2. **当前工作目录** `./udq-config.yaml`
3. **用户主目录** `~/.udq-config.yaml`
4. **技能目录** `<skill-path>/udq-config.yaml`

### 2. Pattern 模板目录

按以下顺序查找：

1. **配置文件中指定** `options.patterns_dir`
2. **当前工作目录** `./udq-patterns/`
3. **用户主目录** `~/.udq-patterns/`
4. **技能目录** `<skill-path>/udq-patterns/`

### 3. 缓存目录

默认：`./udq-cache/`（可在配置文件中通过 `options.cache_dir` 自定义）

---

## 部署场景

### 场景 1: Claude Code 项目

```bash
# 项目结构
my-project/
├── udq-config.yaml          # 配置文件
├── udq-patterns/            # 自定义 Pattern
│   └── my-report.md
└── udq-cache/               # 缓存（自动生成）
```

### 场景 2: OpenClaw / 其他 AI 工具

```bash
# 全局配置
~/.udq-config.yaml           # 用户级配置
~/.udq-patterns/             # 用户级 Pattern
~/.udq-cache/                # 用户级缓存

# 或使用环境变量
export UDQ_CONFIG=/path/to/my-config.yaml
```

### 场景 3: 多项目共享

```bash
# 项目 A
project-a/
└── udq-config.yaml          # 指向数据库 A

# 项目 B
project-b/
└── udq-config.yaml          # 指向数据库 B

# 共享 Pattern
~/.udq-patterns/
├── daily-report.md
└── weekly-summary.md
```

---

## 配置示例

### 基础配置

```yaml
database:
  type: mysql
  host: localhost
  port: 3306
  user: username
  password: password
  database: mydb

options:
  readonly_mode: true
  cache_enabled: true
```

### 自定义路径

```yaml
database:
  type: mysql
  host: localhost
  port: 3306
  user: username
  password: password
  database: mydb

options:
  readonly_mode: true
  cache_enabled: true
  cache_dir: /tmp/udq-cache          # 自定义缓存目录
  patterns_dir: ~/my-sql-templates   # 自定义 Pattern 目录
```

---

## 使用方式

### 方式 1: 直接运行脚本

```bash
# 在项目目录下
cd /path/to/project
node /path/to/universal-db-query/scripts/run-pattern.js 渠道总单量 channel=yqxz

# 使用环境变量
export UDQ_CONFIG=/path/to/config.yaml
node /path/to/universal-db-query/scripts/run-pattern.js 单店铺查询 shop_name=七碗香
```

### 方式 2: 通过 AI 助手

在 Claude Code、OpenClaw 或其他支持技能的 AI 工具中：

```
用户: 昨天氧气学长渠道一共多少单
AI: [自动查找配置，执行查询]
```

---

## 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `UDQ_CONFIG` | 配置文件路径 | `/etc/udq/config.yaml` |

---

## 故障排查

### 配置文件找不到

```
Error: Config not found. Searched: ...
```

**解决方案：**
1. 在当前目录创建 `udq-config.yaml`
2. 或在 `~/.udq-config.yaml` 创建全局配置
3. 或设置环境变量 `export UDQ_CONFIG=/path/to/config.yaml`

### Pattern 找不到

```
Error: Pattern "xxx" not found. Searched: ...
```

**解决方案：**
1. 在当前目录创建 `udq-patterns/` 目录
2. 或在配置文件中指定 `options.patterns_dir`
3. 或将 Pattern 放到 `~/.udq-patterns/`

---

## 迁移指南

### 从 Claude Code 迁移到其他环境

1. **复制配置文件**
   ```bash
   cp .claude/udq-config.yaml ./udq-config.yaml
   ```

2. **复制 Pattern 目录**
   ```bash
   cp -r .claude/udq-patterns ./udq-patterns
   ```

3. **更新配置文件中的路径**（如果有绝对路径）

4. **测试**
   ```bash
   node universal-db-query/scripts/run-pattern.js <pattern-name>
   ```

---

## 最佳实践

1. **项目级配置**：每个项目有独立的 `udq-config.yaml`，指向不同的数据库
2. **全局 Pattern**：通用的 SQL 模板放在 `~/.udq-patterns/`
3. **项目级 Pattern**：项目特定的查询放在 `./udq-patterns/`
4. **环境变量**：在 CI/CD 或容器环境中使用 `UDQ_CONFIG` 指定配置路径
