import winston = require('winston');
import path = require('path');

// 日付をYYYYMMDD形式で取得
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const dateStr = `${yyyy}${mm}${dd}`;

// ファイル名を生成
const fileName = `updateconfig/updateconfig_${dateStr}.log`;

export const updateConfigLogger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: path.join(process.env.LOG_DIR ?? "C:\\logs", fileName) })
  ]
});