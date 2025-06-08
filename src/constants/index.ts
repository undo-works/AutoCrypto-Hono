import { BinanceTradeConfig } from "../domain/types/BinanceTradeConfig";
import { BinanceCoinType, CoincheckCoinType } from "../infrastructure/api/types/CoinTypes";

export const COIN_TYPES: CoincheckCoinType[] = [
  "btc",
  // "eth", "xrp",
  // "etc", "lsk",  "xem", "bch", "mona", "iost", "enj", "chz", "imx", "shib", "avax", "fnct",
  // "dai", "wbtc", "bril", "bc", "doge", "pepe", "mask", "mana", "grt"
];

export const BINANCE_COIN_TYPES: BinanceCoinType[] = [
  "BNBBTC", "BNBETH", "BNBJPY",
  "ADABNB", "SOLBNB", "DOTBNB", "TRXBNB", "XRPBNB", "AVAXBNB", "SUIBNB", "LTCBNB",
  "HBARBNB", "POLBNB", "LINKBNB", "BCHBNB", "CHZBNB", "ETCBNB", "AXSBNB", "SEIBNB",
  "NEARBNB", "CYBERBNB"
];

/** 
 * マーケット名の定義
 */
export const MARKETS = {
  COINCHECK: "coincheck",
  BINANCE: "binance",
}

/**
 * バイナンスの取引設定
 * https://api.binance.com/api/v3/exchangeInfo?symbol=BNBJPY
 */
export const BINANCE_TRADE_CONFIG: BinanceTradeConfig[] = [
  {
    coinType: "BNBBTC",
    baseCoin: "BNB",
    tradeCoin: "BTC",
    minQty: 0.001,
    maxQty: 1000,
    stepSize: 0.001,
    minNotional: 0.0001,
  },
  {
    coinType: "BNBETH",
    baseCoin: "BNB",
    tradeCoin: "ETH",
    minQty: 0.001,
    maxQty: 9000000,
    stepSize: 0.001,
    minNotional: 0.001,
  },
  {
    coinType: "BNBJPY",
    baseCoin: "BNB",
    tradeCoin: "JPY",
    minQty: 0.0001,
    maxQty: 92233,
    stepSize: 0.0001,
    minNotional: 100,
  },
  {
    coinType: "ADABNB",
    baseCoin: "ADA",
    tradeCoin: "BNB",
    minQty: 0.1,
    maxQty: 9000000,
    stepSize: 0.1,
    minNotional: 0.01,
  },
  {
    coinType: "SOLBNB",
    baseCoin: "SOL",
    tradeCoin: "BNB",
    minQty: 0.001,
    maxQty: 9000000,
    stepSize: 0.001,
    minNotional: 0.01,
  },
  {
    coinType: "DOTBNB",
    baseCoin: "DOT",
    tradeCoin: "BNB",
    minQty: 0.01,
    maxQty: 9000000,
    stepSize: 0.01,
    minNotional: 0.01,
  },
  {
    coinType: "TRXBNB",
    baseCoin: "TRX",
    tradeCoin: "BNB",
    minQty: 1,
    maxQty: 9000000,
    stepSize: 1,
    minNotional: 0.01,
  },
  {
    coinType: "XRPBNB",
    baseCoin: "XRP",
    tradeCoin: "BNB",
    minQty: 0.1,
    maxQty: 9000000,
    stepSize: 0.1,
    minNotional: 0.01,
  },
  {
    coinType: "AVAXBNB",
    baseCoin: "AVAX",
    tradeCoin: "BNB",
    minQty: 0.01,
    maxQty: 9000000,
    stepSize: 0.01,
    minNotional: 0.01,
  },
  {
    coinType: "SUIBNB",
    baseCoin: "SUI",
    tradeCoin: "BNB",
    minQty: 0.1,
    maxQty: 92141578,
    stepSize: 0.1,
    minNotional: 0.01,
  },
  {
    coinType: "LTCBNB",
    baseCoin: "LTC",
    tradeCoin: "BNB",
    minQty: 0.001,
    maxQty: 900000,
    stepSize: 0.001,
    minNotional: 0.01,
  },
  {
    coinType: "HBARBNB",
    baseCoin: "HBAR",
    tradeCoin: "BNB",
    minQty: 1,
    maxQty: 9000000,
    stepSize: 1,
    minNotional: 0.01
  },
  {
    coinType: "POLBNB",
    baseCoin: "POL",
    tradeCoin: "BNB",
    minQty: 0.1,
    maxQty: 92141578,
    stepSize: 0.1,
    minNotional: 0.01,
  },
  {
    coinType: "LINKBNB",
    baseCoin: "LINK",
    tradeCoin: "BNB",
    minQty: 0.001,
    maxQty: 92141578,
    stepSize: 0.001,
    minNotional: 0.01,
  },
  {
    coinType: "BCHBNB",
    baseCoin: "BCH",
    tradeCoin: "BNB",
    minQty: 0.001,
    maxQty: 900000,
    stepSize: 0.001,
    minNotional: 0.01,
  },
  {
    coinType: "CHZBNB",
    baseCoin: "CHZ",
    tradeCoin: "BNB",
    minQty: 1,
    maxQty: 9000000,
    stepSize: 1,
    minNotional: 0.01,
  },
  {
    coinType: "ETCBNB",
    baseCoin: "ETC",
    tradeCoin: "BNB",
    minQty: 0.01,
    maxQty: 9000000,
    stepSize: 0.01,
    minNotional: 0.01,
  },
  {
    coinType: "AXSBNB",
    baseCoin: "AXS",
    tradeCoin: "BNB",
    minQty: 0.01,
    maxQty: 9000000,
    stepSize: 0.01,
    minNotional: 0.01,
  },
  {
    coinType: "SEIBNB",
    baseCoin: "SEI",
    tradeCoin: "BNB",
    minQty: 0.1,
    maxQty: 92141578,
    stepSize: 0.1,
    minNotional: 0.01,
  },
  {
    coinType: "NEARBNB",
    baseCoin: "NEAR",
    tradeCoin: "BNB",
    minQty: 0.1,
    maxQty: 9000000,
    stepSize: 0.1,
    minNotional: 0.01,
  },
  {
    coinType: "CYBERBNB",
    baseCoin: "CYBER",
    tradeCoin: "BNB",
    minQty: 0.01,
    maxQty: 92141578,
    stepSize: 0.01,
    minNotional: 0.01,
  },
];