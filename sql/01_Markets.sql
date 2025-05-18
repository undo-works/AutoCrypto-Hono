CREATE TABLE `markets` (
  `market_id` int unsigned NOT NULL AUTO_INCREMENT,
  `market_name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`market_id`),
  UNIQUE KEY `market_name` (`market_name`)
)