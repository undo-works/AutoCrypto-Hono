# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

# セットアップ

## AWS Lambda用のセットアップ方法

https://hono.dev/docs/getting-started/aws-lambda

# Binance

## 取引のBNBBTCとかってどっちが売り？どっちが買い？

BinanceのAPIで「BNBBTC」というシンボルを使う場合、
BNB/BTCの「基軸通貨（右側）」がBTC、「取引通貨（左側）」がBNBです。

BUY（買い）注文
→ BTCを使ってBNBを買う（BTCを支払ってBNBを受け取る）

SELL（売り）注文
→ BNBを売ってBTCを得る（BNBを支払ってBTCを受け取る）

まとめ
* side: 'BUY' → BNBを買う（BTCを支払う）
* side: 'SELL' → BNBを売る（BTCを受け取る）
「BNBBTC」は「1BNB＝○BTC」という意味です。
どちらを増やしたいかでBUY/SELLを選びます。
