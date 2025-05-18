CREATE TABLE `currencies` (
  `currency_id` int unsigned NOT NULL AUTO_INCREMENT,
  `symbol` varchar(10) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`currency_id`),
  UNIQUE KEY `symbol` (`symbol`)
)