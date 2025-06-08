/**
 * BinanceのオープンオーダーAPIレスポンスを表すインターフェース。
 */
/**
 * Represents the response structure for an open order from Binance API.
 *
 * @property avgPrice - 平均約定価格（文字列形式）。
 * @property clientOrderId - クライアントが指定した注文ID。
 * @property cumQuote - 約定した合計クォート資産量（文字列形式）。
 * @property executedQty - 約定済み数量（文字列形式）。
 * @property orderId - 注文ID（Binanceが割り当てる一意のID）。
 * @property origQty - 元々の注文数量（文字列形式）。
 * @property origType - 元々の注文タイプ（例: LIMIT, MARKET）。
 * @property price - 注文価格。
 * @property reduceOnly - ポジションを減らす注文かどうか。
 * @property side - 売買区分（"BUY" または "SELL"）。
 * @property positionSide - ポジション区分（"LONG", "SHORT", "BOTH" など）。
 * @property status - 注文の状態（例: NEW, FILLED, CANCELED）。
 * @property stopPrice - ストップ価格（文字列形式）。
 * @property closePosition - ポジションをクローズする注文かどうか。
 * @property symbol - 取引ペアのシンボル（例: BTCUSDT）。
 * @property time - 注文作成時刻（UNIXタイムスタンプ、ミリ秒）。
 * @property timeInForce - 執行数量条件（例: GTC, IOC, FOK）。
 * @property type - 注文タイプ（例: LIMIT, MARKET, STOP）。
 * @property activatePrice - トリガー注文の発動価格（オプション）。
 * @property priceRate - トリガー注文の価格レート（オプション）。
 * @property updateTime - 注文情報の最終更新時刻（UNIXタイムスタンプ、ミリ秒）。
 * @property workingType - トリガー注文の判定価格タイプ（例: MARK_PRICE, CONTRACT_PRICE）。
 * @property priceProtect - 価格保護が有効かどうか。
 * @property priceMatch - 価格一致タイプ（例: "NONE", "LAST_PRICE" など）。
 * @property selfTradePreventionMode - セルフトレード防止モード。
 * @property goodTillDate - 有効期限（UNIXタイムスタンプ、ミリ秒）。
 */
export interface BinanceOpenOrderResponse {
  avgPrice: string;
  clientOrderId: string;
  cumQuote: string;
  executedQty: number;
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