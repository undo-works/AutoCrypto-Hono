/**
 * Binanceの取引履歴レスポンスの型定義
 */
export interface BinanceMyTradeResponse {
  /**
   * 取引ペアのシンボル（例: "BNBBTC"）
   */
  symbol: string;
  /**
   * 取引ID
   */
  id: number;
  /**
   * 注文ID
   */
  orderId: number;
  /**
   * 注文リストID（OCO注文の場合、-1は該当なし）
   */
  orderListId: number;
  /**
   * 約定価格（文字列形式）
   */
  price: number;
  /**
   * 約定数量（文字列形式）
   */
  qty: number;
  /**
   * 約定のクォート数量（文字列形式）
   */
  quoteQty: number;
  /**
   * 手数料（文字列形式）
   */
  commission: number;
  /**
   * 手数料の通貨
   */
  commissionAsset: string;
  /**
   * 約定時刻（UNIXミリ秒）
   */
  time: number;
  /**
   * 買い手かどうか
   */
  isBuyer: boolean;
  /**
   * メイカーかどうか
   */
  isMaker: boolean;
  /**
   * ベストマッチかどうか
   */
  isBestMatch: boolean;
}