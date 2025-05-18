import { ResultSetHeader } from "mysql2";
import { query } from "./mysql";

/**
 * 価格履歴テーブル用のリポジトリ
 */
export class MarketCurrenciesRepository {
  /**
   * 価格履歴の追加もしくは更新
   */
  async upsertMarketCurrencies(
    marketId: number,
    currencyId: number,
    crossStatus: "golden" | "dead",
  ): Promise<void> {
    // A simple INSERT query
    try {
      const result = await query<ResultSetHeader>(
        `INSERT INTO MarketCurrencies (market_id, currency_id, cross_status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE cross_status = VALUES(cross_status);`,
        [marketId, currencyId, crossStatus]
      );
      if (result.affectedRows !== 1) {
        throw new Error("価格履歴の追加に失敗しました");
      }
    } catch (err) {
      console.log(err);
      throw new Error("価格履歴の追加に失敗しました");
    }
  }

  /**
   * クロスステータスの取得
   * @param marketId マーケットID
   * @param currencyId 通貨ID
   * @returns クロスステータス
   */
  async selectCrossStatus(
    marketId: number,
    currencyId: number,
  ): Promise<"golden" | "dead" | null> {
    try {
      const rows = await query<{ cross_status: "string" | null}[]>(
        `SELECT cross_status
         FROM MarketCurrencies
         WHERE market_id = ? AND currency_id = ?;`,
        [marketId, currencyId]
      );
      return rows.length > 0 ? rows[0].cross_status as "golden" | "dead" | null : null;
    } catch (err) {
      console.log(err);
      throw new Error("価格履歴の取得に失敗しました");
    }
  }
}