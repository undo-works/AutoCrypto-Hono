/**
 * BinanceのオープンオーダーAPIレスポンスを表すインターフェース。
 */
export interface BinanceOpenOrderResponse {
  avgPrice: string;
  clientOrderId: string;
  cumQuote: string;
  executedQty: string;
  orderId: number;
  origQty: number;
  origType: string;
  price: number;
  reduceOnly: boolean;
  side: "BUY" | "SELL";
  positionSide: string;
  status: string;
  stopPrice: string;
  closePosition: boolean;
  symbol: string;
  time: number;
  timeInForce: string;
  type: string;
  activatePrice?: string;
  priceRate?: string;
  updateTime: number;
  workingType: string;
  priceProtect: boolean;
  priceMatch: string;
  selfTradePreventionMode: string;
  goodTillDate: number;
}