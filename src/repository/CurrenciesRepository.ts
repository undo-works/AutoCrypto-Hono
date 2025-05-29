import { CurrenciesEntity } from "../entity/CurrenciesEntity";
import { query } from "./mysql";

/**
 * 銘柄情報を取得するリポジトリ
 */
export class CurrenciesRepository {
  /**
   * 銘柄名から情報を取得する
   * @returns 銘柄全件
   */
  async selectAll(): Promise<CurrenciesEntity[]> {
    // A simple SELECT query
    try {
      const results = await query<CurrenciesEntity[]>(
        `SELECT * FROM currencies;`,
        []
      );
      return results;
    } catch (err) {
      console.log(err);
      throw new Error("銘柄名から情報を取得することができませんでした");
    }
  }

  /**
   * 銘柄名から情報を取得する
   * @returns 銘柄一件
   */
  async selectByCurrencyId(currencyId: number): Promise<CurrenciesEntity> {
    // A simple SELECT query
    try {
      const results = await query<CurrenciesEntity[]>(
        `SELECT * FROM currencies WHERE currency_id = ?;`,
        [currencyId]
      );
      return results[0];
    } catch (err) {
      console.log(err);
      throw new Error("銘柄名から情報を取得することができませんでした");
    }
  }

  /**
   * シンボルから情報を取得する
   * @param symbol 銘柄シンボル
   * @returns 銘柄一件
   */
  async selectBySymbol(symbol: string): Promise<CurrenciesEntity> {
    try {
      const results = await query<CurrenciesEntity[]>(
        `SELECT * FROM currencies WHERE symbol = ?;`,
        [symbol]
      );
      return results[0];
    } catch (err) {
      console.log(err);
      throw new Error("シンボルから情報を取得することができませんでした");
    }
  }
}