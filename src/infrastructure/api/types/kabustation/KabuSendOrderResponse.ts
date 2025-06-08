/**
 * Kabuステーションの注文レスポンスを表すインターフェース
 */
export interface KabuSendOrderResponse {
  /**
   * 結果コード（0: 正常終了）
   */
  Result: number;
  /**
   * 注文ID
   */
  OrderId: number;
}
