CREATE TABLE `marketprices` (
  `price_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `market_id` int unsigned NOT NULL,
  `currency_id` int unsigned NOT NULL,
  `record_datetime` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `price` decimal(30,10) NOT NULL,
  PRIMARY KEY (`price_id`),
  UNIQUE KEY `unique_price` (`market_id`,`currency_id`,`record_datetime`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `marketprices_ibfk_1` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`),
  CONSTRAINT `marketprices_ibfk_2` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`currency_id`)
)