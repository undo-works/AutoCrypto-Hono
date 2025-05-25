import { BinanceCoinType } from "../../infrastructure/api/types/CoinTypes";

export interface BinanceTradeConfig {
  coinType: BinanceCoinType;
  baseCoin: string; // 取引所の基軸通貨（例: BNB）
  tradeCoin: string; // 取引対象のコイン（例: BTC）
}