import { ResultSetHeader } from "mysql2";
import { query } from "./mysql";
import { MarketCurrenciesEntity } from "../entity/MarketCurrenciesEntity";
import { errorLogger } from "../infrastructure/logger/ErrorLogger";

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
    crossStatus: "golden" | "dead" | null,
  ): Promise<void> {
    // A simple INSERT query
    try {
      const result = await query<ResultSetHeader>(
        `INSERT INTO MarketCurrencies (market_id, currency_id, cross_status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE cross_status = VALUES(cross_status);`,
        [marketId, currencyId, crossStatus]
      );
    } catch (err) {
      errorLogger.error(err);
      throw new Error("価格履歴の追加に失敗しました");
    }
  }

  /**
   * 購入可能パーセントの更新
   */
  async updataAllPercent(): Promise<void> {
    // A simple INSERT query
    try {
      const result = await query<ResultSetHeader>(
        `UPDATE marketcurrencies mc 
    JOIN ( 
        SELECT
            t.market_id
            , t.currency_id
            , ( 
                AVG( 
                    CASE 
                        WHEN t.transaction_type = 'SELL' 
                            THEN t.price_per_unit 
                        END
                ) / NULLIF( 
                    AVG( 
                        CASE 
                            WHEN t.transaction_type = 'BUY' 
                                THEN t.price_per_unit 
                            END
                    ) 
                    , 0
                )
            ) AS sell_to_buy_quantity_ratio 
        FROM
            transactions t 
        WHERE
            t.active_flag = 1
            AND t.transaction_datetime >= '2025/06/06'
        GROUP BY
            t.market_id
            , t.currency_id
    ) AS ratios 
        ON mc.active_flag = 1
        AND mc.market_id = ratios.market_id
        AND mc.currency_id = ratios.currency_id 
SET
    mc.percent = CASE 
        WHEN ratios.sell_to_buy_quantity_ratio IS NULL 
            THEN 20 
        ELSE mc.percent * ratios.sell_to_buy_quantity_ratio 
        END;`,
        []
      );
    } catch (err) {
      errorLogger.error(err);
      throw new Error("市場銘柄の購入可能パーセントの更新に失敗しました");
    }
  }

  /**
   * 全件の取得
   * @returns 市場銘柄情報一覧
   */
  async selectAll(): Promise<MarketCurrenciesEntity[]> {
    try {
      const rows = await query<MarketCurrenciesEntity[]>(
        `SELECT *
         FROM MarketCurrencies
         WHERE active_flag = 1;`,
        []
      );
      return rows;
    } catch (err) {
      errorLogger.error(err);
      throw new Error("市場銘柄の取得に失敗しました");
    }
  }

  /**
   * 全件の取得
   * @returns 市場銘柄情報一覧
   */
  async selectByMarketId(marketId: number): Promise<MarketCurrenciesEntity[]> {
    try {
      const rows = await query<MarketCurrenciesEntity[]>(
        `SELECT *
         FROM MarketCurrencies
         WHERE active_flag = 1 AND market_id = ?;`,
        [marketId]
      );
      return rows;
    } catch (err) {
      errorLogger.error(err);
      throw new Error("市場銘柄の取得に失敗しました");
    }
  }

  /**
   * 市場銘柄情報を一件取得
   * @param marketId マーケットID
   * @param currencyId 通貨ID
   * @returns クロスステータス
   */
  async selectMarketCurrency(
    marketId: number,
    currencyId: number,
  ): Promise<MarketCurrenciesEntity> {
    try {
      const rows = await query<MarketCurrenciesEntity[]>(
        `SELECT *
         FROM MarketCurrencies
         WHERE active_flag = 1 AND market_id = ? AND currency_id = ?;`,
        [marketId, currencyId]
      );
      if (rows.length === 0) {
        throw new Error("指定された市場銘柄が存在しません");
      }
      return rows[0];
    } catch (err) {
      errorLogger.error(err);
      throw new Error("価格履歴の取得に失敗しました");
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
         WHERE active_flag = 1 AND market_id = ? AND currency_id = ?;`,
        [marketId, currencyId]
      );
      return rows.length > 0 ? rows[0].cross_status as "golden" | "dead" | null : null;
    } catch (err) {
      errorLogger.error(err);
      throw new Error("価格履歴の取得に失敗しました");
    }
  }

  /**
   * short_termとlong_termの更新
   * @param marketId マーケットID
   * @param currencyId 通貨ID
   * @param shortTerm 短期値
   * @param longTerm 長期値
   */
  async updateTerms(
    marketId: number,
    currencyId: number,
    shortTerm: number,
    longTerm: number
  ): Promise<void> {
    try {
      await query<ResultSetHeader>(
        `UPDATE MarketCurrencies
         SET short_term = ?, long_term = ?
         WHERE active_flag = 1 AND market_id = ? AND currency_id = ?;`,
        [shortTerm, longTerm, marketId, currencyId]
      );
    } catch (err) {
      errorLogger.error(err);
      throw new Error("short_termとlong_termの更新に失敗しました");
    }
  }

  /**
   * percentの更新
   * @param marketId マーケットID
   * @param currencyId 通貨ID
   * @param percent 購入可能パーセント
   */
  async updatePercent(
    marketCurrencyId: number,
    percent: number
  ): Promise<void> {
    try {
      await query<ResultSetHeader>(
        `UPDATE MarketCurrencies
         SET percent = ?
         WHERE active_flag = 1 AND market_currency_id = ?;`,
        [percent, marketCurrencyId]
      );
    } catch (err) {
      errorLogger.error(err);
      throw new Error("percentの更新に失敗しました");
    }
  }
}