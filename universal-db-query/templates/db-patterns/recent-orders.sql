-- @name: 最近订单
-- @description: 查询最近 N 条订单
-- @params:
--   limit: 返回条数 (20)
--   status: 订单状态筛选，NULL 表示全部 (NULL)

SELECT
    id,
    order_id,
    name as user_name,
    tel as user_phone,
    money as amount,
    state,
    type,
    pay_type,
    time as created_at,
    address
FROM ims_cjdc_order
WHERE (:status IS NULL OR state = :status)
ORDER BY time DESC
LIMIT :limit;
