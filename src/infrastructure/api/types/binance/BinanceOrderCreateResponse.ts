/**
 * Binance注文作成APIのレスポンス
 */
export interface BinanceOrderCreateResponse {
  /**
   * 取引ペアのシンボル（例: 'NEARBNB'）
   */
  symbol: string;
  /**
   * 注文ID
   */
  orderId: number;
  /**
   * 注文リストID（OCO注文で使用、通常は-1）
   */
  orderListId: number;
  /**
   * クライアントが指定した注文ID
   */
  clientOrderId: string;
  /**
   * 取引のタイムスタンプ（ミリ秒）
   */
  transactTime: number;
  /**
   * 注文価格
   */
  price: string;
  /**
   * 元の注文数量
   */
  origQty: string;
  /**
   * 約定済み数量
   */
  executedQty: string;
  /**
   * 元の見積もり注文数量
   */
  origQuoteOrderQty: string;
  /**
   * 累積見積もり数量
   */
  cummulativeQuoteQty: string;
  /**
   * 注文ステータス（例: 'NEW'）
   */
  status: string;
  /**
   * 執行有効期間（例: 'GTC'）
   */
  timeInForce: string;
  /**
   * 注文タイプ（例: 'LIMIT'）
   */
  type: string;
  /**
   * 売買区分（例: 'BUY'）
   */
  side: string;
  /**
   * 注文が有効になった時刻（ミリ秒）
   */
  workingTime: number;
  /**
   * 約定情報の配列
   */
  fills: any[];
  /**
   * セルフトレード防止モード
   */
  selfTradePreventionMode: string;
}