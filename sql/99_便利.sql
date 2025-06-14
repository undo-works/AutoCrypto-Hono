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
    mc.cross_status = "golden"; 

-- 損得割合取得
SELECT
    t.market_id
    , t.currency_id
    , c.symbol
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
    transaction_datetime > "2025-06-07 22:36" 
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

-- リスクパーセントの更新をSELECTで確認
SELECT
    mc.market_id
    , mc.currency_id
    , c.symbol
    , ratios.sell_to_buy_quantity_ratio 
FROM
    marketcurrencies mc 
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
        WHERE t.active_flag = 1 
            AND t.transaction_datetime >= '2025/06/06' 
        GROUP BY
            t.market_id
            , t.currency_id
    ) AS ratios 
        ON mc.market_id = ratios.market_id 
        AND mc.currency_id = ratios.currency_id 
    INNER JOIN currencies c 
        ON mc.currency_id = c.currency_id; 

-- 売却・購入の取引結果確認
select
    t.currency_id
    , c.symbol
    , t.transaction_type
    , SUM(t.quantity * t.price_per_unit)
    , COUNT(t.transaction_type) 
from
    transactions t 
    INNER JOIN currencies c 
        ON t.currency_id = c.currency_id 
WHERE
    t.transaction_datetime > "2025-06-7 23:13"  -- and t.transaction_datetime < "2025-06-7 22:55"
GROUP BY
    t.currency_id
    , t.transaction_type 
ORDER BY
    t.currency_id; 

-- 市場銘柄情報の追加
insert 
into crypto.marketcurrencies( 
    market_id
    , currency_id
    , cross_status
    , percent
    , short_term
    , long_term
    , active_flag
) 
values ('2', '34', null, 5.00, '5', '25', '1')
, ('2', '35', null, 5.00, '5', '25', '1')
, ('2', '36', null, 5.00, '5', '25', '1')
, ('2', '37', null, 5.00, '5', '25', '1')
, ('2', '38', null, 5.00, '5', '25', '1')
, ('2', '39', null, 5.00, '5', '25', '1')
, ('2', '40', null, 5.00, '5', '25', '1')
, ('2', '41', null, 5.00, '5', '25', '1')
, ('2', '42', null, 5.00, '5', '25', '1')
, ('2', '43', null, 5.00, '5', '25', '1')
, ('2', '44', null, 5.00, '5', '25', '1')
, ('2', '45', null, 5.00, '5', '25', '1')
, ('2', '46', null, 5.00, '5', '25', '1')
, ('2', '47', null, 5.00, '5', '25', '1')
, ('2', '48', null, 5.00, '5', '25', '1'); 

--
