import { BinanceCoinType, CoincheckCoinType } from "../infrastructure/api/types/CoinTypes";

export const COIN_TYPES: CoincheckCoinType[] = [
  "btc",
  // "eth", "xrp",
  // "etc", "lsk",  "xem", "bch", "mona", "iost", "enj", "chz", "imx", "shib", "avax", "fnct",
  // "dai", "wbtc", "bril", "bc", "doge", "pepe", "mask", "mana", "grt"
];

export const BINANCE_COIN_TYPES: BinanceCoinType[] = [
  "BNBBTC", "BNBETH", "BNBJPY"
// "eth", "xrp",
// "etc", "lsk",  "xem", "bch", "mona", "iost", "enj", "chz", "imx", "shib", "avax", "fnct",
// "dai", "wbtc", "bril", "bc", "doge", "pepe", "mask", "mana", "grt"
];

/** 
 * マーケット名の定義
 */
export const MARKETS = {
  COINCHECK: "coincheck",
  BINANCE: "binance",
}