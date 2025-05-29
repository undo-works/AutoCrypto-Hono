-- dead状態の銘柄取得
SELECT
    c.symbol
    , mc.cross_status
    , c.currency_id 
from
    currencies c 
    inner join marketcurrencies mc 
        ON c.currency_id = mc.currency_id 
WHERE
    mc.cross_status = "dead"; 

-- 損得割合取得
SELECT
    t.market_id
    , t.currency_id
    , AVG( 
        CASE 
            WHEN t.transaction_type = 'SELL' 
                THEN t.price_per_unit 
            END
    ) AS avg_sell_quantity
    , AVG( 
        CASE 
            WHEN t.transaction_type = 'BUY' 
                THEN t.price_per_unit 
            END
    ) AS avg_buy_quantity
    , ( 
        AVG( 
            CASE 
                WHEN transaction_type = 'SELL' 
                    THEN t.price_per_unit 
                END
        ) / NULLIF( 
            AVG( 
                CASE 
                    WHEN t.transaction_type = 'BUY' 
                        THEN t.price_per_unit 
                    END
            ) 
            , 0
        )
    ) AS sell_to_buy_quantity_ratio 
FROM
    transactions t 
    INNER JOIN currencies c 
        ON t.currency_id = c.currency_id 
WHERE
    transaction_datetime > "2025-05-22 22:36" 
GROUP BY
    t.market_id
    , t.currency_id 
ORDER BY
    t.market_id
    , t.currency_id; 

ALTER TABLE `marketcurrencies` ADD COLUMN `long_term` int unsigned NOT NULL DEFAULT 125; 

ALTER TABLE `transactions` DROP COLUMN `percent`; 

ALTER TABLE `marketcurrencies` ADD COLUMN `active_flag` tinyint(1) NOT NULL DEFAULT '1'; 

SELECT
    * 
FROM
    MarketCurrencies 
WHERE
    active_flag = 1 
    AND market_id = 1 
    AND currency_id = 1; 

-- リスクパーセントを更新
UPDATE marketcurrencies mc 
    JOIN ( 
        SELECT
            t.market_id
            , t.currency_id
            , ( 
                AVG( 
                    CASE 
                        WHEN t.transaction_type = 'SELL' 
                            THEN t.price_per_unit 
                        END
                ) / NULLIF( 
                    AVG( 
                        CASE 
                            WHEN t.transaction_type = 'BUY' 
                                THEN t.price_per_unit 
                            END
                    ) 
                    , 0
                )
            ) AS sell_to_buy_quantity_ratio 
        FROM
            transactions t 
        GROUP BY
            t.market_id
            , t.currency_id
    ) AS ratios 
        ON mc.market_id = ratios.market_id 
        AND mc.currency_id = ratios.currency_id 
SET
    mc.percent = CASE 
        WHEN ratios.sell_to_buy_quantity_ratio IS NULL 
            THEN 20 
        ELSE mc.percent * ratios.sell_to_buy_quantity_ratio 
        END; 

-- 売却・購入の取引結果確認
select
    t.currency_id
    , t.transaction_type
    , SUM(t.quantity * t.price_per_unit) 
    , COUNT(t.transaction_type)
from
    transactions t 
WHERE
    t.transaction_datetime > "2025-05-24 22:00" 
    and t.transaction_datetime < "2025-05-25 22:00" 
    and t.market_id = 2
GROUP BY
    t.currency_id, t.transaction_type;
