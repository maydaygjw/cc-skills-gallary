# 饭火轮项目 - Universal DB Query Skill 使用示例

## 项目配置

### config.yaml

```yaml
database:
  mcp_server: DBHub
  schema: newmall

options:
  cache_enabled: true
  readonly_mode: true
  max_query_results: 1000
```

## 使用示例

### 1. 元数据探索

```
用户：数据库有哪些表
Claude：正在发现数据库元数据...

       发现 25 张表：
       1. ims_cjdc_order (订单表) - 32 个字段
       2. ims_cjdc_goods (商品表) - 18 个字段
       3. ims_cjdc_store (门店表) - 15 个字段
       4. ims_cjdc_user (用户表) - 12 个字段
       5. ims_cjdc_order_goods (订单商品关联表) - 8 个字段
       ...

用户：订单表的结构
Claude：ims_cjdc_order 表结构：

       | 字段 | 类型 | 注释 |
       |-----|-----|-----|
       | id | bigint | 订单ID |
       | order_id | varchar(50) | 订单编号 |
       | user_id | bigint | 用户ID |
       | store_id | bigint | 门店ID |
       | state | tinyint | 订单状态：1待付款 2待结单 3等待送达 4已完成 5已取消 6退款中 7已退款 8退款拒绝 9已关闭 |
       | type | tinyint | 订单类型：1外卖 2店内 3预定 4当面付 |
       | pay_type | tinyint | 支付方式：1微信支付 2余额支付 3积分支付 4货到付款 5支付宝支付 |
       | money | decimal(10,2) | 订单金额 |
       | time | datetime | 下单时间 |
       | pay_time | datetime | 支付时间 |
       | completion_time | datetime | 完成时间 |
       | uniacid | int | 租户ID |
       ... (共32个字段)

用户：订单状态有哪些
Claude：根据数据库字段注释：

       state 字段取值：
       - 1: 待付款
       - 2: 待结单
       - 3: 等待送达
       - 4: 已完成
       - 5: 已取消
       - 6: 退款中
       - 7: 已退款
       - 8: 退款拒绝
       - 9: 已关闭

       type 字段取值：
       - 1: 外卖
       - 2: 店内
       - 3: 预定
       - 4: 当面付
```

### 2. 数据查询

```
用户：今天有多少订单
Claude：SELECT COUNT(*) FROM ims_cjdc_order WHERE DATE(time) = CURDATE()
       结果：今天共有 42 笔订单

用户：今天外卖订单有多少
Claude：SELECT COUNT(*) FROM ims_cjdc_order WHERE DATE(time) = CURDATE() AND type = 1
       结果：今天共有 35 笔外卖订单

用户：待付款的订单有哪些
Claude：SELECT order_id, name, tel, money, time
       FROM ims_cjdc_order
       WHERE state = 1
       ORDER BY time DESC
       LIMIT 100

       | 订单号 | 客户姓名 | 电话 | 金额 | 下单时间 |
       |--------|---------|-----|-----|---------|
       | 202503020001 | 张三 | 138****1234 | ¥58.00 | 2026-03-02 14:32 |
       | 202503020002 | 李四 | 139****5678 | ¥128.00 | 2026-03-02 14:28 |
       ...

用户：本周订单趋势
Claude：SELECT
          DATE(time) as date,
          COUNT(*) as count,
          SUM(money) as amount
       FROM ims_cjdc_order
       WHERE YEARWEEK(time) = YEARWEEK(NOW())
         AND state NOT IN (5, 9)
       GROUP BY DATE(time)
       ORDER BY date

       | 日期 | 订单数 | 金额 |
       |-----|-------|-----|
       | 2026-03-01 | 156 | ¥8,560.00 |
       | 2026-03-02 | 128 | ¥6,230.00 |
```

### 3. 本地模板使用

```
用户：运行每日报表
Claude：找到本地模板「每日订单报表」
       参数 date: 2026-03-02（今天）
       是否执行？[是]

       执行中...

       📊 每日订单报表 (2026-03-02)
       ==============================
       总订单数：128
       营收金额：¥6,230.00
       退款金额：¥180.00
       净营收：¥6,050.00
       待处理订单：12
       已完成订单：98

用户：查看最近20条订单
Claude：SELECT id, order_id, name, money, state, time
       FROM ims_cjdc_order
       ORDER BY time DESC
       LIMIT 20

       ...
```

## 项目本地模板

### .claude/skills-conf/udq/patterns/daily-report.sql

```sql
-- @name: 每日订单报表
-- @description: 统计每日订单数、金额、退款
-- @params:
--   date: 日期 (CURDATE())

SELECT
    COUNT(*) as total_orders,
    SUM(CASE WHEN state NOT IN (5, 9) THEN money ELSE 0 END) as revenue,
    SUM(CASE WHEN state IN (6, 7) THEN money ELSE 0 END) as refund_amount,
    COUNT(CASE WHEN state = 1 THEN 1 END) as pending_orders,
    COUNT(CASE WHEN state = 4 THEN 1 END) as completed_orders
FROM ims_cjdc_order
WHERE DATE(time) = COALESCE(:date, CURDATE())
  AND type IN (1, 2);
```

### .claude/skills-conf/udq/patterns/store-revenue.sql

```sql
-- @name: 门店营收统计
-- @description: 按门店统计订单和营收
-- @params:
--   start_date: 开始日期 (DATE_SUB(CURDATE(), INTERVAL 7 DAY))
--   end_date: 结束日期 (CURDATE())

SELECT
    s.name as store_name,
    COUNT(o.id) as order_count,
    SUM(o.money) as total_revenue,
    AVG(o.money) as avg_order_value
FROM ims_cjdc_store s
LEFT JOIN ims_cjdc_order o ON s.id = o.store_id
    AND o.time BETWEEN :start_date AND :end_date
    AND o.state NOT IN (5, 9)
WHERE s.uniacid = 2
GROUP BY s.id, s.name
ORDER BY total_revenue DESC;
```

## 字段枚举值参考

从数据库注释自动解析：

| 表名 | 字段 | 枚举值 |
|-----|-----|-------|
| ims_cjdc_order | state | 1待付款 2待结单 3等待送达 4已完成 5已取消 6退款中 7已退款 8退款拒绝 9已关闭 |
| ims_cjdc_order | type | 1外卖 2店内 3预定 4当面付 |
| ims_cjdc_order | pay_type | 1微信支付 2余额支付 3积分支付 4货到付款 5支付宝支付 |
| ims_cjdc_order | pay_state | 1未付款 2已付款 |
| ims_cjdc_store | is_rest | 1是 2否 |
| ims_cjdc_goods | is_show | 1上架 2下架 |
| ims_cjdc_goods | type | 1实物 2虚拟 |
