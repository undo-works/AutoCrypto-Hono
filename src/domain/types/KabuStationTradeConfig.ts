import { CoincheckCoinType, KabuStationCoinType } from "../../infrastructure/api/types/CoinTypes";

export interface KabuStationTradeConfig {
  symbol: KabuStationCoinType;
  lotsize: number;
}