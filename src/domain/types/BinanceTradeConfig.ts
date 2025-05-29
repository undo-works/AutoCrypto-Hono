import { BinanceCoinType } from "../../infrastructure/api/types/CoinTypes";

export interface BinanceTradeConfig {
  coinType: BinanceCoinType;
  baseCoin: string; // 取引所の基軸通貨（例: BNB）
  tradeCoin: string; // 取引対象のコイン（例: BTC）
  /** もともとBNB基準だったらfalse, コイン基準だったらtrue */
  reverse: boolean | null;
  minNotional: number; // 最小取引額
}