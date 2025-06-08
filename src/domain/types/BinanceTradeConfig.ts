import { BinanceCoinType } from "../../infrastructure/api/types/CoinTypes";

export interface BinanceTradeConfig {
  coinType: BinanceCoinType;
  baseCoin: string; // 取引所の基軸通貨（例: BNB）
  tradeCoin: string; // 取引対象のコイン（例: BTC）
  minQty: number; // 最小取引数量
  maxQty: number; // 最大取引数量
  stepSize: number; // 取引数量のステップサイズ
  minNotional: number; // 最小取引額
}