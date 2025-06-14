var Service = require('node-windows').Service;
require('dotenv').config();

// サービスの作成
var svc = new Service({
  name: 'AutoCryptoService', // サービス名
  description: '仮想通貨の自動取引ツールです', // サービスの説明
  script: require('path').join(__dirname, 'dist/start.js'), // 実行するNode.jsアプリケーションのパス
  env: {
    name: "LOG_DIR",
    value: process.env.LOG_DIR || "C:\\logs"
  },
  logpath: process.env.LOG_DIR || "C:\\logs"
});

// サービスのインストール
svc.on('install', function () {
  svc.start();
});

process.on('uncaughtException', (err) => {
  require('fs').appendFileSync('service-error.log', err.stack + '\n');
});
process.on('unhandledRejection', (reason) => {
  require('fs').appendFileSync('service-error.log', String(reason) + '\n');
});

svc.install();