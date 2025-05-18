import { CoinType } from "../../infrastructure/api/types/CoinTypes";

export interface CoincheckTradeConfig {
  coinType: CoinType;
  minimunTradeAmount: number;
  /**
   * 取引可能な小数点以下の桁数
   */
  decimal: number;
}