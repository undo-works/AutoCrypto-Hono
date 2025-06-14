import winston = require('winston');
import path = require('path');

// ファイル名を生成
const fileName = `system.log`;

export const systemLogger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: path.join(process.env.LOG_DIR ?? "C:\\logs", fileName) })
  ]
});