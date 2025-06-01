/**
 * Binanceの取引ペアにおける24時間ティッカースタッツを表します。
 */
export interface Binance24hrTickerResponse {
  /**
   * 取引ペアのシンボル（例: "ETHBTC"）。
   */
  symbol: string;
  /**
   * 過去24時間の絶対的な価格変動。
   */
  priceChange: number;
  /**
   * 過去24時間の価格変動率（パーセント）。
   */
  priceChangePercent: number;
  /**
   * 過去24時間の加重平均価格。
   */
  weightedAvgPrice: number;
  /**
   * 前回の終値。
   */
  prevClosePrice: number;
  /**
   * 最新の取引価格。
   */
  lastPrice: number;
  /**
   * 最新の取引数量。
   */
  lastQty: number;
  /**
   * 現在の最高買い注文価格。
   */
  bidPrice: number;
  /**
   * 最高買い注文価格での数量。
   */
  bidQty: number;
  /**
   * 現在の最安売り注文価格。
   */
  askPrice: number;
  /**
   * 最安売り注文価格での数量。
   */
  askQty: number;
  /**
   * 24時間前の始値。
   */
  openPrice: number;
  /**
   * 過去24時間の最高値。
   */
  highPrice: number;
  /**
   * 過去24時間の最安値。
   */
  lowPrice: number;
  /**
   * 過去24時間の基軸通貨の取引量合計。
   */
  volume: number;
  /**
   * 過去24時間の見積通貨の取引量合計。
   */
  quoteVolume: number;
  /**
   * オープン時刻（エポックミリ秒）。
   */
  openTime: number;
  /**
   * クローズ時刻（エポックミリ秒）。
   */
  closeTime: number;
  /**
   * 過去24時間の最初の取引ID。
   */
  firstId: number;
  /**
   * 過去24時間の最後の取引ID。
   */
  lastId: number;
  /**
   * 過去24時間の取引回数。
   */
  count: number;
}