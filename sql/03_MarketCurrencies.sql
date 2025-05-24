CREATE TABLE `marketcurrencies` (
  `market_currency_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `market_id` int unsigned NOT NULL,
  `currency_id` int unsigned NOT NULL,
  `cross_status` enum('golden','dead') DEFAULT NULL,
  `percent` decimal(5,2) NOT NULL DEFAULT '20.00',
  `short_term` int unsigned NOT NULL DEFAULT '25',
  `long_term` int unsigned NOT NULL DEFAULT '125',
  `active_flag` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`market_currency_id`),
  UNIQUE KEY `unique_market_currency` (`market_id`,`currency_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `marketcurrencies_ibfk_1` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`) ON DELETE CASCADE,
  CONSTRAINT `marketcurrencies_ibfk_2` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`currency_id`) ON DELETE CASCADE
)