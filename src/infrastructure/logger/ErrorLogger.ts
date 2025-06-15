import winston = require('winston');
import path = require('path');

/**
 * Loggerのファイル名を生成する関数
 */
const getFileName = () => {
  // 日付をYYYYMMDD形式で取得
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  // ファイル名を生成
  const fileName = `error/error_${dateStr}.log`;
  return fileName;
}

export const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    }), // JSTでタイムスタンプを付与
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(process.env.LOG_DIR ?? "C:\\logs", getFileName()) })
  ]
});