# Universal DB Query V2 - 高级配置示例

本文档展示如何组合使用表过滤和注释覆盖功能。

## 完整配置示例

```yaml
# udq-config.yaml - 生产环境配置示例

database:
  type: mysql
  host: localhost
  port: 3306
  user: readonly_user
  password: your_password
  database: ecommerce_db

options:
  # 安全设置
  readonly_mode: true
  max_query_results: 500

  # 缓存设置
  cache_enabled: true
  cache_ttl_hours: 12

  # ==================== 表过滤配置 ====================
  # 只允许查询业务相关表，排除系统/敏感表
  table_filter:
    mode: whitelist
    listed_tables:
      - users
      - orders
      - order_items
      - products
      - categories
      - payments
    patterns:
      - "report_*"      # 允许报表表
      - "stat_*"        # 允许统计表
      - "vw_*"          # 允许视图

  # ==================== 注释覆盖配置 ====================
  # 为缺少注释的表/字段添加说明
  comments:
    # 表级别注释
    tables:
      users: "用户表 - 注册会员信息"
      orders: "订单主表 - 存储订单基本信息"
      order_items: "订单明细表 - 存储订单商品详情"
      products: "商品表 - 商品基础信息"
      categories: "商品分类表"
      payments: "支付记录表 - 存储支付流水"

    # 字段级别注释（支持状态值枚举说明）
    columns:
      # users 表字段
      "users.id": "用户ID"
      "users.username": "用户名"
      "users.email": "邮箱地址"
      "users.phone": "手机号"
      "users.status": "账号状态：0未激活 1正常 2冻结 3注销"
      "users.created_at": "注册时间"
      "users.updated_at": "更新时间"

      # orders 表字段
      "orders.id": "订单ID"
      "orders.order_no": "订单编号"
      "orders.user_id": "买家用户ID"
      "orders.total_amount": "订单总金额（元）"
      "orders.pay_amount": "实付金额（元）"
      "orders.status": "订单状态：1待付款 2已付款 3已发货 4已完成 5已取消 6退款中 7已退款"
      "orders.pay_type": "支付方式：1微信 2支付宝 3银行卡 4余额"
      "orders.created_at": "下单时间"
      "orders.paid_at": "付款时间"
      "orders.shipped_at": "发货时间"

      # order_items 表字段
      "order_items.id": "明细ID"
      "order_items.order_id": "关联订单ID"
      "order_items.product_id": "商品ID"
      "order_items.product_name": "商品名称（快照）"
      "order_items.price": "单价（元）"
      "order_items.quantity": "数量"
      "order_items.subtotal": "小计金额（元）"

      # products 表字段
      "products.id": "商品ID"
      "products.name": "商品名称"
      "products.category_id": "分类ID"
      "products.price": "售价（元）"
      "products.cost": "成本价（元）"
      "products.stock": "库存数量"
      "products.status": "商品状态：0下架 1上架 2售罄"
```

## 使用场景

### 场景1：数据分析师查询

配置了上述设置后，数据分析师可以：

```
用户：今天有多少订单？
AI：生成 SQL → SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()

用户：待付款的订单有哪些？
AI：识别 status=1 → 返回待付款订单列表

用户：每个支付方式的总金额
AI：识别 pay_type 枚举值 → 按支付方式分组统计
```

### 场景2：自然语言查询优化

**有配置注释时：**

```
用户：查找已发货的订单

AI分析：
- "已发货" 匹配 orders.status 注释中的 "3已发货"
- 生成 SQL：SELECT * FROM orders WHERE status = 3
```

**无配置注释时：**

```
用户：查找已发货的订单

AI分析：
- 无法确定 status 字段的枚举值
- 可能生成不准确的查询或询问用户
```

### 场景3：表过滤保护敏感数据

```yaml
table_filter:
  mode: whitelist
  listed_tables:
    - users
    - orders
  # 未列出的表：admin_users, password_reset_tokens, api_keys 等都无法访问
```

## 配置优先级说明

```
┌─────────────────────────────────────────┐
│  配置注释  >  数据库注释  >  空值        │
└─────────────────────────────────────────┘

示例：
- 数据库中 users.status 注释为 "status"
- 配置中 users.status 注释为 "状态：1正常 2禁用"
- 最终使用："状态：1正常 2禁用"（配置优先）
```

## 最佳实践

### 1. 分层配置

**开发环境**（全表访问）：
```yaml
options:
  table_filter:
    mode: blacklist
    listed_tables: []  # 不禁止任何表
```

**生产环境**（受限访问）：
```yaml
options:
  table_filter:
    mode: whitelist
    listed_tables: [users, orders, products]
```

### 2. 字段命名规范

配置注释时使用统一的格式：

```yaml
columns:
  # 格式：字段用途：值1说明 值2说明
  "table.status": "状态描述：1状态A 2状态B 3状态C"

  # 格式：字段用途（单位）
  "table.amount": "金额（元）"
  "table.weight": "重量（克）"

  # 格式：关联说明
  "table.user_id": "关联用户ID → users.id"
```

### 3. 状态值枚举格式

推荐的状态值注释格式：

```yaml
# 数字状态
"orders.status": "订单状态：1待付款 2已付款 3已发货 4已完成 5已取消"

# 布尔状态
"users.is_vip": "是否VIP：0否 1是"

# 多状态
"tasks.priority": "优先级：1低 2中 3高 4紧急"
```

### 4. 组合使用表过滤和注释

```yaml
options:
  # 第一步：限制可访问的表
  table_filter:
    mode: whitelist
    listed_tables:
      - orders
      - order_items

  # 第二步：为允许的表添加详细注释
  comments:
    tables:
      orders: "订单主表"
      order_items: "订单明细表"
    columns:
      "orders.status": "状态：1待付款 2已付款 3已发货"
      "order_items.price": "商品单价（元）"
```

## 故障排除

### 问题1：配置注释未生效

检查：
1. 配置文件路径是否正确 `./udq-config.yaml`
2. 配置格式是否正确（缩进、冒号后空格）
3. 是否运行了 `discover-schema.js --refresh` 刷新缓存

### 问题2：表过滤误拦截

检查：
1. 表名是否精确匹配（区分大小写）
2. 是否使用了正确的 mode（whitelist/blacklist）
3. 通配符模式是否正确

### 问题3：自然语言查询不准确

优化：
1. 为关键字段添加详细的枚举值说明
2. 使用常见的业务术语作为注释
3. 确保状态值说明格式统一

## 完整配置检查清单

- [ ] 数据库连接信息正确
- [ ] 只读模式已启用（生产环境）
- [ ] 表过滤模式符合预期（whitelist/blacklist）
- [ ] 允许的表列表完整
- [ ] 关键表添加了表级别注释
- [ ] 状态/类型字段添加了枚举值说明
- [ ] 外键字段添加了关联说明
- [ ] 缓存已刷新使配置生效
