/**
 * Coincheckの注文レスポンスを表すインターフェース
 *
 * @property {boolean} success 処理が成功したかどうか
 * @property {number} id 注文ID
 * @property {string} rate 注文レート（価格）
 * @property {string} amount 注文数量
 * @property {"buy" | "sell"} order_type 注文タイプ（買いまたは売り）
 * @property {string} time_in_force 有効期限の種類
 * @property {string | null} stop_loss_rate ストップロスレート（設定されていない場合はnull）
 * @property {string} pair 通貨ペア
 * @property {string} created_at 注文作成日時（ISO8601形式）
 */
// Coincheckの注文レスポンスを表すインターフェース
export interface ExchangeOrderResponse {
  // 処理が成功したかどうか
  success: boolean;
  // 注文ID
  id: number;
  // 注文レート（価格）
  rate: string;
  // 注文数量
  amount: string;
  // 注文タイプ（買いまたは売り）
  order_type: "buy" | "sell";
  // 有効期限の種類
  time_in_force: string;
  // ストップロスレート（設定されていない場合はnull）
  stop_loss_rate: string | null;
  // 通貨ペア
  pair: string;
  // 注文作成日時（ISO8601形式）
  created_at: string;
}