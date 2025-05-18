import { ResultSetHeader } from "mysql2";
import { query } from "./mysql";

/**
 * 価格履歴テーブル用のリポジトリ
 */
export class MarketPricesRepository {
  /**
   * 価格履歴の追加
   * @returns 成功失敗
   */
  async insertMarketPrice(
    marketId: number,
    currencyId: number,
    price: number,
  ): Promise<void> {
    // A simple INSERT query
    try {
      const postInfo = await query<ResultSetHeader>(
        `INSERT 
        INTO MarketPrices(market_id, currency_id, price)
        VALUES (?, ?, ?);`,
        [marketId, currencyId, price]
      );
      if (postInfo.affectedRows !== 1) {
        throw new Error("価格履歴の追加に失敗しました");
      }
    } catch (err) {
      console.log(err);
      throw new Error("価格履歴の追加に失敗しました");
    }
  }

  /**
   * 最新のデータから指定件数の価格履歴を取得
   * @param marketId マーケットID
   * @param currencyId 通貨ID
   * @param limit 取得件数
   * @returns 価格履歴の配列
   */
  async selectPriceLatest(
    marketId: number,
    currencyId: number,
    limit: number
  ): Promise<number[]> {
    try {
      const rows = await query<{price: number}[]>(
        `SELECT price
         FROM MarketPrices
         WHERE market_id = ? AND currency_id = ?
         ORDER BY market_id DESC
         LIMIT ?;`,
        [marketId, currencyId, limit]
      );
      return rows.map(row => Number(row.price));
    } catch (err) {
      console.log(err);
      throw new Error("価格履歴の取得に失敗しました");
    }
  }
}