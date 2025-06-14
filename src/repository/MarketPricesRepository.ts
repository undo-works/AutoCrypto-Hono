import { ResultSetHeader } from "mysql2";
import { query } from "./mysql";
import { errorLogger } from "../infrastructure/logger/ErrorLogger";

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
      errorLogger.error(err);
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
      const rows = await query<{ price: number }[]>(
        `SELECT price
         FROM MarketPrices
         WHERE market_id = ? AND currency_id = ?
         ORDER BY price_id DESC
         LIMIT ?;`,
        [marketId, currencyId, limit]
      );
      return rows.map(row => Number(row.price));
    } catch (err) {
      errorLogger.error(err);
      throw new Error("価格履歴の取得に失敗しました");
    }
  }

  /**
 * 最新のデータから指定件数の価格履歴を取得(移動平均求めたりで使う)
 * @param marketId マーケットID
 * @param currencyId 通貨ID
 * @param limit 取得件数
 * @returns 価格履歴の配列
 */
  async fetchPriceData(
    marketId: number,
    currencyId: number,
  ): Promise<number[]> {
    try {
      const rows = await query<{ price: number }[]>(
        `SELECT price FROM marketprices
         WHERE market_id = ? AND currency_id = ? AND record_datetime >= "2025/06/01"
         ORDER BY record_datetime ASC`,
        [marketId, currencyId] // 必要に応じてIDを変更
      );
      return rows.map((row) => Number(row.price));
    } catch (err) {
      errorLogger.error(err);
      throw new Error("価格履歴の取得に失敗しました");
    }
  }
}